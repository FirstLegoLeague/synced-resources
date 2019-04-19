'use strict'

const { ObjectID } = require('mongodb')

const { AbstractMongoServer } = require('./abstract_server')

const { InvalidEntry } = require('../../resources/errors/invalid_entry')

class MongoCollectionServer extends AbstractMongoServer {
  _addGetAllRoute () {
    this._addRoute('getAll', 'get', '/', (req, res) => {
      this._useCollection(collection => {
        return collection.find().toArray()
          .then(data => res.status(200).json(data.map(datum => this._model(datum).toJson())))
      })
    })
  }

  _addDeleteAllRoute () {
    this._addRoute('deleteAll', 'delete', '/', (req, res) => {
      this._useCollection(collection => {
        return collection.deleteMany({})
          .then(() => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'clear' })
            res.sendStatus(204)
          })
      })
    })
  }

  _addSearchRoute () {
    this._addRoute('search', 'get', '/search', (req, res) => {
      this._useCollection(collection => {
        return collection.find(req.query)
          .then(data => res.status(200).json(data.map(datum => this._model(datum).toJson())))
      })
    })
  }

  _addCountRoute () {
    this._addRoute('count', 'get', '/count', (req, res) => {
      this._useCollection(collection => {
        return collection.count()
          .then(count => res.status(200).json({ count }))
      }, res)
    })
  }

  _addCreateRoute () {
    this._addRoute('create', 'post', '/', (req, res) => {
      const entry = this._model(req.body)
      this._useCollection(collection => {
        entry.validate()
        return collection.insertOne(entry.sanitize())
          .then(({ insertedId }) => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'create', entry: entry.toJson() })
            entry._id = insertedId
            res.status(200).json(entry)
          })
      }, res)
    })
  }

  _addGetRoute () {
    this._addRoute('get', 'get', '/:id', (req, res) => {
      this._useCollection(collection => {
        return collection.findOne({ _id: new ObjectID(req.params.id) })
          .then(data => res.status(200).json(this._model(data).toJson()))
      }, res)
    })
  }

  _addUpdateRoute () {
    this._addRoute('update', 'put', '/:id', (req, res) => {
      this._useCollection(collection => {
        return collection.findOne({ _id: new ObjectID(req.params.id) })
          .then(data => {
            const entry = this._model(data)
            Object.assign(entry, req.body)
            entry.validate()
            return collection.updateOne({ _id: new ObjectID(req.params.id) }, { $set: entry.sanitize() })
              .then(() => {
                this._messenger.send(`${this._model.name}:reload`, { action: 'update', entry: entry.toJson() })
                res.status(200).json(this._model(data).toJson())
              })
          })
          .then(() => res.sendStatus(204))
      }, res)
    })
  }

  _addDeleteRoute () {
    this._addRoute('delete', 'delete', '/:id', (req, res) => {
      this._useCollection(collection => {
        return collection.deleteOne({ _id: new ObjectID(req.params.id) })
          .then(() => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'delete', id: req.params.id })
            res.sendStatus(204)
          })
      }, res)
    })
  }

  _useCollection (callback, res) {
    this._connect()
      .then(callback) // eslint-disable-line promise/no-callback-in-promise
      .catch(error => {
        if (error instanceof InvalidEntry) {
          this._logger.warn(error)
          res.sendStatus(422)
        } else {
          this._logger.error(error)
          res.sendStatus(500)
        }
      })
  }
}

exports.MongoCollectionServer = MongoCollectionServer
