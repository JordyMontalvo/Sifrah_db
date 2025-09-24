require('dotenv').config()

const prod = ['-p', '--p', '--prod']
const args = process.argv.slice(2)

const URL  = prod.includes(args[0]) ? process.env.DB_URL_PROD  : process.env.DB_URL_DEV
const name = prod.includes(args[0]) ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV

const Client = require('mongodb').MongoClient


class Model {
  
  constructor(collection) {
    this.collection = collection
  }

  async find(q) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const res    = await db.collection(this.collection).find(q).toArray()
    client.close()
    return res
  }

  async findOne(q) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const res    = await db.collection(this.collection).findOne(q)
    client.close()
    return res
  }

  async insert(el) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection(this.collection).insertOne(el)
    return client.close()
  }

  async updateOne(q, vals) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection(this.collection).updateOne(q, { $set: vals })
    return client.close()
  }

  async updateMany(q, vals) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection(this.collection).updateMany(q, { $set: vals })
    return client.close()
  }
  
  async deleteOne(q) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection(this.collection).deleteOne(q)
    return client.close()
  }


  async deleteMany(q) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection(this.collection).deleteMany(q)
    return client.close()
  }
}


module.exports = {
  User:        new Model('users'),
  Tree:        new Model('tree'),
  Token:       new Model('tokens'),
  Transaction: new Model('transactions'),
  Promo:       new Model('promos'),
  Product:     new Model('products'),
  Plan:        new Model('plans'),
  Affiliation: new Model('affiliations'),
  Activation:  new Model('activations'),
  Collect:     new Model('collects'),
  Office:      new Model('offices'),
  Session:     new Model('sessions'),
  Closed:     new Model('closeds'),
  DeliveryAgency: new Model('delivery_agencies'),
}
