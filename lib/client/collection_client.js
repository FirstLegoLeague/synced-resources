const EventEmitter = require('event-emitter-es6')
const { createMessenger } = require('@first-lego-league/ms-messenger')
const { createClient } = require('@first-lego-league/ms-client')

class CollectionClient extends EventEmitter {
  constructor (Model, resourceServerUrl, options = {}) {
    super()
    this._Model = Model
    this._options = options
    this._resourceServerUrl = resourceServerUrl
    this.data = []
    this._messenger = createMessenger({ node: 'protected' })
    this._client = createClient(Object.assign({ independent: true }, options.clientOptions || {}))

    if (this._options.autoInit) {
      return this.init()
    }
  }

  init () {
    return this._messenger.on(`${this._Model.name}:reload`, data => {
      this[`_${data.action}`](data)
      this.emit('reload', data)
    })
      .then(() => this._client.get(this._resourceServerUrl))
      .then(({ data }) => { this.data = data.map(datum => this._newEntry(datum)) })
  }

  clear () {
    this._messenger.ignoreNextMessage(`${this._Model.name}:reload`)
    return this._client.delete(this._resourceServerUrl)
      .then(() => this._clear())
  }

  create (entry) {
    this._messenger.ignoreNextMessage(`${this._Model.name}:reload`)
    return this._client.post(this._resourceServerUrl, entry)
      .then(({ data }) => this._create({ entry: data }))
  }

  update (entry) {
    this._messenger.ignoreNextMessage(`${this._Model.name}:reload`)
    return this._client.put(`${this._resourceServerUrl}/${entry._id}`)
      .then(({ data }) => this._update({ entry: data }))
  }

  delete (entry) {
    this._messenger.ignoreNextMessage(`${this._Model.name}:reload`)
    return this._client.delete(`${this._resourceServerUrl}/${entry._id}`)
      .then(() => this._delete({ id: entry._id }))
  }

  _clear () {
    this.data = []
  }

  _create ({ entry }) {
    this.data.push(this._newEntry(entry))
  }

  _update ({ entry }) {
    const existingEntry = this.data.find(e => e.equals(entry))
    Object.assign(existingEntry, entry)
  }

  _delete ({ id }) {
    const indexToRemove = this.data.findIndex(entry => entry._id === id)
    this.data.splice(indexToRemove, 1)
  }

  _newEntry (data) {
    const entry = new this._Model(data)
    if (this._options.afterCreate) {
      this._options.afterCreate(entry)
    }
    return entry
  }
}

exports.CollectionClient = CollectionClient
