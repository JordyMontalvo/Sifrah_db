const db = require('./db')

const { Transaction } = db


async function main() {
  await Transaction.deleteMany({})
}

main()
