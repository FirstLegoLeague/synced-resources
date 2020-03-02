class NotFound extends Error {
  constructor (message) {
    super()
    this.message = message
  }
}

exports.NotFound = NotFound
