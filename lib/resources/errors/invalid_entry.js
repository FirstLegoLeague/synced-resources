'use strict'

class InvalidEntry extends Error {
  constructor (message) {
    super()
    this.message = message
  }
}

exports.InvalidEntry = InvalidEntry
