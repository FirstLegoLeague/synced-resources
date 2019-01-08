'use strict'
/* global describe it */

const chai = require('chai')
const chaiString = require('chai-string')

chai.use(chaiString)
const expect = chai.expect

const { Resource } = require('../')

describe('Resource', () => {
  describe('in dev mode', () => {
  	process.env.NODE_ENV = 'development'

  	it('returns developmentValue', () => {
  		const developmentValue = 'developmentValue'
  		new Resource({ developmentValue }).get()
  			.then(value => expect(value).to.equal(developmentValue))
  	})
  })

  describe('in prod mode', () => {
  	process.env.NODE_ENV = 'prod'

  })
})
