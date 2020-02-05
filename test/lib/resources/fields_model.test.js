const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

const { FieldsModel } = require('../../../lib/resources/fields_model')

let fields

class TestableFieldsModel extends FieldsModel {
  fields () {
    return fields.apply(this, arguments)
  }
}

class BadFieldsModel extends FieldsModel { }

describe('Fields Model', () => {
  beforeEach(() => {
    fields = chai.spy(() => {
      return [
        { field: '_id', defaultValue: 1 },
        { field: 'field0' },
        { field: 'field1', defaultValue: 1, enrichment: true },
        { field: 'field2', type: FieldsModel.As_IS, defaultValue: { } },
        { field: 'field3', type: Number, defaultValue: 10 },
        { field: 'field4', required: true }
      ]
    })
  })

  it('Saves the default value of each field', () => {
    const entry = new TestableFieldsModel()
    expect(entry.field0).to.equal(undefined)
    expect(entry.field1).to.equal(1)
    expect(entry.field2).to.eql({ })
    expect(entry.field3).to.equal(10)
  })

  it('toJson returns all fields except enrichment fields', () => {
    const entry = new TestableFieldsModel()
    const json = entry.toJson()
    expect(json.hasOwnProperty('field0')).to.equal(true)
    expect(json.hasOwnProperty('field1')).to.equal(false)
    expect(json.hasOwnProperty('field2')).to.equal(true)
    expect(json.hasOwnProperty('field3')).to.equal(true)
    expect(json.hasOwnProperty('field4')).to.equal(true)
  })

  it('validates by checking all required fields exist', () => {
    const entry = new TestableFieldsModel()
    expect(() => entry.validate()).to.throw()
    entry.field4 = 'bla'
    expect(() => entry.validate()).not.to.throw()
  })

  it('does not allow for models to be created without a fields method', () => {
    const entry = new TestableFieldsModel()
    expect(entry.id()).to.equal(entry._id)
  })

  it('does not allow for models to be created without a fields method', () => {
    expect(() => new BadFieldsModel()).to.throw()
  })
})
