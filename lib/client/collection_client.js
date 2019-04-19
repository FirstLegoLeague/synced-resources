'use strict'

const EventEmitter = require('event-emitter-es6')
const { Messenger } = require('@first-lego-league/ms-messenger')
const { client } = require('@first-lego-league/ms-client')

class CollectionClient extends EventEmitter {
  constructor (model, resourceServerUrl) {
    super()
    this._model = model
    this._resourceServerUrl = resourceServerUrl
    this.data = []
    this._messenger = new Messenger({ node: 'protected' })
    this._client = client
    this._messageHandlers = [this._clear, this._create, this._update, this._delete]
  }

  init () {
    return this._messenger.on(`${this._model.name}:reload`, data => {
      this._messageHandlers[`_${data.action}`](data)
      this.emit('reload', data)
    })
      .then(() => client.get(this._resourceServerUrl))
      .then(({ data }) => { this.data = data })
  }

  clear () {
    this._messenger.ignoreNextMessage(`${this._model.name}:reload`)
    return client.delete(this._resourceServerUrl)
      .then(() => this._clear())
  }

  create (entry) {
    this._messenger.ignoreNextMessage(`${this._model.name}:reload`)
    return client.post(this._resourceServerUrl, entry)
      .then(({ data }) => this._create({ entry: data }))
  }

  update (entry) {
    this._messenger.ignoreNextMessage(`${this._model.name}:reload`)
    return client.put(`${this._resourceServerUrl}/${entry._id}`)
      .then(({ data }) => this._update({ entry: data }))
  }

  delete (entry) {
    this._messenger.ignoreNextMessage(`${this._model.name}:reload`)
    return client.delete(`${this._resourceServerUrl}/${entry._id}`)
      .then(() => this._delete({ id: entry._id }))
  }

  _clear () {
    this.data = []
  }

  _create ({ entry }) {
    this.data.push(this._model(entry))
  }

  _update ({ entry }) {
    const existingEntry = this.data.find(e => e.equals(entry))
    Object.assign(existingEntry, entry)
  }

  _delete ({ id }) {
    const indexToRemove = this.data.findIndex(entry => entry._id === id)
    this.data.splice(indexToRemove, 1)
  }
}

exports.CollectionClient = CollectionClient
