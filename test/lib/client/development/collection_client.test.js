const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

const { ModelMock } = require('../../../mocks/model.mock')
const { CollectionClient } = require('../../../../lib/client/development/collection_client')

describe('development CollectionClient', () => {
  const client = new CollectionClient(ModelMock)

  it('has data equal to developmentData', () => {
    expect(client.data).to.eql(ModelMock.developmentCollection())
  })

  it('does nothing', () => {
    client.init()
    client.clear()
    client.create()
    client.update()
    client.delete()
    expect(client.data).to.eql(ModelMock.developmentCollection())
  })
})
