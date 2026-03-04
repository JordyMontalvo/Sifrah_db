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
  // PASO 3: CARGAR PUNTOS DESDE LA BASE DE DATOS
  // ========================================
  // total_points ya fue calculado por closed.js aplicando el V.M.P (pierna mayor truncada).
  // Aquí solo se carga ese valor y se construye total_arr (las piernas directas)
  // para uso interno (conteo de líneas activas y V.M.P display en logs).
  console.log('💰 Cargando puntos y construyendo piernas directas...')
  
  for (let node of tree) {
    // Cargar total_points desde DB (ya calculado con V.M.P por closed.js)
    const user = users.find(u => u.id === node.id)
    node.total_points = user ? (user.total_points || 0) : 0

    // Construir total_arr: puntos de cada pierna directa (para calcular líneas activas y VMP)
    node.total_arr = []

    if (node.childs && node.childs.length > 0) {
      const directUsers = users.filter(u => node.childs.includes(u.id))
      
      for (let directUser of directUsers) {
        const userTotalPoints = directUser.total_points || 0
        if (userTotalPoints !== 0) {
          node.total_arr.push(userTotalPoints)
        }
      }
      
      // Ordenar de mayor a menor
      node.total_arr.sort((a, b) => b - a)
    }

    addLog(`DEBUG PUNTOS - ${node.name}: total_points (DB)=${node.total_points}, piernas=[${node.total_arr.join(', ')}]`)
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

