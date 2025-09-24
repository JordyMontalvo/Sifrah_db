const db = require('./db')

const { User } = db


async function main() {

  const users = await User.find({})

  users.reverse()

  console.log(users.length)
}

main()
