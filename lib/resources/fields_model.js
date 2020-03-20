const { InvalidEntry } = require('./errors/invalid_entry')
const { Model } = require('./model')

class FieldsModel extends Model {
  constructor (attrs = { }) {
    super(attrs)
    this.fields()
      .forEach(field => {
        if (field.hasOwnProperty('defaultValue') && !attrs.hasOwnProperty(field.key)) {
          this[field.key] = field.defaultValue
        } else if (field.enrichment) {
          this[field.key] = field.enrichment(this)
        } else if (field.type === FieldsModel.AS_IS || typeof field.type !== 'function' || typeof attrs[field.key] === 'undefined') {
          this[field.key] = attrs[field.key]
        } else {
          this[field.key] = field.type(attrs[field.key])
        }
      })
  }

  toJson () {
    return this.fields()
      .filter(({ enrichment }) => !enrichment)
      .reduce((json, { key }) => Object.assign(json, { [key]: this[key] }), { })
  }

  validate () {
    const valid = this.fields()
      .filter(({ required }) => required)
      .every(({ key }) => this[key] !== undefined)
    if (!valid) {
      throw new InvalidEntry(`Missing required field: ${this.fields().filter(({ required }) => required).find(({ key }) => this[key] === undefined).key}`)
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
