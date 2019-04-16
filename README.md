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
  initialize (attrs) {
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

Then you simply need to `use` the server side module in your express app:
```javascript
const { MongoEntityServer, MongoCollectionServer } = require('@first-lego-league/synces-resources')
const { MyModel } = require('../shared/models/my_model')

...
app.use(new MongoCollectionServer(MyModel)) // For a collection
app.use(new MongoEntityServer(MyModel)) // For a single entry
```
Notice a few things:
 * The name of the collection in the DB will be designed by the name of the model.
 * The topic of the message over MHub will also be by the name of the model: `ModelName:reload`.

### Client side
