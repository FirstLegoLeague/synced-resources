'use strict'

class InvalidEntry extends Error {
	initialize (message) {
		super()
		this.message = message
	}

}

exports.InvalidEntry = InvalidEntry