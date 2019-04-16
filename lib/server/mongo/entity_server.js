'use strict'

const express = require('express')
const Promise = require('bluebird')
const { Logger } = require('@first-lego-league/ms-logger')
const { MongoClient, ObjectID } = require('mongodb')
const bodyParser = require('body-parser')
const { Messenger } = require('@first-lego-league/ms-messenger')

const { InvalidEntry } = require('../resources/errors/invalid_entry')

// TODO add authorization

class MongoEntityServer extends express.Router {
  initialize (model) {
    super()
    this._model = model
    this._logger = new Logger()
    this._messenger = new Messenger({
      clientId: this._model.name,
      logger: this._logger,
      node: 'protected',
      credentials: {
        username: 'protected-client',
        password: process.env.PROTECTED_MHUB_PASSWORD
      }
    })

    this.use(bodyParser.json())
    this.use(bodyParser.urlencoded({ extended: true }))
  }

  close () {
    this._addEntityGetRoute()
    this._addFieldGetRoute()
    this._addEntitySetRoute()
  }

  _addEntityGetRoute () {
    this.get('/', (req, res) => {
      this._item()
        .then(data => res.status(200).json(this._model(data).toJson()))
        .catch(err => {
          this._logger.error(err)
          res.sendStatus(500)
        })
    })
  }

  _addFieldGetRoute () {
    this.get('/:field', (req, res) => {
      this._item()
        .then(data => res.status(200).json(this._model(data).toJson()[req.params.field]))
        .catch(err => {
          this._logger.error(err)
          res.sendStatus(500)
        })
    })
  }

  _addEntitySetRoute () {
    this.post('/', (req, res) => {
      this._connect()
        .then(collection => {
          const entry = this._model(req.body)
          entry.validate()
          collection.updateOne({ }, entry.sanitize())
          .then(() => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'updated', entry: entry.toJson() })
            this.sendStatus(204)
          })
        })
        .catch(error => {
          if(err instanceof InvalidEntry) {
            this._logger.warn(error)
            res.sendStatus(422)
          } else {
            this._logger.error(error)
            res.sendStatus(500)
          }
        })
    })
  }

  _item () {
    return this._connect()
      .then(collection => collection.findOne({ query: { }, upsert: true }))
  }

  _connect () {
    if (!this._connectionPromise) {
      this._connectionPromise = MongoClient
        .connect(mongoUrl, { promiseLibrary: Promise, useNewUrlParser: true })
        .then(client => client.db().collection(this._model.name))
    }
    return this._connectionPromise
  }
}

exports.MongoEntityServer = MongoEntityServer
