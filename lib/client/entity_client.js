const EventEmitter = require('event-emitter-es6')
const { createMessenger } = require('@first-lego-league/ms-messenger')
const { createClient } = require('@first-lego-league/ms-client')

class EntityClient extends EventEmitter {
  constructor (Model, resourceServerUrl, options = {}) {
    super()
    this._Model = Model
    this._options = options
    this._resourceServerUrl = resourceServerUrl
    this.data = undefined
    this._messenger = createMessenger({ node: 'protected' })
    this._client = createClient(Object.assign({ independent: true }, options.clientOptions || {}))

    if (this._options.autoInit) {
      return this.init()
    }
  }

  init () {
    return this._messenger.on(`${this._Model.name}:reload`, data => {
      this.data = new this._Model(data)
      this.emit('reload', data)
    })
      .then(() => this._client.get(this._resourceServerUrl))
      .then(({ data }) => { this.data = this._newEntry(data) })
  }

  set (newData) {
    this._messenger.ignoreNextMessage(`${this._Model.name}:reload`)
    return this._client.post(this._resourceServerUrl, newData)
      .then(({ data }) => { this.data = this._newEntry(data) })
  }

  _newEntry (data) {
    const entry = new this._Model(data)
    if (this._options.afterCreate) {
      this._options.afterCreate(entry)
    }
    return entry
  }
}

exports.EntityClient = EntityClient
