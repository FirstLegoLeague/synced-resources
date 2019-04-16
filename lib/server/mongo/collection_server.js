'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const Promise = require('bluebird')
const { MongoClient, ObjectID } = require('mongodb')
const { Logger } = require('@first-lego-league/ms-logger')
const { Messenger } = require('@first-lego-league/ms-messenger')

const { InvalidEntry } = require('../resources/errors/invalid_entry')

// TODO add authorization

class MongoCollectionServer extends express.Router {
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
    this._addCollectionGetRoute()
    this._addCollectionSearchRoute()
    this._addCollectionCountRoute()
    this._addCollectionDeleteRoute()
    
    this._addEntityCreateRoute()
    this._addEntityGetRoute()
    this._addEntityUpdateRoute()
    this._addEntityDeleteRoute()
  }

  _addCollectionGetRoute () {
    this.get('/', (req, res) => {
      this._useCollection(collection => {
        collection.find().toArray()
          .then(() => res.status(200).json(data.map(datum => this._model(datum).toJson())))
      })
    })
  }

  _addCollectionDeleteRoute () {
    this.delete('/', (req, res) => {
      this._useCollection(collection => {
        collection.deleteMany({})
          .then(() => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'clear' })
            res.sendStatus(204)
          })
      })
    })
  }

  _addCollectionSearchRoute () {
    this.get('/search', (req, res) => {
      this._useCollection(collection => {
        collection.find(req.query)
          .then(data => res.status(200).json(data.map(datum => this._model(datum).toJson())))
      })
    })
  }

  _addCollectionCountRoute () {
    this.get('/count', (req, res) => {
      this._useCollection(collection => {
        collection.count()
          .then(data => res.status(200).json({ count }))
      }, res)
    })
  }

  _addEntityCreateRoute () {
    this.post('/', (req, res) => {
      let entry = this._model(req.body)
      this._useCollection(collection => {
        entry.validate()
        collection.insertOne(entry.sanitize())
          .then(({ insertedId }) => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'create', entry: entry.toJson() })
            entry._id = insertedId
            res.status(200).json(entry)
          })
      }, res)
    })
  }

  _addEntityGetRoute () {
    this.get('/:id', (req, res) => {
      this._useCollection(collection => {
        collection.findOne({ _id: new ObjectID(req.params.id) })
          .then(data => res.status(200).json(this._model(data).toJson()))
      }, res)
    })
  }

  _addEntityUpdateRoute () {
    this.put('/:id', (req, res) => {
      this._useCollection(collection => {
        collection.findOne({ _id: new ObjectID(req.params.id) })
          .then(data => {
            const entry = this._model(data)
            Object.assign(entry, req.body)
            entry.validate()
            return collection.updateOne({ _id: new ObjectID(req.params.id) }, { $set: entry.sanitize() })
              .then(data => {
                this._messenger.send(`${this._model.name}:reload`, { action: 'update', entry: entry.toJson() })
                res.status(200).json(this._model(data).toJson())
              })
          })
          .then(() => res.sendStatus(204))
      }, res)
    })
  }

  _addEntityDeleteRoute () {
    this.delete('/:id', (req, res) => {
      this._useCollection(collection => {
        collection.deleteOne({ _id: new ObjectID(req.params.id) })
          .then(() => {
            this._messenger.send(`${this._model.name}:reload`, { action: 'delete', id: req.params.id })
            res.sendStatus(204)
          })
      }, res)
    }
  }

  _useCollection (callback, res) {
    this._connect()
      .then(callback)
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

  _connect () {
    if (!this._connectionPromise) {
      this._connectionPromise = MongoClient
        .connect(mongoUrl, { promiseLibrary: Promise, useNewUrlParser: true })
        .then(client => client.db().collection(this._model.name))
    }
    return this._connectionPromise
  }
}

exports.MongoCollectionServer = MongoCollectionServer
