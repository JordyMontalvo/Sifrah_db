/**
 * SCRIPT PARA CALCULAR SOLO RANGOS
 * 
 * Este script solo calcula los rangos de los usuarios sin:
 * - Calcular bonificaciones residuales
 * - Calcular bonos de excedente
 * - Calcular pagos por rango
 * - Actualizar la base de datos
 * 
 * Útil para pruebas y debugging del cálculo de rangos
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
    node.points = Number(user.points)     // Puntos personales del usuario
    node.affiliation_points = user.affiliation_points ? user.affiliation_points : 0  // Puntos de afiliación
    node.reconsumo = user.points || 0     // Reconsumo mensual (usar points como reconsumo)
  })
  
  console.log(`✅ Datos enriquecidos para ${tree.length} nodos`)
}

/**
 * FUNCIÓN PRINCIPAL - Solo cálculo de rangos
 */
async function main() {
  console.log('🚀 Iniciando cálculo de rangos (solo cálculo, sin bonificaciones ni DB)...\n')

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
        // Solo considerar usuarios activos (activated=true)
        const isActiveUser = directUser.activated
        
        addLog(`DEBUG PUNTOS - Usuario directo ${directUser.name}: activated=${directUser.activated}, total_points=${directUser.total_points}`)
        
        if (isActiveUser) {
          // Usar total_points de la DB (ya incluye puntos personales + afiliación)
          const directPoints = directUser.total_points || 0
          node.total_points += directPoints
          node.total_arr.push(directPoints)
          addLog(`DEBUG PUNTOS - AGREGADO: ${directUser.name} con ${directPoints} puntos`)
        } else {
          addLog(`DEBUG PUNTOS - NO AGREGADO (no activo): ${directUser.name}`)
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
  console.log('📊 RESULTADOS DEL CÁLCULO DE RANGOS:\n')
  console.log('='.repeat(80))
  
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
        total_arr: node.total_arr
      })
    }
  }

  // Ordenar rangos de mayor a menor
  const rankOrder = ['EMBAJADOR SIFRAH', 'DIAMANTE IMPERIAL', 'TRIPLE DIAMANTE', 'DOBLE DIAMANTE', 
                     'DIAMANTE', 'ESMERALDA', 'RUBÍ', 'ORO', 'PLATA', 'BRONCE', 'ACTIVO']
  
  for (const rank of rankOrder) {
    if (usersByRank[rank]) {
      console.log(`\n🏆 ${rank}: ${usersByRank[rank].length} usuario(s)`)
      console.log('-'.repeat(80))
      for (const user of usersByRank[rank]) {
        console.log(`  ${user.name}`)
        console.log(`    Puntos totales: ${user.total_points}`)
        console.log(`    Reconsumo: ${user.reconsumo}`)
        console.log(`    Array puntos: [${user.total_arr.join(', ')}]`)
        console.log('')
      }
    }
  }

  console.log('='.repeat(80))
  
  // Resumen
  const totalWithRanks = Object.values(usersByRank).reduce((sum, users) => sum + users.length, 0)
  const totalNone = tree.filter(n => !n.rank || n.rank === 'none').length
  
  console.log(`\n📈 RESUMEN:`)
  console.log(`   Total usuarios con rango: ${totalWithRanks}`)
  console.log(`   Total usuarios sin rango (none): ${totalNone}`)
  console.log(`   Total usuarios: ${tree.length}`)

  // ========================================
  // GUARDAR LOGS EN ARCHIVO
  // ========================================
  const date = new Date().toISOString().split('T')[0]
  const filename = `rank_calculation_logs_${date}.txt`
  fs.writeFileSync(filename, logs.join('\n'))
  console.log(`\n📝 Logs guardados en: ${filename}`)

  console.log('\n✅ Cálculo de rangos completado (sin actualizar DB)')
}

// Ejecutar
main().catch(console.error)

