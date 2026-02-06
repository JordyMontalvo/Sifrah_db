const db = require('./db')

const { User } = db
const { Transaction } = db

async function main() {

  const users = await User.find({})
  const transactions = await Transaction.find({ virtual: true })

  // OPTIMIZACIÓN: Agrupar transacciones por user_id usando Map para búsquedas O(1)
  const transactionsByUserId = new Map()
  
  for (let transaction of transactions) {
    const userId = transaction.user_id
    if (!transactionsByUserId.has(userId)) {
      transactionsByUserId.set(userId, { ins: [], outs: [] })
    }
    
    const userTransactions = transactionsByUserId.get(userId)
    if (transaction.type === 'in') {
      userTransactions.ins.push(transaction.value)
    } else if (transaction.type === 'out') {
      userTransactions.outs.push(transaction.value)
    }
  }

  // OPTIMIZACIÓN: Agrupar inserts para batch
  const transactionsToInsert = []

  for (let user of users) {
    const userTransactions = transactionsByUserId.get(user.id) || { ins: [], outs: [] }
    
    // Calcular totales
    const ins = userTransactions.ins.reduce((sum, val) => sum + val, 0)
    const outs = userTransactions.outs.reduce((sum, val) => sum + val, 0)
    const _balance = ins - outs

    if (_balance > 0) {
      console.log(user.name, user.lastName, user.dni)
      console.log(_balance)

      // Agregar a la lista para insert en batch
      transactionsToInsert.push({
        date: new Date(),
        user_id: user.id,
        type: 'out',
        value: _balance,
        name: 'closed reset',
        virtual: true,
      })
    }
  }

  // OPTIMIZACIÓN: Insertar todas las transacciones en un solo batch
  if (transactionsToInsert.length > 0) {
    await Transaction.insertMany(transactionsToInsert)
    console.log(`\n✅ Insertadas ${transactionsToInsert.length} transacciones en batch`)
  }
}

main()
