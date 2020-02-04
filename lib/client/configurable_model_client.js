const allowModelConfiguration = (client, configurationProvider) => {
  client._newEntry = function _newEntry (data) {
    const entry = new this._Model(data, configurationProvider)
    if (this._options.afterCreate) {
      this._options.afterCreate(entry)
    }
    return entry
  }
  return client
}

exports.allowModelConfiguration = allowModelConfiguration
