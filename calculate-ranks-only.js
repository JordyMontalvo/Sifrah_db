/**
 * SCRIPT PARA CALCULAR Y ACTUALIZAR RANGOS
 * 
 * Este script calcula los rangos de los usuarios y los actualiza en la base de datos.
 * NO calcula:
 * - Bonificaciones residuales
 * - Bonos de excedente
 * - Pagos por rango
 * 
 * Útil para calcular y actualizar solo los rangos sin ejecutar el proceso completo
 */

const db = require('./db')
const fs = require('fs')
const rankCalculation = require('./rank-calculation')

const { User, Tree } = db

let users = []
let tree = []
let logs = [] // Array to store all logs

// Helper function to add logs
function addLog(log) {
  console.log(log) // Keep console.log for terminal output
  logs.push(log) // Store in logs array
}

/**
 * ENRIQUECE LOS DATOS DEL ÁRBOL CON INFORMACIÓN DE USUARIOS
 */
function enrichTreeData() {
  console.log('🔗 Enriqueciendo datos del árbol...')
  
  tree.forEach((node) => {
    // Buscar el usuario correspondiente a este nodo del árbol
    const user = users.find((e) => e.id == node.id)
    
    if (!user) {
      console.warn(`⚠️ Usuario no encontrado para nodo ${node.id}`)
      return
    }

    // ========================================
    // DATOS BÁSICOS DEL USUARIO
    // ========================================
    node.parentId = user.parentId           // ID del patrocinador directo
    node.plan = user.plan                  // Plan del usuario
    node.dni = user.dni                    // DNI del usuario
    node.name = user.name + ' ' + user.lastName  // Nombre completo
    
    // ========================================
    // ESTADO DE ACTIVACIÓN
    // ========================================
    node.activated = user.activated        // Estado de activación (true/false)
    node._activated = user._activated ? user._activated : false  // Activación temporal
    
    // ========================================
    // PUNTOS Y RECONSUMO
    // ========================================
    node.points = Number(user.points) || 0     // Puntos personales del usuario
    node.affiliation_points = user.affiliation_points ? user.affiliation_points : 0  // Puntos de afiliación
    // Reconsumo: Se toma el MAYOR valor entre puntos de productos y afiliación (SIN SUMAR)
    // "si no tiene puntos reconsumo que cuente los puntos de afilicion, no tiene que sumar nada"
    node.reconsumo = Math.max(Number(user.points) || 0, Number(user.affiliation_points) || 0)
  })
  
  console.log(`✅ Datos enriquecidos para ${tree.length} nodos`)
}

/**
 * FUNCIÓN PRINCIPAL - Solo cálculo de rangos
 */
