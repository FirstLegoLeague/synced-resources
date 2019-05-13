'use strict'

const { Model } = require('../../lib/resources/model')
const { InvalidEntry } = require('../../lib/resources/errors/invalid_entry')

class ModelMock extends Model {
  validate () {
    if (this.invalid) {
      throw new InvalidEntry('invalid entry mock')
    }
  }
}

exports.ModelMock = ModelMock
