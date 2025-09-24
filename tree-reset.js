const db = require('./db')

const { Tree } = db


async function main() {
  await Tree.deleteMany({})
}

main()
