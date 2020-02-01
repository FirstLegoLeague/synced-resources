/* eslint import/no-dynamic-require: 0 */

const { Model } = require('./lib/resources/model')
const { InvalidEntry } = require('./lib/resources/errors/invalid_entry')

const { MongoCollectionServer } = require('./lib/server/mongo/collection_server')
const { MongoEntityServer } = require('./lib/server/mongo/entity_server')

exports.Model = Model
exports.InvalidEntry = InvalidEntry

exports.MongoCollectionServer = MongoCollectionServer
exports.MongoEntityServer = MongoEntityServer
