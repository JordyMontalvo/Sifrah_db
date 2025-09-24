require('dotenv').config()

const prod = ['-p', '--p', '--prod']
const args = process.argv.slice(2)

const URL  = prod.includes(args[0]) ? process.env.DB_URL_PROD  : process.env.DB_URL_DEV
const name = prod.includes(args[0]) ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV
// console.log({ URL, name })

const Client = require('mongodb').MongoClient

class DB {
  constructor({ User, Session, Affiliation, Product, Activation, Plan, Token, Transaction, Tree, Collect, Promo }) {
    this.User        = User
    this.Session     = Session
    this.Affiliation = Affiliation
    this.Product     = Product
    this.Activation  = Activation
    this.Plan        = Plan
    this.Token       = Token
    this.Transaction = Transaction
    this.Tree        = Tree
    this.Collect     = Collect
    this.Promo       = Promo
  }
}

class User {
  async findOne(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const user   = await db.collection('users').findOne(query)
    client.close()
    return user
  }
  async find(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const users  = await db.collection('users').find(query).toArray()
    client.close()
    return users
  }
  async insert(user) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('users').insertOne(user)
    return client.close()
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('users').updateOne(query, { $set: values })
    return client.close()
  }
  async deleteOne(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('users').deleteOne(query)
    return client.close()
  }
}

class Session {
  async findOne(query) {
    const client  = new Client(URL, { useUnifiedTopology: true })
    const conn    = await client.connect()
    const db      = conn.db(name)
    const session = await db.collection('sessions').findOne(query)
    client.close()
    return session
  }
  async insert(session) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('sessions').insertOne(session)
    return client.close()
  }
  async delete(value) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('sessions').deleteOne({ value })
    return client.close()
  }
}

class Affiliation {
  async findOne(query) {
    const client      = new Client(URL, { useUnifiedTopology: true })
    const conn        = await client.connect()
    const db          = conn.db(name)
    const affiliation = await db.collection('affiliations').findOne(query)
    client.close()
    return affiliation
  }
  async find(query) {
    const client       = new Client(URL, { useUnifiedTopology: true })
    const conn         = await client.connect()
    const db           = conn.db(name)
    const affiliations = await db.collection('affiliations').find(query).toArray()
    client.close()
    return affiliations
  }
  async insert(affiliation) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('affiliations').insertOne(affiliation)
    return client.close()
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('affiliations').updateOne(query, { $set: values })
    return client.close()
  }
}

class Product {
  async find(query) {
    const client   = new Client(URL, { useUnifiedTopology: true })
    const conn     = await client.connect()
    const db       = conn.db(name)
    const products = await db.collection('products').find(query).toArray()
    client.close()
    return products
  }
}

class Activation {
  async findOne(query) {
    const client     = new Client(URL, { useUnifiedTopology: true })
    const conn       = await client.connect()
    const db         = conn.db(name)
    const activation = await db.collection('activations').findOne(query)
    client.close()
    return activation
  }
  async find(query) {
    const client      = new Client(URL, { useUnifiedTopology: true })
    const conn        = await client.connect()
    const db          = conn.db(name)
    const activations = await db.collection('activations').find(query).toArray()
    client.close()
    return activations
  }
  async insert(activation) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('activations').insertOne(activation)
    return client.close()
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('activations').updateOne(query, { $set: values })
    return client.close()
  }
}

class Plan {
  async findOne(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const plan   = await db.collection('plans').findOne(query)
    client.close()
    return plan
  }
  async find(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const plans  = await db.collection('plans').find(query).toArray()
    client.close()
    return plans
  }
}

class Token {
  async findOne(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const token  = await db.collection('tokens').findOne(query)
    client.close()
    return token
  }
  async insert(token) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('tokens').insertOne(token)
    return client.close()
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('tokens').updateOne(query, { $set: values })
    return client.close()
  }
}

class Transaction {
  async find(query) {
    const client       = new Client(URL, { useUnifiedTopology: true })
    const conn         = await client.connect()
    const db           = conn.db(name)
    const transactions = await db.collection('transactions').find(query).toArray()
    client.close()
    return transactions
  }
  async insert(transaction) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('transactions').insertOne(transaction)
    return client.close()
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('transactions').updateOne(query, { $set: values })
    return client.close()
  }
  async delete(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('transactions').deleteOne({ query })
    return client.close()
  }
}

class Tree {
  async find(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    const tree   = await db.collection('tree').find(query).toArray()
    client.close()
    return tree
  }
  async insert(node) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('tree').insertOne(node)
    return client.close()
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('tree').updateOne(query, { $set: values })
    return client.close()
  }
  async deleteOne(query) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('tree').deleteOne(query)
    return client.close()
  }
}

class Collect {
  async findOne(query) {
    const client  = new Client(URL, { useUnifiedTopology: true })
    const conn    = await client.connect()
    const db      = conn.db(name)
    const collect = await db.collection('collects').findOne(query)
    client.close()
    return collect
  }
  async find(query) {
    const client   = new Client(URL, { useUnifiedTopology: true })
    const conn     = await client.connect()
    const db       = conn.db(name)
    const collects = await db.collection('collects').find(query).toArray()
    client.close()
    return collects
  }
  async insert(collect) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('collects').insertOne(collect)
    return client.close()
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('collects').updateOne(query, { $set: values })
    return client.close()
  }
}

class Promo {
  async find(query) {
    const client   = new Client(URL, { useUnifiedTopology: true })
    const conn     = await client.connect()
    const db       = conn.db(name)
    const promos   = await db.collection('promos').find(query).toArray()
    client.close()
    return promos
  }
  async update(query, values) {
    const client = new Client(URL, { useUnifiedTopology: true })
    const conn   = await client.connect()
    const db     = conn.db(name)
    await db.collection('promos').updateOne(query, { $set: values })
    return client.close()
  }
}

module.exports = new DB({
  User:        new User(),
  Session:     new Session(),
  Affiliation: new Affiliation(),
  Product:     new Product(),
  Activation:  new Activation(),
  Plan:        new Plan(),
  Token:       new Token(),
  Transaction: new Transaction(),
  Tree:        new Tree(),
  Collect:     new Collect(),
  Promo:       new Promo(),
})
