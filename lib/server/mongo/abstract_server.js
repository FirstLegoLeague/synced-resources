const Router = require('router')
const bodyParser = require('body-parser')
const { Logger } = require('@first-lego-league/ms-logger')

const { MongoResourceAdapter } = require('./resource_adapter')

class AbstractMongoServer extends Router {
  constructor (model, options = {}) {
    super()
    this._Model = model
    this._options = options
    this._adapter = new MongoResourceAdapter(this._Model, this._options)
    this._logger = new Logger()

    this.use(bodyParser.json())
    this.use(bodyParser.urlencoded({ extended: true }))

    if (!this._options.extendable) {
      this.close()
    }
  }

  close () {
    // Getting the names of the methods
    Object.getOwnPropertyNames(this.constructor.prototype)
      .filter(methodName => methodName.match(/_add.+Route/))
      .forEach(methodName => this[methodName]())

    return this
  }

  _addRoute (name, method, path, callback) {
    if (this._options.exclude && this._options.exclude.includes(name)) {
      return
    }

    if (this._options.before && this._options.before[name]) {
      this[method](path, this._options.before[name])
    }

    if (this._options.override && this._options.override[name]) {
      this[method](path, this._options.override[name])
      return
    }

    this[method](path, callback)
  }

  _handleError (res) {
    return error => {
      if (error.constructor.name === 'InvalidEntry') {
        this._logger.warn(error)
        res.sendStatus(422)
      } else if (error.constructor.name === 'NotFound') {
        this._logger.warn(error)
        res.sendStatus(404)
      } else {
        this._logger.error(error)
        res.sendStatus(500)
      }
    }
  }
}

exports.AbstractMongoServer = AbstractMongoServer
