const db = require('./db')

const { Affiliation } = db


async function main() {

  await Affiliation.deleteMany({})
}

main()
