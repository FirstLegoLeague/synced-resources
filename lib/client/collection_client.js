const Promise = require('bluebird')

const { AbstractClient } = require('./abstract_client')

class CollectionClient extends AbstractClient {
  constructor (Model, resourceServerUrl, options = {}) {
    super(Model, resourceServerUrl, options)

    this.data = []
  }

  clear () {
    this._ignoreNextMessage()
    return this._client.delete(this._resourceServerUrl)
      .then(() => this._clear())
  }

  create (attrs) {
    const entry = this._newEntry(attrs)
    this._ignoreNextMessage()
    return Promise.resolve(entry.validate({ collection: this.data }))
      .then(() => this._client.post(this._resourceServerUrl, entry.toJson()))
      .then(({ data }) => this._create({ entry: data }))
  }

  update (attrs) {
    const entry = Object.assign(this._find(attrs), attrs)
    this._ignoreNextMessage()
    return Promise.resolve(entry.validate({ collection: this.data }))
      .then(() => this._client.put(`${this._resourceServerUrl}/${entry.id()}`, entry.toJson()))
      .then(({ data }) => this._update({ entry: data }))
  }

  delete (entry) {
    entry = this._find(entry)
    this._ignoreNextMessage()
    return this._client.delete(`${this._resourceServerUrl}/${entry.id()}`)
      .then(() => this._delete({ id: entry.id() }))
  }

  _parseMessengerData (data) {
    this[`_${data.action}`](data)
  }

  _parseHTTPData (data) {
    this.data = data.map(datum => this._newEntry(datum))
  }

  _clear () {
    this.data = []
  }

  _create ({ entry }) {
    this.data.push(this._newEntry(entry))
  }

  _update ({ entry }) {
    const existingEntry = this._find(entry)
    Object.assign(existingEntry, entry)
  }

  _delete ({ id }) {
    const indexToRemove = this.data.findIndex(entry => entry.id() === id)
    this.data.splice(indexToRemove, 1)
  }

  _find (entry) {
    if (!(entry instanceof this._Model)) {
      entry = this._newEntry(entry)
    }
    return this.data.find(datum => datum.id() === entry.id())
  }
}

exports.CollectionClient = CollectionClient
