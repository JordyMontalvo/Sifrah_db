const db = require('./db')

const { Token } = db


async function main() {
  await Token.updateMany({}, {
    free: true,
  })
}

main()
