const db = require('./db')

const { User } = db

async function main() {

  const users = await User.find({})

  for (let user of users) {
    if (user.points >= 40) {
      console.log(user.name, user.lastName, user.points)

      await User.updateOne({ id: user.id }, {
        _activated: true,
      })
    }
  }
}

main()


// const db = require('./db')

// const { Activation } = db


// async function main() {

//   const activations = await Activation.find({})

//   for(activation of activations) {
//     console.log(activation.date.toString())

//     if(activation.date.toString().includes('Sep')) {

//       await Activation.updateOne({ id: activation.id },
//         {
//           closed: false,
//         },
//       )
//     }
//     else {
//       console.log('closed ..')

//       await Activation.updateOne({ id: activation.id },
//         {
//           closed: true,
//         },
//       )
//     }
//   }
// }

// main()
