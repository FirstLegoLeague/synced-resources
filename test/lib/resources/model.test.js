const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

const { Model } = require('../../../lib/resources/model')

describe('default Model', () => {
  const modelWithIdAttrs = { _id: 5, field1: 'field', field2: 1 }
  const modelWithId = new Model(modelWithIdAttrs)
  const modelWithoutIdAttrs = { field1: 'field12', field2: 4 }
  const modelWithoutId = new Model(modelWithoutIdAttrs)

  it('assigns all attributes givven to it in the constructor to itself', () => {
    Object.entries(modelWithIdAttrs).forEach(([key, value]) => {
      expect(modelWithId[key]).to.equal(value)
    })
    Object.entries(modelWithoutIdAttrs).forEach(([key, value]) => {
      expect(modelWithoutId[key]).to.equal(value)
    })
  })

  it('is sent over HTTP/WS by just using json over all fields', () => {
    const modelWithIdJson = modelWithId.toJson()
    Object.entries(modelWithIdJson).forEach(([key, value]) => {
      expect(modelWithId[key]).to.equal(value)
    })

    const modelWithoutIdJson = modelWithoutId.toJson()
    Object.entries(modelWithoutIdJson).forEach(([key, value]) => {
      expect(modelWithoutId[key]).to.equal(value)
    })
  })

  it('returns _id field as its id()', () => {
    expect(modelWithId.id()).to.equal(modelWithId._id)
  })

  it('does not throw an InvalidEntry error', () => {
    expect(modelWithId.validate()).to.equal(false)
  })
})
