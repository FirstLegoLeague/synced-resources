const EventEmitter = require('event-emitter-es6')
const { createMessenger } = require('@first-lego-league/ms-messenger')
const { createClient } = require('@first-lego-league/ms-client')

class AbstractClient extends EventEmitter {
  constructor (Model, resourceServerUrl, options = {}) {
    super()
    this._Model = Model
    this._options = options
    this._resourceServerUrl = resourceServerUrl
    this._messenger = createMessenger(Object.assign({ node: 'protected' }, options.messengerOptions || {}))
    this._client = createClient(Object.assign({ independent: true }, options.clientOptions || {}))
    this._initPromise = undefined

    if (this._options.autoInit) {
      this.init()
    }
  }

  init () {
    if (!this._initPromise) {
      this._initPromise = this._messenger.on(`${this._Model.name}:reload`, data => {
        this._parseMessengerData(data)
        this.emit('reload', data)
      })
        .then(() => this._client.get(this._resourceServerUrl))
        .then(({ data }) => { this._parseHTTPData(data) })
    }
    return this._initPromise
  }

  _dataFromMessenger () {
    throw new Error('Unimplemented method error')
  }

  _dataFromURL () {
    throw new Error('Unimplemented method error')
  }

  _ignoreNextMessage () {
    this._messenger.ignoreNextMessageOfTopic(`${this._Model.name}:reload`)
  }

  _newEntry (data) {
    const entry = new this._Model(data)
    if (this._options.afterCreate) {
      this._options.afterCreate(entry)
    }
    return entry
  }
}

exports.AbstractClient = AbstractClient
