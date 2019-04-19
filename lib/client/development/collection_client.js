'use strict'

const EventEmitter = require('event-emitter-es6')
const Promise = require('bluebird')

class CollectionClient extends EventEmitter {
  constructor (model) {
    super()
    this._model = model
    this.data = this._model.developmentEntity()
  }

  init () {
    return Promise.resolve()
  }

  clear () {
    // DO NOTHING
  }

  create () {
    // DO NOTHING
  }

  update () {
    // DO NOTHING
  }

  delete () {
    // DO NOTHING
  }
}

exports.CollectionClient = CollectionClient
