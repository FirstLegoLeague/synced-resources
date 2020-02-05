const { InvalidEntry } = require('./errors/invalid_entry')
const { Model } = require('./model')

class FieldsModel extends Model {
  constructor (attrs = { }) {
    super(attrs)
    this.fields()
      .forEach(({ field, type, defaultValue }) => {
        const value = attrs[field] || defaultValue
        if (type === FieldsModel.AS_IS || typeof type !== 'function') {
          this[field] = value
        } else {
          this[field] = type(value)
        }
      })
  }

  toJson () {
    return this.fields()
      .filter(({ enrichment }) => !enrichment)
      .reduce((json, { field }) => Object.assign(json, { [field]: this[field] }), { })
  }

  validate () {
    const valid = this.fields()
      .filter(({ required }) => required)
      .every(({ field }) => this[field] !== undefined)
    if (!valid) {
      throw new InvalidEntry('Missing required field')
    }
  }

  fields () {
    throw new Error('FieldsModel must implements fields function')
  }

  id () {
    return this._id
  }
}

FieldsModel.AS_IS = 'as-is'

exports.FieldsModel = FieldsModel
