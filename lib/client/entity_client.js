const EventEmitter = require('event-emitter-es6')
const { Messenger } = require('@first-lego-league/ms-messenger')
const { client } = require('@first-lego-league/ms-client')

class EntityClient extends EventEmitter {
  constructor (model, resourceServerUrl) {
    super()
    this._model = model
    this._resourceServerUrl = resourceServerUrl
    this.data = undefined
    this._messenger = new Messenger({ node: 'protected' })
    this._client = client
  }

  init () {
    return this._messenger.on(`${this._model.name}:reload`, data => {
      this.data = new this._model(data)
      this.emit('reload', data)
    })
      .then(() => client.get(this._resourceServerUrl))
      .then(({ data }) => { this.data = new this._model(data) })
  }

  set (newData) {
    this._messenger.ignoreNextMessage(`${this._model.name}:reload`)
    return client.post(this._resourceServerUrl, newData)
      .then(({ data }) => { this.data = new this._model(data) })
  }
}

exports.EntityClient = EntityClient
