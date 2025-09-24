const db = require('./db')

const { User } = db

const Pays = [
  {
    'name' : 'star',
    'payed':  false,
  },
  {
    'name' : 'master',
    'payed':  false,
  },
  {
    'name' : 'silver',
    'payed':  false,
  },
  {
    'name' : 'gold',
    'payed':  false,
  },
  {
    'name' : 'sapphire',
    'payed':  false,
  },
  {
    'name' : 'RUBI',
    'payed':  false,
  },
  {
    'name' : 'DIAMANTE',
    'payed':  false,
  },
  {
    'name' : 'DOBLE DIAMANTE',
    'payed':  false,
  },
  {
    'name' : 'TRIPLE DIAMANTE',
    'payed':  false,
  },
  {
    'name' : 'DIAMANTE ESTRELLA',
    'payed':  false,
  },
]

async function main() {

  const users = await User.find({})

  for (const user of users) {
    if(user.pays) {
      for(const P of Pays) {
        const pay = user.pays.find(e => e.name == P.name)
        if(!pay) user.pays.push(P)
      }
    }
  }

  for (const user of users) {
    if(user.pays) {
      console.log(user.name)
      console.log(user.pays)
      console.log('')

      await User.updateOne({ id: user.id }, {
        pays: user.pays
      })
    }
  }

  // for (const user of users) {
  //   if(user.pays) {
  //     console.log(user.name, user.pays.length)
  //     // console.log(user.pays)
  //     for(const pay of user.pays) {
  //       if(pay.payed) console.log(':)')
  //     }
  //     console.log('')
  //   }
  // }
}

main()
