const Promise = require('bluebird')

const { AbstractClient } = require('./abstract_client')

class EntityClient extends AbstractClient {
  constructor (Model, resourceServerUrl, options = {}) {
    super(Model, resourceServerUrl, options)

    this.data = undefined
  }

  set (entity) {
    if (!(entity instanceof this._Model)) {
      entity = this._newEntry(entity)
    }
    this._ignoreNextMessage()
    return Promise.resolve(entity.validate())
      .then(() => this._client.post(this._resourceServerUrl, entity.toJson()))
      .then(({ data }) => { this.data = this._newEntry(data) })
  }

  _parseMessengerData (data) {
    this.data = this._newEntry(data)
  }

  _parseHTTPData (data) {
    this.data = this._newEntry(data)
  }
}

exports.EntityClient = EntityClient
