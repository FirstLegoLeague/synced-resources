const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

function ConfigurableModel () {
}

const { allowModelConfiguration } = require('../../../lib/server/configurable_model_server')

describe('allowModelConfiguration in server', () => {
  const configurationProvider = 'CONFIGURATION PROVIDER'
  const data = { field: 'value' }
  let server

  beforeEach(() => {
    server = {
      _options: { },
      _newEntry: () => { },
      _Model: chai.spy(ConfigurableModel)
    }
  })

  it('causes server to push the given configurationProvider to the model upon creation', () => {
    server._newEntry(data)
    expect(server._Model).not.to.have.been.called.with(data, configurationProvider)
    allowModelConfiguration(server, configurationProvider)
    server._newEntry(data)
    expect(server._Model).to.have.been.called.with(data, configurationProvider)
  })
})
