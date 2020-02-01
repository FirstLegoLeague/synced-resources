class Model {
  // Built from data sent over HTTP/WS. Opposite of toJSon
  constructor (attrs) {
    Object.assign(this, attrs)
  }

  // Prepare for DB insertion. Needs to be all attributes except _id.
  sanitize () {
    const sanitized = { }
    Object.entries(this).forEach(([key, value]) => {
      if (key !== '_id') {
        sanitized[key] = value
      }
    })
    return sanitized
  }

  // Prepare for sending over HTTP/WS. Opposite of the contructor.
  toJson () {
    return Object.entries(this).reduce((json, [key, value]) => Object.assign(json, { [key]: value }), { })
  }

  // Compare with another entry
  equals (anotherEntry) {
    return this._id === anotherEntry._id
  }

  // Throw error if the validation doesn't pass.
  // The error must extend InvalidEntry in './errors/invalid_entry'
  validate () {
    return false
  }
}

exports.Model = Model
