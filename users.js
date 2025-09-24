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
      
      
      affiliation_points: 0,
      points: 0,
      _activated: false,
      activated: false,
      total_points: 0,
      rank: 'none',
      
    })
  }
}

main()


// async function main() {

//   for(dni of dnis) {

//     const user = await User.findOne({ dni })
//     const { name, affiliated, plan } = user
//     console.log(name, affiliated, plan)
//     console.log(' ')

//     // const id = rand()


//     // await Affiliation.insert({
//     //   date: new Date(),
//     //   id,
//     //   userId: user.id,
//     //   plan: {
//     //     id: 'business',
//     //     name: 'PREMIUM',
//     //   },
//     //   voucher: null,
//     //   office: 'central',
//     //   status: 'approved',
//     //   delivered: true,
//     // })

//     await User.updateOne({ id: user.id }, {
//       // affiliated: true,
//       activated: true,
//       // affiliation_date: new Date(),
//       // plan: 'business',
//       // n: 4,
//       // affiliation_points: 0,
//     })

//   }

// }

// main()
