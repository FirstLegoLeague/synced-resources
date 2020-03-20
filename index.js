/* eslint import/no-dynamic-require: 0 */

const { Model } = require('./lib/resources/model')
const { ConfigurableModel } = require('./lib/resources/configurable_model')
const { FieldsModel } = require('./lib/resources/fields_model')
const { InvalidEntry } = require('./lib/resources/errors/invalid_entry')

const { CollectionClient } = require('./lib/client/collection_client')
const { EntityClient } = require('./lib/client/entity_client')

const { DevelopmentCollectionClient } = require('./lib/client/development/collection_client')
const { DevelopmentEntityClient } = require('./lib/client/development/entity_client')

const { MongoCollectionServer } = require('./lib/server/mongo/collection_server')
const { MongoEntityServer } = require('./lib/server/mongo/entity_server')
const { MongoResourceAdapter } = require('./lib/server/mongo/resource_adapter')

const { allowModelConfiguration } = require('./lib/server/configurable_model_server')

exports.Model = Model
exports.InvalidEntry = InvalidEntry

Object.assign(exports, {
  Model,
  ConfigurableModel,
  FieldsModel,
  InvalidEntry,
  CollectionClient,
  EntityClient,
  DevelopmentCollectionClient,
  DevelopmentEntityClient,
  MongoCollectionServer,
  MongoResourceAdapter,
  MongoEntityServer,
  allowModelConfiguration
})
