const { Model } = require('./model')

class ConfigurableModel extends Model {
  constructor (attrs, configurationProvider) {
    super(attrs)
    this.configurationProvider = configurationProvider
  }
}

exports.ConfigurableModel = ConfigurableModel
