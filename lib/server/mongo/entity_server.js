'use strict'

const { AbstractMongoServer } = require('./abstract_server')

const { InvalidEntry } = require('../../resources/errors/invalid_entry')

class MongoEntityServer extends AbstractMongoServer {
  _addGetRoute () {
    this._addRoute('get', 'get', '/', (req, res) => {
      this._useEntry(data => {
        res.status(200).json(new this._model(data).toJson())
      }, res)
    })
  }

  _addGetFieldRoute () {
    this._addRoute('getField', 'get', '/:field', (req, res) => {
      this._useEntry(data => {
        const json = new this._model(data).toJson()
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
        const entry = new this._model(Object.assign(data, req.body))
        return entry.validate()
          .then(() => this._connect())
          .then(collection => collection.updateOne({ }, entry.sanitize()))
          .then(() => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'updated', entry: entry.toJson() })
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
