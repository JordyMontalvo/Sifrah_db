const db = require('./db')

const { User } = db

const dnis = [
  '06870986'
]

async function main() {

  // const users = await User.find({ dni: { $in: dnis } })
  const users = await User.find({})

  for (user of users) {

    console.log(user.name, user.lastName, user.dni)
    console.log(user.plan)

    await User.updateOne({ id: user.id }, {
      
      // plan: "standard",
      // // affiliation_points: 80,
      // n: 7,
      // // activated: true,
      
      

      total_points: 0,

      
    })
  }
}

main()
