class Model {
  // Built from data sent over HTTP/WS. Opposite of toJSon
  constructor (attrs) {
    Object.assign(this, attrs)
  }

  // Prepare for sending over HTTP/WS. Opposite of the contructor.
  toJson () {
    return Object.entries(this).reduce((json, [key, value]) => Object.assign(json, { [key]: value }), { })
  }

  // Throw error if the validation doesn't pass.
  // The error must extend InvalidEntry in './errors/invalid_entry'
  validate () {
    return false
  }

  id () {
    return this._id
  }
}

exports.Model = Model
