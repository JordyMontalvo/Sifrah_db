const db = require('./db')

const { Collect } = db


async function main() {

  // get users
  const collects = await Collect.find({})

  for(collect of collects) {

    console.log(collect)

    await Collect.updateOne(
      { id: collect.id },
      { office: 'central' }
    )
  }
}

main()

// const db = require('./db')

// const { User, Transaction, Collect } = db

// function acum(a, query, field) {
//   const x = Object.keys(query)[0]
//   const y = Object.values(query)[0]

//   return a
//     .filter(i => i[x] == y)
//     .map(i => i[field])
//     .reduce((a, b) => a + b, 0)
// }

// function rand() {
//   return Math.random().toString(36).substr(2)
// }


// async function main() {

//   // get affiliated users
//   const users = await User.find({ affiliated: true })
//   let i = 0
//   for(user of users) {
//     // get transactions
//     const transactions = await Transaction.find({ userId: user.id })

//     const ins  = acum(transactions, {type: 'in'}, 'value')
//     const outs = acum(transactions, {type: 'out'}, 'value')

//     const balance = ins - outs
//     if(balance) {
//       i++
//       console.log(`${i} ${user.name}: ${balance}`)

//       const id = rand()

//       // save new collect
//       await Collect.insert({
//         date: new Date(),
//         id,
//         userId: user.id,
//         cash: true,
//         bank: null,
//         account: null,
//         ibk: null,
//         amount: balance,
//         status: 'pending',
//       })

//       //
//       await Transaction.insert({
//         date:   new Date(),
//         userId: user.id,
//         type:  'out',
//         value:  balance,
//         name:  'collect',
//         collectId: id,
//       })

//     }
//   }

//   console.log(':)')
// }

// main()
