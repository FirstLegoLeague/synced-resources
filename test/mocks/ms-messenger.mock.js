const Promise = require('bluebird')
const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const messenger = {
  listen: (topic, listener) => {
    messenger.listener = listener
    return Promise.resolve()
  },
  send: () => { },
  ignoreNextMessage: () => { }
}

messenger.on = (topic, callback) => messenger.listen(topic, callback)

const messengerSandbox = chai.spy.sandbox()
messengerSandbox.on(messenger, Object.keys(messenger))

exports.messenger = messenger

const createMessenger = () => messenger

exports.MessengerMock = { createMessenger }
exports.MessengerMock['@global'] = true
exports.MessengerMock['@noCallThru'] = true

exports.triggerListener = data => {
  return messenger.listener(data)
}
