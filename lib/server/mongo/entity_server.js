const Promise = require('bluebird')

const { AbstractMongoServer } = require('./abstract_server')

class MongoEntityServer extends AbstractMongoServer {
  constructor (Model, options = {}) {
    super(Model, options)

    if (options.initialValue) {
      this._useEntry(data => {
        this._connect()
          .then(collection => collection.updateOne({ }, this._newEntry(data || options.initialValue).toJson()))
          .catch(() => this._logger.error(`Could'nt write default value of ${this._Model.name}.`))
      })
    }
  }

  _addGetRoute () {
    this._addRoute('get', 'get', '/', (req, res) => {
      this._useEntry(data => {
        res.status(200).json(this._newEntry(data).toJson())
      }, res)
    })
  }

  _addGetFieldRoute () {
    this._addRoute('getField', 'get', '/:field', (req, res) => {
      this._useEntry(data => {
        const json = this._newEntry(data).toJson()
        if (json.hasOwnProperty(req.params.field)) {
          res.status(200).json(json[req.params.field])
        } else {
          res.sendStatus(404)
        }
      }, res)
    })
  }

  _addSetRoute () {
    this._addRoute('set', 'post', '/', (req, res) => {
      this._useEntry(data => {
        const entry = this._newEntry(Object.assign(data, req.body))
        return Promise.resolve(entry.validate())
          .then(() => this._connect())
          .then(collection => collection.updateOne({ }, entry))
          .then(() => {
            this._messenger.send(`${this._Model.name}:reload`, { action: 'updated', entry: entry.toJson() })
            res.sendStatus(204)
          })
      }, res)
    })
  }

  _useEntry (callback, res) {
    this._connect()
      .then(collection => collection.findOne({ query: { }, upsert: true }))
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

exports.MongoEntityServer = MongoEntityServer
