'use strict'
/* eslint import/no-dynamic-require: 0 */

const { Model } = require('./lib/resources/model')
const { InvalidEntry } = require('./lib/resources/errors/invalid_entry')

const clientsDir = `./lib/client${process.env.NODE_ENV === 'development' ? '/development' : ''}`
const { CollectionClient } = require(`${clientsDir}/collection_client`)
const { EntityClient } = require(`${clientsDir}/entity_client`)

const { MongoCollectionServer } = require('./lib/server/mongo/collection_server')
const { MongoEntityServer } = require('./lib/server/mongo/entity_server')

exports.Model = Model
exports.InvalidEntry = InvalidEntry

exports.CollectionClient = CollectionClient
exports.EntityClient = EntityClient

exports.MongoCollectionServer = MongoCollectionServer
exports.MongoEntityServer = MongoEntityServer
