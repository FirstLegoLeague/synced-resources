const { AbstractMongoServer } = require('./abstract_server')

const { NotFound } = require('../../resources/errors/not_found')

const ID = 'entity-id'

class MongoEntityServer extends AbstractMongoServer {
  constructor (Model, options = {}) {
    super(Model, options)

    if (options.initialValue) {
      this._adapter.get(ID)
        .then(existingEntry => this._adapter.newEntry(Object.assign({ }, options.initialValue, existingEntry)).toJson())
        .then(updatedEntry => this._adapter.update(ID, updatedEntry))
        .catch(error => {
          if (error instanceof NotFound) {
            return this._adapter.create(Object.assign({ _id: ID }, options.initialValue))
          } else {
            this._logger.error(`Could'nt write default value of ${this._Model.name}: ${error.message}`)
          }
        })
    }
  }

  _addGetRoute () {
    this._addRoute('get', 'get', '/', (req, res) => {
      this._adapter.get(ID)
        .then(entry => this._adapater.sendingJson(entry))
        .then(json => res.status(200).json(json))
        .catch(error => {
          if (error.constructor.name === 'NotFound') {
            return this._adapter.create(Object.assign({ _id: ID }, this._options.initialValue || { }))
              .then(entry => this._adapater.sendingJson(entry))
              .then(json => res.status(200).json(json))
          } else {
            throw error
          }
        })
        .catch(this._handleError(res))
    })
  }

  _addGetFieldRoute () {
    this._addRoute('getField', 'get', '/:field', (req, res) => {
      this._adapter.get(ID)
        .catch(error => {
          if (error.constructor.name === 'NotFound') {
            return this._adapter.newEntry({ })
          } else {
            throw error
          }
        })
        .catch(error => {
          if (error.constructor.name === 'NotFound') {
            return this._adapter.create(Object.assign({ _id: ID }, this._options.initialValue || { }))
          } else {
            throw error
          }
        })
        .then(entry => this._adapater.sendingJson(entry))
        .then(json => {
          if (json.hasOwnProperty(req.params.field)) {
            res.status(200).json(json[req.params.field])
          } else {
            res.sendStatus(404)
          }
        })
        .catch(this._handleError(res))
    })
  }

  _addSetRoute () {
    this._addRoute('set', 'post', '/', (req, res) => {
      return this._adapter.update(ID, req.body)
        .then(entry => res.status(200).json(entry))
        .catch(this._handleError(res))
    })
  }
}

exports.MongoEntityServer = MongoEntityServer
