const db = require('./db')

const { Closed, User } = db

async function main() {

  const closeds = await Closed.find({})
  const users   = await User.find({})

  const closed = closeds[7]

  for (const closed_user of closed.users) {

    const name = closed_user.name
    const rank = closed_user.rank

    const user = users.find(u => (name == (u.name + ' ' + u.lastName)))

    console.log(user.id, name, rank)

    User.updateOne({ id: user.id }, { rank })
  }
}

main()
