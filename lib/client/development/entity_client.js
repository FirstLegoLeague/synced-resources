'use strict'

const EventEmitter = require('event-emitter-es6')
const Promise = require('bluebird')

class EntityClient extends EventEmitter {
  constructor (model) {
    super()
    this._model = model
    this.data = this._model.developmentCollection()
  }

  init () {
    return Promise.resolve()
  }

  set () {
    // DO NOTHING
  }
}

exports.EntityClient = EntityClient
