'use strict'
/* global describe it */

const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

const { ModelMock } = require('../../../mocks/model.mock')
const { EntityClient } = require('../../../../lib/client/development/entity_client')

describe('development EntityClient', () => {
  const client = new EntityClient(ModelMock)

  it('has data equal to developmentData', () => {
    expect(client.data).to.eql(ModelMock.developmentEntity())
  })

  it('does nothing', () => {
    client.init()
    client.set()
    expect(client.data).to.eql(ModelMock.developmentEntity())
  })
})
