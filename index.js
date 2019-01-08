'use strict'
/* eslint node/no-unsupported-features: 0 */
/* eslint import/no-dynamic-require: 0 */

const Promise = require('bluebird')
const { client } = require('@first-lego-league/ms-client')
const { Messenger } = require('@first-lego-league/ms-messenger')
const { Logger } = require('@first-lego-league/ms-logger')

const EXPIRATION_TIME = 30 * 60 * 1000 // Half an hour

class Resource {
  constructor ({ url, topic, dataInMessage, name, developmentValue }) {
    this.url = url
    this.topic = topic
    this.dataInMessage = dataInMessage
    this.name = name
    this.developmentValue = developmentValue
    this.messenger = new Messenger()
    this.logger = new Logger()
    this.init()
  }

  init () {
    if (!this._initPromise || (Date.now() - this._timestamp > EXPIRATION_TIME)) {
      this._timestamp = Date.now()
      this._initPromise = this.messenger.listen(this.topic, data => {
        (this.dataInMessage ? Promise.resolve(data.value) : this.reload())
          .then(value => {
            this.value = value
            return this.messenger.send('rankings:reload', { resource: this.name })
          })
          .catch(() => {
            this._initPromise = null
          })
        return this
      }).then(() => this.reload())
        .then(value => { this.value = value })
        .catch(err => {
          this._initPromise = null
          throw err
        })
    }
    return this._initPromise
  }

  reload () {
    this.logger.info(`Reloading ${this.name}`)
    return client.get(this.url)
      .then(response => response.data)
  }

  get () {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(this.developmentValue)
    } else {
      return this.init().then(() => this.value)
    }
  }
}

exports.Resource = Resource
