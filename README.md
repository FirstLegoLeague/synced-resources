# Synced Resources
A full end-to-end resource shared by the protocols defined for the *FIRST* LEGO League TMS, using the ms-client and ms-messenger packages.

## Logic
A **Resource** is any data that can be shared across HTTP and WS.
It can either be a single **Entry** of data, or a **Collection** of entries.

The end-to-end construction is built out of `client-side` module and `server-side` module.
Each of them need to be used in their side.
The `serve-side` module keeps the data in a hard copy, and makes sure all clients are in sync.
The `client-side` module keeps a copy of the data in memory, and makes the request for changes in the backend.

The server and client sides share a `model` class, which is the class of the object that is shared. This class will contain all of the data required to sync the two sides.

## Technologies
This package is using an express router for backend, and a generic class for front end. 
Currently only MongoDB is available as a database for the resources.

## Usage

Before you start creating the server or client side you need to create a class that extends the `Model` class. Here is the original `Model` class with all the default implementations of the methods. Override those of them you wish to act differently:

```javascript
class Model {
  // Built from data sent over HTTP/WS. Opposite of toJSon
  constructor (attrs) {
    Object.assign(this, attrs)
  }

  // Saved into DB?
  isSaved () {
    return Boolean(this._id)
  }

  // Prepare for DB insertion. Needs to be all attributes except _id.
  sanitize () {
    const sanitized = { }
    Object.entires(this).forEach(([key, value]) => {
      if (key !== '_id') {
        sanitized[key] = value
      }
    })
    return sanitized
  }

  // Prepare for sending over HTTP/WS. Opposite of the contructor.
  toJson () {
    const json = { }
    Object.entires(this).forEach(([key, value]) => json[key] = value)
    return json
  }

  // Compare with another entry
  equals (anotherEntry) {
    return this._id == anotherEntry._id
  }

  // Throw error if the validation doesn't pass. The error must extend InvalidEntry in './errors/invalid_entry'
  validate () {
    return false
  }
}
```

Use it as follows:

```javascript
const { Model } = require('@first-lego-league/synced-resources')

class MyModel extends Model {
	Override methods or add your own...
}

expotrs.MyModel = MyModel
```
### Server side

After creating your model you simply need to `use` the server side module in your express app:
```javascript
const { MongoEntityServer, MongoCollectionServer } = require('@first-lego-league/synces-resources')
const { MyModel } = require('../shared/models/my_model')

...
// For a collection
app.use('/mymodel', new MongoCollectionServer(MyModel))

// For a single entry
app.use('/mymodel', new MongoEntityServer(MyModel))
```
You can add a before functions for every route in the server:
```javascript
app.use('/mymodel', new MongoEntityServer(MyModel, { before: { set: ..., get: ..., } }))

// Using an authorization middleware like this:
const { authroizationMiddlware } = require('@first-lego-leagie/ms-auth')

const authroizeAdmin = authroizationMiddlware(['admin'])
app.use('/mymodel', new MongoEntityServer(MyModel, { before: { set: authroizeAdmin } }))
```
You can tell the server to override or even not include some routes at all, like this:
(See below for the list of available routes in each server)
```javascript
app.use('/mymodel', new MongoEntityServer(MyModel, { exclude: ['search'] }))
app.use('/mymodel', new MongoEntityServer(MyModel, { exclude: ['search', 'get'] }))
app.use('/mymodel', new MongoEntityServer(MyModel, { override: { search: ... } }))
```

Few things you should notice:
 * The name of the collection in the DB will be designed by the name of the model.
 * The topic of the message over MHub will also be by the name of the model: `ModelName:reload`.
 * The optional routes in the entry server are:
   * `get` - responds to a GET request to the base URL with `entry.toJson()`.
   * `set` - responds to a POST request to the base URL by setting the entry to `new Model(req.body).sanitize()`.
   * `getField` - responds to a GET request to `/:field` with `entry.toJson()[field]`, where field is the field from the route.
 * The optional routes in the collection server are:
   * `getAll` - responds to a GET request to the base URL with all entries in the collection mapped with `entry.toJson()`.
   * `deleteAll` - responds to a DELETE request to the base URL by deleting all the entries.
   * `search` - responds to a GET request to `/search` with all the entries matching the `req.query` fields.
   * `count` - responds to a GET request to `/count` with the number of entries in the collection.
   * `create` - responds to a POST request to base URL by saving an entry using `new Model(req.body).sanitize()`.
   * `get` - responds to a GET request to `/:id` with the matching entry's `entry.toJson()`.
   * `update` - responds to a PUT request to `/:id` by updating the matching entry using `new Model(req.body).sanitize()`.
   * `delete` - responds to a DELETE request to `/:id` by deleting the matching entry.

### Client side
