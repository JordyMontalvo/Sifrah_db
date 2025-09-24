const db = require('./db')

const { Session } = db


async function main() {
  await Session.deleteMany({})
}

main()
