'use strict'

const { AbstractMongoServer } = require('./abstract_server')

const { InvalidEntry } = require('../../resources/errors/invalid_entry')

class MongoEntityServer extends AbstractMongoServer {
  _addGetRoute () {
    this._addRoute('get', 'get', '/', (req, res) => {
      this._useEntry(data => {
        res.status(200).json(this._model(data).toJson())
      }, res)
    })
  }

  _addGetFieldRoute () {
    this._addRoute('getField', 'get', '/:field', (req, res) => {
      this._useEntry(data => {
        res.status(200).json(this._model(data).toJson()[req.params.field])
      }, res)
    })
  }

  _addSetRoute () {
    this._addRoute('set', 'post', '/', (req, res) => {
      this._useEntry(data => {
        const entry = this._model(Object.assign(data, req.body))
        entry.validate()
        return this._connect()
          .then(collection => collection.updateOne({ }, entry.sanitize()))
          .then(() => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'updated', entry: entry.toJson() })
            this.sendStatus(204)
          })
      }, res)
    })
  }

  _useEntry (callback, res) {
    this._connect()
      .then(collection => collection.findOne({ query: { }, upsert: true }))
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

exports.MongoEntityServer = MongoEntityServer
