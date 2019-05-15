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

ModelMock.developmentCollection = () => {
  return [{
    _id: 'a21212121212121212121212',
    field1: '916381'
  }, {
    _id: 'a53535353535353535353535',
    field1: '5138'
  }, {
    _id: 'a56483151681357985135165',
    field1: 'a31f51'
  }, {
    _id: 'a98431513813202213505468',
    field1: '1a3e5df'
  }]
}

ModelMock.developmentEntity = () => {
  return {
    _id: 'a21212121212121212121212',
    field1: '916381'
  }
}

exports.ModelMock = ModelMock
