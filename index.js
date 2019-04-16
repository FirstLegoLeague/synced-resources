'use strict'

const { Model } = require('./lib/resources/model')

const { CollectionClient } = require('./lib/client/collection_client')
const { EntityClient } = require('./lib/client/entity_client')

const { MongoCollectionServer } = require('./lib/server/mogno/collection_server')
const { MongoEntityServer } = require('./lib/server/mogno/entity_server')

exports.Model = Model

exports.CollectionClient = CollectionClient
exports.EntityClient = EntityClient

exports.MongoCollectionServer = MongoCollectionServer
exports.MongoEntityServer = MongoEntityServer
