const allowModelConfiguration = (server, configurationProvider) => {
  server._newEntry = function _newEntry (attrs) {
    return new this._Model(attrs, configurationProvider)
  }
  return server
}

exports.allowModelConfiguration = allowModelConfiguration
