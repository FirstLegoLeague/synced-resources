const Promise = require('bluebird')

const { AbstractMongoServer } = require('./abstract_server')

class MongoCollectionServer extends AbstractMongoServer {
  _addGetAllRoute () {
    this._addRoute('getAll', 'get', '/', (req, res) => {
      this._adapter.all()
        .then(data => Promise.all(data.map(entry => this._adapater.sendingJson(entry))))
        .then(json => res.status(200).json(json))
        .catch(this._handleError(res))
    })
  }

  _addDeleteAllRoute () {
    this._addRoute('deleteAll', 'delete', '/', (req, res) => {
      this._adapter.deleteAll()
        .then(() => res.sendStatus(204))
        .catch(this._handleError(res))
    })
  }

  _addSearchRoute () {
    this._addRoute('search', 'get', '/search', (req, res) => {
      this._adapter.search(req.query)
        .then(data => Promise.all(data.map(entry => this._adapater.sendingJson(entry))))
        .then(json => res.status(200).json(json))
        .then(data => res.status(200).json())
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
        .then(entry => this._adapater.sendingJson(entry))
        .then(json => res.status(200).json(json))
        .catch(this._handleError(res))
    })
  }

  _addGetRoute () {
    this._addRoute('get', 'get', '/:id', (req, res) => {
      this._adapter.get(req.params.id)
        .then(entry => this._adapater.sendingJson(entry))
        .then(json => res.status(200).json(json))
        .catch(this._handleError(res))
    })
  }

  _addUpdateRoute () {
    this._addRoute('update', 'put', '/:id', (req, res) => {
      this._adapter.update(req.params.id, req.body)
        .then(entry => this._adapater.sendingJson(entry))
        .then(json => res.status(200).json(json))
        .catch(this._handleError(res))
    })
  }

  _addDeleteRoute () {
    this._addRoute('delete', 'delete', '/:id', (req, res) => {
      this._adapter.delete(req.params.id)
        .then(() => res.sendStatus(204))
        .catch(this._handleError(res))
    })
  }
}

exports.MongoCollectionServer = MongoCollectionServer
