const Promise = require('bluebird')

const { AbstractMongoServer } = require('./abstract_server')

class MongoCollectionServer extends AbstractMongoServer {
  _addGetAllRoute () {
    this._addRoute('getAll', 'get', '/', (req, res) => {
      this._useCollection(collection => {
        return this._all()
          .then(data => res.status(200).json(data))
      }, res)
    })
  }

  _addDeleteAllRoute () {
    this._addRoute('deleteAll', 'delete', '/', (req, res) => {
      this._useCollection(collection => {
        return Promise.resolve(collection.deleteMany({}))
          .then(() => {
            this._messenger.send(`${this._Model.name}:reload`, { action: 'clear' })
            res.sendStatus(204)
          })
      }, res)
    })
  }

  _addSearchRoute () {
    this._addRoute('search', 'get', '/search', (req, res) => {
      this._useCollection(collection => {
        return Promise.resolve(collection.find(req.query).toArray())
          .then(data => res.status(200).json(data.map(datum => this._newEntry(datum).toJson())))
      }, res)
    })
  }

  _addCountRoute () {
    this._addRoute('count', 'get', '/count', (req, res) => {
      this._useCollection(collection => {
        return Promise.resolve(collection.count())
          .then(count => res.status(200).json({ count }))
      }, res)
    })
  }

  _addCreateRoute () {
    this._addRoute('create', 'post', '/', (req, res) => {
      const entry = this._newEntry(req.body)
      this._useCollection(collection => {
        return this._all()
          .then(allEntries => entry.validate({ collection: allEntries }))
          .then(() => collection.insertOne(entry.toJson()))
          .then(({ insertedId }) => {
            this._messenger.send(`${this._Model.name}:reload`, { action: 'create', entry: entry.toJson() })
            entry._id = insertedId
            res.status(200).json(entry)
          })
      }, res)
    })
  }

  _addGetRoute () {
    this._addRoute('get', 'get', '/:id', (req, res) => {
      this._useCollection(collection => {
        return Promise.resolve(collection.findOne({ _id: req.params.id }))
          .then(data => {
            if (data) {
              res.status(200).json(this._newEntry(data).toJson())
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
        return Promise.resolve(collection.findOne({ _id: req.params.id }))
          .then(data => {
            if (data) {
              const entry = this._newEntry(data)
              Object.assign(entry, req.body)
              return this._all()
                .then(allEntries => entry.validate({ collection: allEntries }))
                .then(() => collection.updateOne({ _id: req.params.id }, { $set: entry }))
                .then(() => {
                  this._messenger.send(`${this._Model.name}:reload`, { action: 'update', entry: entry.toJson() })
                  res.status(200).json(this._newEntry(data).toJson())
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
        return Promise.resolve(collection.deleteOne({ _id: req.params.id }))
          .then(({ deletedCount }) => {
            if (deletedCount === 0) {
              res.sendStatus(404)
            } else {
              this._messenger.send(`${this._Model.name}:reload`, { action: 'delete', id: req.params.id })
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

  _all () {
    return this._connect()
      .then(collection => collection.find({}).toArray())
      .then(data => data.map(datum => this._newEntry(datum)))
  }
}

exports.MongoCollectionServer = MongoCollectionServer
