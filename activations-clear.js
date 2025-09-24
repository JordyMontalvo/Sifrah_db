const db = require('./db')

const { Activation } = db


async function main() {
  await Activation.deleteMany({})
}

main()
