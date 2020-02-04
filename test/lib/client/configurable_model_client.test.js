const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

function ConfigurableModel () {
}

const { allowModelConfiguration } = require('../../../lib/client/configurable_model_client')

describe('allowModelConfiguration in client', () => {
  const configurationProvider = 'CONFIGURATION PROVIDER'
  const data = { field: 'value' }
  let client

  beforeEach(() => {
    client = {
      _options: { },
      _newEntry: () => { },
      _Model: chai.spy(ConfigurableModel)
    }
  })

  it('causes client to push the given configurationProvider to the model upon creation', () => {
    client._newEntry(data)
    expect(client._Model).not.to.have.been.called.with(data, configurationProvider)
    allowModelConfiguration(client, configurationProvider)
    client._newEntry(data)
    expect(client._Model).to.have.been.called.with(data, configurationProvider)
  })

  it('preserve the after create listener', () => {
    allowModelConfiguration(client, configurationProvider)
    client._options.afterCreate = chai.spy(() => { })
    client._newEntry(data)
    expect(client._options.afterCreate).to.have.been.called()
  })
})