async function main() {
  console.log('🚀 Iniciando cálculo y actualización de rangos...\n')

  // ========================================
  // PASO 1: OBTENER DATOS DE LA BASE DE DATOS
  // ========================================
  console.log('📊 Obteniendo datos de usuarios y árbol...')
  
  // Obtener todos los usuarios (no filtrar por tree: true)
  users = await User.find({})
  tree = await Tree.find({})
  
  console.log(`✅ Obtenidos ${users.length} usuarios y ${tree.length} nodos del árbol\n`)

  // ========================================
  // PASO 2: ENRIQUECER DATOS DEL ÁRBOL
  // ========================================
  console.log('🔗 Enriqueciendo datos del árbol con información de usuarios...')
  enrichTreeData()
  console.log('')

  // ========================================
  // PASO 3: CALCULAR PUNTOS TOTALES POR AFILIADOS DIRECTOS ACTIVOS
  // ========================================
  console.log('💰 Calculando puntos totales por afiliados directos activos...')
  
  for (let node of tree) {
    // Inicializar contadores para este nodo
    node.total_points = 0
    node.total_arr = []

    // Obtener afiliados directos usando el campo childs del árbol
    if (node.childs && node.childs.length > 0) {
      // Buscar los usuarios correspondientes a los IDs en childs
      const directUsers = users.filter(u => node.childs.includes(u.id))
      
      addLog(`DEBUG PUNTOS - Usuario ${node.name} tiene ${node.childs.length} hijos: ${JSON.stringify(node.childs)}`)
      addLog(`DEBUG PUNTOS - Encontrados ${directUsers.length} usuarios directos`)
      
      // Procesar cada usuario directo
      for (let directUser of directUsers) {
        // Se considera línea activa si total_points es diferente de cero
        const userTotalPoints = directUser.total_points || 0
        const isActiveLine = userTotalPoints !== 0
        
        addLog(`DEBUG PUNTOS - Usuario directo ${directUser.name}: total_points=${userTotalPoints}`)
        
        if (isActiveLine) {
          // Usar total_points de la DB (ya incluye puntos personales + afiliación)
          node.total_points += userTotalPoints
          node.total_arr.push(userTotalPoints)
          addLog(`DEBUG PUNTOS - AGREGADO: ${directUser.name} con ${userTotalPoints} puntos (línea activa)`)
        } else {
          addLog(`DEBUG PUNTOS - NO AGREGADO: ${directUser.name} (total_points=${userTotalPoints} === 0)`)
        }
      }
    } else {
      addLog(`DEBUG PUNTOS - Usuario ${node.name} no tiene hijos`)
    }

    // Ordenar puntos de mayor a menor para facilitar cálculos posteriores
    node.total_arr.sort((a, b) => b - a)
    addLog(`DEBUG PUNTOS - Total puntos para ${node.name}: ${node.total_points}, array: ${JSON.stringify(node.total_arr)}`)
  }

  console.log('')

  // ========================================
  // PASO 4: ASIGNAR RANGOS INICIALES
  // ========================================
  console.log('🏆 Asignando rangos iniciales...')
  rankCalculation.initialRanks(tree, users, addLog)
  console.log('')

  // ========================================
  // PASO 5: COMPLETAR RANGOS CON DEPENDENCIAS
  // ========================================
  console.log('🔗 Completando rangos con dependencias...')
  rankCalculation.completeDependencyRanks(tree)
  console.log('')

  // ========================================
  // PASO 6: MOSTRAR RESULTADOS
  // ========================================
  addLog('📊 RESULTADOS DEL CÁLCULO DE RANGOS:\n')
  addLog('='.repeat(80))
  
  const usersByRank = {}
  for (let node of tree) {
    if (node.rank && node.rank !== 'none') {
      if (!usersByRank[node.rank]) {
        usersByRank[node.rank] = []
      }
      usersByRank[node.rank].push({
        name: node.name,
        total_points: node.total_points,
        reconsumo: node.reconsumo,
        total_arr: node.total_arr,
        points: node.points,
        affiliation_points: node.affiliation_points
      })
    }
  }

  // Ordenar rangos de mayor a menor
  const rankOrder = ['EMBAJADOR SIFRAH', 'DIAMANTE IMPERIAL', 'TRIPLE DIAMANTE', 'DOBLE DIAMANTE', 
                     'DIAMANTE', 'ESMERALDA', 'RUBÍ', 'ORO', 'PLATA', 'BRONCE', 'ACTIVO']
  
  for (const rank of rankOrder) {
    if (usersByRank[rank]) {
      addLog(`\n🏆 ${rank}: ${usersByRank[rank].length} usuario(s)`)
      addLog('-'.repeat(80))
      for (const user of usersByRank[rank]) {
        addLog(`  ${user.name}`)
        addLog(`    Puntos totales: ${user.total_points}`)
        addLog(`    Reconsumo: ${user.reconsumo} (Productos: ${user.points}, Afiliación: ${user.affiliation_points})`)
        addLog(`    Array puntos (Grupales): [${user.total_arr.join(', ')}]`)
        addLog('')
      }
    }
  }

  addLog('='.repeat(80))
  
  // Resumen
  const totalWithRanks = Object.values(usersByRank).reduce((sum, users) => sum + users.length, 0)
  const totalNone = tree.filter(n => !n.rank || n.rank === 'none').length
  
  addLog(`\n📈 RESUMEN:`)
  addLog(`   Total usuarios con rango: ${totalWithRanks}`)
  addLog(`   Total usuarios sin rango (none): ${totalNone}`)
  addLog(`   Total usuarios: ${tree.length}`)

  // Lista compacta para fácil lectura
  addLog('\n📋 LISTA COMPACTA DE RANGOS CERRADOS:')
  const allRankedUsers = []
  for (const rank of rankOrder) {
    if (usersByRank[rank]) {
      for (const user of usersByRank[rank]) {
        allRankedUsers.push(`${user.name} - ${rank} (Prod: ${user.points}, Afil: ${user.affiliation_points}, Grup: ${user.total_points})`)
      }
    }
  }
  allRankedUsers.forEach(u => addLog(u))


  // ========================================
  // PASO 7: ACTUALIZAR RANGOS EN LA BASE DE DATOS
  // ========================================
  console.log('\n💾 Actualizando rangos en la base de datos...')
  
  // OPTIMIZACIÓN: Agrupar actualizaciones en operaciones bulk
  const updates = []
  let updatedCount = 0
  let noneCount = 0

  for (let node of tree) {
    if (node.rank && node.rank !== 'none') {
      updates.push({
        updateOne: {
          filter: { id: node.id },
          update: {
            $set: {
              rank: node.rank
            }
          }
        }
      })
      updatedCount++
    } else {
      // Actualizar usuarios sin rango a 'none'
      updates.push({
        updateOne: {
          filter: { id: node.id },
          update: {
            $set: {
              rank: 'none'
            }
          }
        }
      })
      noneCount++
    }
  }

  // Ejecutar todas las actualizaciones en un solo batch
  if (updates.length > 0) {
    await User.bulkWrite(updates)
    console.log(`✅ Actualizados ${updatedCount} usuarios con rango en la base de datos`)
    console.log(`✅ Actualizados ${noneCount} usuarios sin rango (none) en la base de datos`)
    console.log(`✅ Total: ${updates.length} usuarios actualizados`)
  } else {
    console.log('⚠️ No hay usuarios para actualizar')
  }

  // ========================================
  // GUARDAR LOGS EN ARCHIVO
  // ========================================
  const date = new Date().toISOString().split('T')[0]
  const filename = `rank_calculation_logs_${date}.txt`
  fs.writeFileSync(filename, logs.join('\n'))
  console.log(`\n📝 Logs guardados en: ${filename}`)

  console.log('\n✅ Cálculo y actualización de rangos completado')
}

// Ejecutar
main().catch(console.error)

