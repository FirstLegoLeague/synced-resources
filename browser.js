/* eslint import/no-dynamic-require: 0 */

const { Model } = require('./lib/resources/model')
const { ConfigurableModel } = require('./lib/resources/configurable_model')
const { FieldsModel } = require('./lib/resources/fields_model')
const { InvalidEntry } = require('./lib/resources/errors/invalid_entry')

const clientsDir = `./lib/client${process.env.NODE_ENV === 'development' ? '/development' : ''}`
const { CollectionClient } = require(`${clientsDir}/collection_client`)
const { EntityClient } = require(`${clientsDir}/entity_client`)
const { allowModelConfiguration } = require('./lib/client/configurable_model_client')

Object.assign(exports, { Model, ConfigurableModel, FieldsModel, InvalidEntry, CollectionClient, EntityClient, allowModelConfiguration })
