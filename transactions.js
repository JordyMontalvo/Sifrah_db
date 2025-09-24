const db = require('./db')

const { User } = db
const { Transaction } = db

async function main() {

  const users = await User.find({})
  const transactions = await Transaction.find({ virtual: true })

  for (let user of users) {

    
    let ins  = 0
    let outs = 0


    for (let transaction of transactions) {

      if(transaction.user_id == user.id && transaction.type == 'in') {
        ins += transaction.value
      }

      if(transaction.user_id == user.id && transaction.type == 'out') {
        outs += transaction.value
      }
    }

    const _balance = ins - outs

    if(_balance > 0) {
      console.log(user.name, user.lastName, user.dni)
      console.log(_balance)


      await Transaction.insert({
        date:    new Date(),
        user_id: user.id,
        type:   'out',
        value:   _balance,
        name:   'closed reset',
        virtual: true,
      })
    }
  }
}

main()
