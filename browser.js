const { Model } = require('./lib/resources/model')
const { ConfigurableModel } = require('./lib/resources/configurable_model')
const { FieldsModel } = require('./lib/resources/fields_model')
const { InvalidEntry } = require('./lib/resources/errors/invalid_entry')

const { CollectionClient } = require('./lib/client/collection_client')
const { EntityClient } = require('./lib/client/entity_client')

const { DevelopmentCollectionClient } = require('./lib/client/development/collection_client')
const { DevelopmentEntityClient } = require('./lib/client/development/entity_client')

const { allowModelConfiguration } = require('./lib/client/configurable_model_client')

Object.assign(exports, {
  Model,
  ConfigurableModel,
  FieldsModel,
  InvalidEntry,
  CollectionClient,
  EntityClient,
  DevelopmentCollectionClient,
  DevelopmentEntityClient,
  allowModelConfiguration
})
