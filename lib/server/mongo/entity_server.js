const { AbstractMongoServer } = require('./abstract_server')

const { NotFound } = require('../../resources/errors/not_found')

const ID = 'entity-id'

class MongoEntityServer extends AbstractMongoServer {
  constructor (Model, options = {}) {
    super(Model, options)

    if (options.initialValue) {
      this._adapter.get(ID)
        .then(existingEntry => {
          const updatedEntry = this._adapter.newEntry(existingEntry || options.initialValue).toJson()

          return this._adapter.update(ID, updatedEntry)
        })
        .catch(() => this._logger.error(`Could'nt write default value of ${this._Model.name}.`))
    }
  }

  _addGetRoute () {
    this._addRoute('get', 'get', '/', (req, res) => {
      this._adapter.get(ID)
        .then(entry => res.status(200).json(entry.toJson()))
        .catch(error => {
          if (error.constructor.name === 'NotFound') {
            res.status(200).json(this._adapter.newEntry({ }))
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
        .then(entry => {
          const json = entry ? entry.toJson() : this._adapter.newEntry({})
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
        .then(entry => {
          this._messenger.send(`${this._Model.name}:reload`, { action: 'updated', entry: entry.toJson() })
          res.sendStatus(204)
        })
        .catch(this._handleError(res))
    })
  }
}

exports.MongoEntityServer = MongoEntityServer
