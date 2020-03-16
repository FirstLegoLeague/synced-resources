class InvalidEntry extends Error {
  constructor (message = 'Invalid entry') {
    super()
    this.message = message
  }
}

exports.InvalidEntry = InvalidEntry
