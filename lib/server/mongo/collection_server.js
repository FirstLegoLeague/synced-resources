'use strict'

const { ObjectId } = require('mongodb')

const { AbstractMongoServer } = require('./abstract_server')

class MongoCollectionServer extends AbstractMongoServer {
  _addGetAllRoute () {
    this._addRoute('getAll', 'get', '/', (req, res) => {
      this._useCollection(collection => {
        return collection.find()
          .then(data => res.status(200).json(data.map(datum => new this._model(datum).toJson())))
      }, res)
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
      }, res)
    })
  }

  _addSearchRoute () {
    this._addRoute('search', 'get', '/search', (req, res) => {
      this._useCollection(collection => {
        return collection.find(req.query)
          .then(data => res.status(200).json(data.map(datum => new this._model(datum).toJson())))
      }, res)
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
      const entry = new this._model(req.body)
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
        return collection.findOne({ _id: new ObjectId(req.params.id) })
          .then(data => {
            if (data) {
              res.status(200).json(new this._model(data).toJson())
            } else {
              res.sendStatus(404)
            }
          })
      }, res)
    })
  }

  _addUpdateRoute () {
    this._addRoute('update', 'put', '/:id', (req, res) => {
      this._useCollection(collection => {
        return collection.findOne({ _id: new ObjectId(req.params.id) })
          .then(data => {
            if (data) {
              const entry = new this._model(data)
              Object.assign(entry, req.body)
              entry.validate()
              return collection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: entry.sanitize() })
                .then(() => {
                  this._messenger.send(`${this._model.name}:reload`, { action: 'update', entry: entry.toJson() })
                  res.status(200).json(new this._model(data).toJson())
                })
            } else {
              res.sendStatus(404)
            }
          })
      }, res)
    })
  }

  _addDeleteRoute () {
    this._addRoute('delete', 'delete', '/:id', (req, res) => {
      this._useCollection(collection => {
        return collection.deleteOne({ _id: new ObjectId(req.params.id) })
          .then(({ deletedCount }) => {
            if (deletedCount === 0) {
              res.sendStatus(404)
            } else {
              this._messenger.send(`${this._model.name}:reload`, { action: 'delete', id: req.params.id })
              res.sendStatus(204)
            }
          })
      }, res)
    })
  }

  _useCollection (callback, res) {
    this._connect()
      .then(callback) // eslint-disable-line promise/no-callback-in-promise
      .catch(error => {
        if (error.constructor.name === 'InvalidEntry') {
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
