const { AbstractMongoServer } = require('./abstract_server')

class MongoCollectionServer extends AbstractMongoServer {
  _addGetAllRoute () {
    this._addRoute('getAll', 'get', '/', (req, res) => {
      this._adapter.all()
        .then(data => res.status(200).json(data))
        .catch(this._handleError(res))
    })
  }

  _addDeleteAllRoute () {
    this._addRoute('deleteAll', 'delete', '/', (req, res) => {
      this._adapter.deleteAll()
        .then(() => {
          this._messenger.send(`${this._Model.name}:reload`, { action: 'clear' })
          res.sendStatus(204)
        })
        .catch(this._handleError(res))
    })
  }

  _addSearchRoute () {
    this._addRoute('search', 'get', '/search', (req, res) => {
      this._adapter.search(req.query)
        .then(data => res.status(200).json(data.map(entry => entry.toJson())))
        .catch(this._handleError(res))
    })
  }

  _addCountRoute () {
    this._addRoute('count', 'get', '/count', (req, res) => {
      this._adapter.count()
        .then(count => res.status(200).json({ count }))
        .catch(this._handleError(res))
    })
  }

  _addCreateRoute () {
    this._addRoute('create', 'post', '/', (req, res) => {
      this._adapter.create(req.body)
        .then(entry => {
          this._messenger.send(`${this._Model.name}:reload`, { action: 'create', entry: entry.toJson() })
          res.status(200).json(entry)
        })
        .catch(this._handleError(res))
    })
  }

  _addGetRoute () {
    this._addRoute('get', 'get', '/:id', (req, res) => {
      this._adapter.get(req.params.id)
        .then(entry => res.status(200).json(entry.toJson()))
        .catch(this._handleError(res))
    })
  }

  _addUpdateRoute () {
    this._addRoute('update', 'put', '/:id', (req, res) => {
      this._adapter.update(req.params.id, req.body)
        .then(entry => {
          this._messenger.send(`${this._Model.name}:reload`, { action: 'update', entry: entry.toJson() })
          res.status(200).json(entry.toJson())
        })
        .catch(this._handleError(res))
    })
  }

  _addDeleteRoute () {
    this._addRoute('delete', 'delete', '/:id', (req, res) => {
      this._adapter.delete(req.params.id)
        .then(({ deletedCount }) => {
          if (deletedCount === 0) {
            res.sendStatus(404)
          } else {
            this._messenger.send(`${this._Model.name}:reload`, { action: 'delete', id: req.params.id })
            res.sendStatus(204)
          }
        })
        .catch(this._handleError(res))
    })
  }
}

exports.MongoCollectionServer = MongoCollectionServer
