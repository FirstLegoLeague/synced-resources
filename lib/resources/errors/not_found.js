class NotFound extends Error {
  constructor (message = 'Entry not found') {
    super()
    this.message = message
  }
}

exports.NotFound = NotFound
