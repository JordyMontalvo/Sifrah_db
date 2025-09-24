const db = require('./db')

const { User, Tree } = db

// let tree = []

function find(id) {

  const node = tree.find(e => e.id == id)

  // if(node.id == '4o9tdup0u23') {
  //   console.log(node.name, node.id)
  //   console.log('')
  // }

  node.childs.forEach(_id => {

    const _node = tree.find(e => e.id == _id)

    // if(node.id == '4o9tdup0u23') {
    //   console.log(_node.name, _node.parent)
    // }

    if(_node.parent != node.id) {
      console.log('-------------')
      console.log(_node.name, _node.id)
      // console.log(_node.parent)

      const __node = tree.find(e => e.id == _node.parent)

      console.log(_node.parent, __node.name)
      console.log('')
      console.log(node.id, node.name)
      console.log('-------------')

      // Tree.updateOne(
      //   { id: _node.id },
      //   { parent: node.id }
      // )

    }

    // if(node.id != _node.parent) console.log(node.id)

    find(_id)
  })
}


// function find(id) {
//   if (id == null) return

//   const node = tree.find(e => e.id == id)
//   const user = users.find(e => e.id == id)

//   user.flag = true

//   node.childs.forEach(_id => {
//     find(_id)
//   })
// }

// arr = [
//   ["5153599", "5284536"],
//   ["9415901", "5284536"],
//   ["3925321", "5284536"],
//   ["6425752", "5284536"],
//   ["6452026", "5247610"],
//   ["6920967", "6452026"],
//   ["3700025", "6452026"],
//   ["3595716", "6452026"],
//   ["7317528", "3700025"],
//   ["3620159", "3595716"],
//   ["9332568", "3595716"],
//   ["5761927", "9332568"],
//   ["6039342", "6920967"],
//   ["8268293", "6920967"],
//   ["12574605", "8268293"],
//   ["6817058", "8268293"],
//   ["12574606", "12574605"],
//   ["6934502", "6817058"],
//   ["396086", "6934502"]
// ]

async function main() {

  // for(let e of arr) {

  //   const a = e[0]
  //   const b = e[1]

  //   console.log({ a, b})

  //   const userA = await User.findOne({ dni: a })
  //   const userB = await User.findOne({ dni: b })

  //   console.log(`${userA.name} ${userA.lastName}: ${userA.id}`)
  //   console.log(`${userB.name} ${userB.lastName}: ${userB.id}`)

  //   const nodeA = await Tree.findOne({ id: userA.id })
  //   const nodeB = await Tree.findOne({ id: userB.id })

  //   if(!nodeA && nodeB) {
  //     console.log('valido :)')

  //     await Tree.insert({
  //       id: userA.id,
  //       childs: [],
  //       parent: userB.id,
  //     })


  //     let childs = nodeB.childs
  //     childs.push(userA.id)

  //     await Tree.updateOne(
  //       { id: nodeB.id },
  //       { childs }
  //     )


  //   } else {
  //     console.log('invalido :(')
  //   }

  //   console.log('')
  // }


  tree = await Tree.find({})
  users = await User.find({})


  tree.forEach(node => {
    const user = users.find(e => e.id == node.id)

    node.name = user.name
  })

  find('5f0e0b67af92089b5866bcd0')

  // users.forEach(user => {
  //   const name = user.name
  //   const flag = user.flag

  //   if(user.flag) console.log({ name, flag })
  // })

  // users.forEach(async user => {
  //   const name = user.name
  //   const flag = user.flag

  //   if(!user.flag) {
  //     await Tree.deleteOne(
  //       { id: user.id }
  //     )
  //     await User.deleteOne(
  //       { id: user.id }
  //     )
  //     console.log({ name, flag })
  //   }
  // })

  // let tops = []
  // tree.forEach(node => {
  //   // console.log(node.top)
  //   tops.push(node.top)
  // })

  // tops.sort()

  // console.log(tops)
}

main()







// const db = require('./db')

// const { User, Tree } = db

// let tree = []
// let ids  = []

// function find(id, lvl) {
//   if(!id) return

//   const i = tree.findIndex(node => node.id == id)

//   const name   = tree[i].name
//   const childs = tree[i].childs

//   // console.log({ id, name, lvl })

//   ids.push(id)

//   find(childs[0], lvl + 1)
//   find(childs[1], lvl + 1)
//   find(childs[2], lvl + 1)
// }

// async function main() {

//   tree = await Tree.find({})

//   // get affiliated users
//   const users = await User.find({ affiliated: true })

//   // enrich tree
//   for( user of users) {
//     const i = tree.findIndex(node => node.id == user.id)
//     tree[i].name = user.name
//   }

//   find('j2kkyfumyu8', 0)

//   // console.log(ids)

//   // Codigo1
//   // Laura Anavel Revollar Hinostroza
//   // Sandra canchuricra sullcaray
//   // Vilma sullcaray gaspar
//   // Sabina ontiveros lajo

//   // j2kkyfumyu8
//   // xptl18nzwaq
//   // ggwz3y9dq2d
//   // 6k57rnsazqh
//   // g2p4r0fm59k


//   // for( id of ids) {

//   //   if( id != 'j2kkyfumyu8' && id != 'xptl18nzwaq' && id != 'ggwz3y9dq2d' && id != '6k57rnsazqh' && id != 'g2p4r0fm59k' ) {

//   //     await User.update(
//   //       { id },
//   //       { removed: true }
//   //     )

//   //     console.log(`updated ${id}`)
//   //   }
//   // }


//   // for( id of ids) {
//   //   await Tree.deleteOne({ id })
//   //   console.log(`removed: ${id}`)
//   // }


//   // change passwords
//   // for( id of ids) {
//   //   await User.update(
//   //     { id },
//   //     { password: '$2b$12$9aecatt58CeNovW31i0Zu.RJiXHqfsEDcx4cBbgJhzfon7px2zHZK' }
//   //   )
//   //   console.log(`updated ${id}`)
//   // }

// }

// main()
