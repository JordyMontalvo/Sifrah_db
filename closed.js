const db = require('./db')
const fs = require('fs')

function rand() { return Math.random().toString(36).substr(2) }

const { User, Tree, Transaction, Closed } = db

let users = []
let tree = []
let logs = [] // Array to store all logs

// Helper function to add logs
function addLog(log) {
  console.log(log) // Keep console.log for terminal output
  logs.push(log) // Store in logs array
}

/**
 * FUNCIÓN PRINCIPAL - Cálculo de Rangos MLM
 * 
 * Esta función ejecuta el proceso completo de cálculo de rangos:
 * 1. Obtiene usuarios y árbol de la base de datos
 * 2. Enriquece los datos del árbol con información de usuarios
 * 3. Calcula puntos totales por afiliados directos activos
 * 4. Asigna rangos según requisitos (puntos totales, líneas activas, reconsumo)
 * 5. Calcula bonificaciones residuales y de excedente
 * 6. Actualiza la base de datos con los resultados
 */
async function main() {
  console.log('🚀 Iniciando cálculo de rangos MLM...')

  // ========================================
  // PASO 1: OBTENER DATOS DE LA BASE DE DATOS
  // ========================================
  console.log('📊 Obteniendo datos de usuarios y árbol...')
  
  // Obtener todos los usuarios (no filtrar por tree: true)
  users = await User.find({})
  tree = await Tree.find({})
  
  console.log(`✅ Obtenidos ${users.length} usuarios y ${tree.length} nodos del árbol`)

  // ========================================
  // PASO 2: ENRIQUECER DATOS DEL ÁRBOL
  // ========================================
  console.log('🔗 Enriqueciendo datos del árbol con información de usuarios...')
  enrichTreeData()

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

  // ========================================
  // PASO 4: ASIGNAR RANGOS INICIALES
  // ========================================
  console.log('🏆 Asignando rangos iniciales...')
  initialRanks()

  // ========================================
  // PASO 5: COMPLETAR RANGOS CON DEPENDENCIAS
  // ========================================
  console.log('🔗 Completando rangos con dependencias...')
  completeDependencyRanks()

  // residual bonus
  for (let node of tree) if (node.parent) pay_residual(node.parent, 0, node)

  // bono excedente
  for (let node of tree) {
    const excedent = node.points - 150

    if(excedent > 0) { // si compra mas de 150 puntos

      const parent = tree.find(e => e.id == node.parentId)

      if(parent && parent.activated) {
        parent.excedent_bonus += (10 / 100 * excedent) // paga el 10 % al patrocinador

        parent.excedent_bonus_arr.push({
          dni: node.dni,
          name: node.name,
          val: (10 / 100 * excedent),
        })
      }

      if(node.activated) {
        node.excedent_bonus += (20 / 100 * excedent) // paga el 20% al comprador

        node.excedent_bonus_arr.push({
          dni: node.dni,
          name: node.name,
          val: (20 / 100 * excedent),
        })
      }
    }
  }

  // bono alcance rango
  for (let node of tree) {

    const pos = node.pays.findIndex((e) => e.name == node.rank)

    if (pos != -1) {
      for (let i = 0; i <= pos; i++) {

        const pay = node.pays[i]

        if (!pay.payed) {
          // pay.payed = true
          node._pays.push(pay)
        }
      }
    }
  }

  for (let node of tree) {

    node._pays.forEach((_pay) => {

      const pay = node.pays.find((e) => e.name == _pay.name)
      pay.payed = true
    })
  }

  for (let node of tree) {
    addLog('')
    addLog(node.name)
    addLog('puntos totales: ' + node.total_points + ' ' + JSON.stringify(node.total_arr))
    addLog('reconsumo: ' + (node.reconsumo || 0))
    addLog('rango: ' + node.rank)
    
    // Mostrar líneas activas
    const activeLines = getActiveLines(node) // Mínimo para mostrar
    addLog('líneas activas: ' + activeLines)
    
    if(node.residual_bonus.toFixed(2) != '0.00') {
      addLog('bono residual: ' + node.residual_bonus.toFixed(2))
    }

    for(let r of node.residual_bonus_arr) {
      addLog('-: ' + r.n + ' ' + r.name + ' ' + r.val + ' ' + r.r + ' ' + r.amount.toFixed(2))
    }

    if(node.excedent_bonus) {
      addLog('')
      addLog('bono excedente: ' + node.excedent_bonus)
    }

    for(let r of node.excedent_bonus_arr) {
      addLog('-: ' + r.name + ' ' + r.val)
    }

    if(node._pays.length) {
      for(let _p of node._pays) {
        addLog('')
        addLog('bono alcance de rango: ')
        addLog('-: ' + _p.name + ' ' + _p.value)
      }
    }

    addLog('----------------------------------------------------------------')
  }

  // Save all logs to file
  const date = new Date().toISOString().split('T')[0]
  const filename = `network_logs_${date}.txt`
  fs.writeFileSync(filename, logs.join('\n'))
  console.log(`\nLogs have been saved to ${filename}`)

  updateDB()
}

let r = [
  0.0385, 0.0385, 0.0513, 0.0513, 0.0513, 0.0256, 0.0077, 0.0051, 0.0026,
  0.0103,
]


const pays = [
  {
    name: 'BRONCE',
    payed: false,
    value: 60,
  },
  {
    name: 'PLATA',
    payed: false,
    value: 300,
  },
  {
    name: 'ORO',
    payed: false,
    value: 600,
  },
  {
    name: 'RUBÍ',
    payed: false,
    value: 1200,
  },
  {
    name: 'ESMERALDA',
    payed: false,
    value: 2500,
  },
  {
    name: 'DIAMANTE',
    payed: false,
    value: 5000,
  },
  {
    name: 'DOBLE DIAMANTE',
    payed: false,
    value: 10000,
  },
  {
    name: 'TRIPLE DIAMANTE',
    payed: false,
    value: 20000,
  },
  {
    name: 'DIAMANTE IMPERIAL',
    payed: false,
    value: 40000,
  },
  {
    name: 'EMBAJADOR SIFRAH',
    payed: false,
    value: 80000,
  },
]

// EMBAJADOR CORONA
// DIAMANTE
// DIAMANTE CORONA

const ranks = [
  // Ordenarlos de forma descendente al rango
  {
    pos: 10,
    rank: 'EMBAJADOR SIFRAH',
    type_calculation: 'simple',
    minimum_frontals: 6,
    threshold_points: 400000, // PT
    maximum_large_leg: 80000, // PML
    maximum_others_leg: 66666.7, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 9,
    rank: 'DIAMANTE IMPERIAL',
    type_calculation: 'simple',
    minimum_frontals: 6,
    threshold_points: 225000, // PT
    maximum_large_leg: 45000, // PML
    maximum_others_leg: 37500, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 8,
    rank: 'TRIPLE DIAMANTE',
    type_calculation: 'simple',
    minimum_frontals: 5,
    threshold_points: 125000, // PT
    maximum_large_leg: 27500, // PML
    maximum_others_leg: 25000, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 7,
    rank: 'DOBLE DIAMANTE',
    type_calculation: 'simple',
    minimum_frontals: 5,
    threshold_points: 80000, // PT
    maximum_large_leg: 19200, // PML
    maximum_others_leg: 16000, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 6,
    rank: 'DIAMANTE',
    type_calculation: 'simple',
    minimum_frontals: 4,
    threshold_points: 38000, // PT
    maximum_large_leg: 10260, // PML
    maximum_others_leg: 9500, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 5,
    rank: 'ESMERALDA',
    type_calculation: 'simple',
    minimum_frontals: 4,
    threshold_points: 18000, // PT
    maximum_large_leg: 5400, // PML
    maximum_others_leg: 4500, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 4,
    rank: 'RUBÍ',
    type_calculation: 'simple',
    minimum_frontals: 4,
    threshold_points: 8000, // PT
    maximum_large_leg: 2400, // PML
    maximum_others_leg: 2000, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 3,
    rank: 'ORO',
    type_calculation: 'simple',
    minimum_frontals: 3,
    threshold_points: 3300, // PT
    maximum_large_leg: 1320, // PML
    maximum_others_leg: 1100, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 2,
    rank: 'PLATA',
    type_calculation: 'simple',
    minimum_frontals: 3,
    threshold_points: 1500, // PT
    maximum_large_leg: 675, // PML
    maximum_others_leg: 500, // PML-R
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 1,
    rank: 'BRONCE',
    type_calculation: 'simple',
    minimum_frontals: 2,
    threshold_points: 600, // PT
    maximum_large_leg: 360, // PML
    maximum_others_leg: 300, // PML-R
    reconsumo_required: 120,
    rank_dependencies: [],
  },
]
ranks.push({
  pos: 0,
  rank: 'ACTIVO',
  type_calculation: 'simple',
  minimum_frontals: 0,
  threshold_points: 1, // PT
  maximum_large_leg: 0, // PML
  maximum_others_leg: 0, // PML-R
  reconsumo_required: 120,
  rank_dependencies: [],
})
ranks.push({
  pos: -1,
  rank: 'none',
  type_calculation: 'temp',
  rank_dependencies: [],
})

/**
 * ENRIQUECE LOS DATOS DEL ÁRBOL CON INFORMACIÓN DE USUARIOS
 * 
 * Esta función toma cada nodo del árbol y le agrega información del usuario correspondiente
 * de la base de datos. Es el puente entre la estructura del árbol y los datos de usuarios.
 * 
 * @param {User[]} users - Array de usuarios de la base de datos
 * @returns {void}
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
    
    // ========================================
    // BONIFICACIONES (inicializar en 0)
    // ========================================
    node.residual_bonus = 0               // Bono residual acumulado
    node.residual_bonus_arr = []          // Array de bonos residuales detallados
    node.excedent_bonus = 0               // Bono de excedente acumulado
    node.excedent_bonus_arr = []          // Array de bonos de excedente detallados
    
    // ========================================
    // SISTEMA DE PAGOS POR RANGO
    // ========================================
    node.pays = user.pays ? user.pays : pays  // Pagos por rango (usar los del usuario o los por defecto)
    node._pays = []                        // Pagos pendientes por procesar
  })
  
  console.log(`✅ Datos enriquecidos para ${tree.length} nodos`)
}

/**
 * Crea un arreglo con los pagos residuales correspondientes de un usuario de la red
 * @param {string}  id Id del nodo iterado
 * @param {number}  n Nivel del nodo iterado
 * @param {object}  user Objeto del usuario beneficiario
 * @param {string}  user.dni
 * @param {string}  user.name
 * @param {number}  user.points
 * @returns {void}
 * @example node[].residual_bonus_arr = [{
 *  n: number,
 *  dni: string,
 *  name: string,
 *  val: number,
 *  r: number,
 *  amount: number,
 * }]
 */
function pay_residual(id, n, user) {

  // console.log('pay_residual: ', id, n, user.name)

  if (n == 10) return

  let node = tree.find((e) => e.id == id)
  let _id = node.parent

  let _points

  if (node._activated || node.activated) {
    // console.log('activo ...')
    // activacion simple - truncado a 50
    if (node._activated && !node.activated)
      _points = user.points > 50 ? 50 : user.points

    // activacion full - truncado a 150
    if (node._activated && node.activated)
      _points = user.points > 150 ? 150 : user.points

    // console.log('_points: ', _points)

    const amount = r[n] * _points * 2.6
    // const amount = r[n] * _points

    if (amount > 0) {
      node.residual_bonus += amount

      node.residual_bonus_arr.push({
        n,
        dni: user.dni,
        name: user.name,
        val: user.points,
        r: r[n],
        amount,
        rr: 2.6,
      })
    }
  }

  if (!node._activated && !node.activated) {
    if (_id) pay_residual(_id, n, user)
  } else {
    if (_id) pay_residual(_id, n + 1, user)
  }
}

/**
 * Obtiene la cantidad de puntos que gana un nodo por su red hacia abajo
 * @param {string}  id Id del nodo
 * @returns {number}
 */
function total_points(id) {
  const node = tree.find((e) => e.id == id)

  let ret = node.points + node.affiliation_points

  const directs = tree.filter((e) => e.parentId == node.id)

  for (let d of directs) {
    ret += total_points(d.id)
  }

  return ret
}

/**
 * ASIGNA RANGOS INICIALES A TODOS LOS USUARIOS
 * 
 * Esta función recorre todos los nodos del árbol y asigna el rango correspondiente
 * según los requisitos de puntos totales, líneas activas y reconsumo.
 * 
 * Solo los usuarios con activated=true pueden tener rangos superiores a 'none'.
 * 
 * @returns {void}
 */
const initialRanks = () => {
  console.log('🏆 Asignando rangos iniciales...')
  let usersWithRanks = 0
  
  for (let node of tree) {
    if (node.activated) {
      // Usuario activado: calcular rango según requisitos
      node.rank = calc_rank(node)
      usersWithRanks++
      addLog(`✅ Usuario ${node.name} asignado rango: ${node.rank}`)
    } else {
      // Usuario no activado: rango 'none'
      node.rank = 'none'
      addLog(`❌ Usuario ${node.name} no activado, rango: none`)
    }
  }
  
  console.log(`✅ Rangos asignados: ${usersWithRanks} usuarios activos de ${tree.length} total`)
}

/**
 * Verifica si un usuario cumple con el reconsumo requerido
 * @param {Tree} node Nodo del usuario
 * @param {number} reconsumo_required Reconsumo mínimo requerido
 * @returns {boolean}
 */
const checkReconsumo = (node, reconsumo_required) => {
  // Verificar si el usuario tiene el reconsumo mínimo
  const userReconsumo = node.reconsumo || 0
  return userReconsumo >= reconsumo_required
}

/**
 * Obtiene los datos de las líneas activas (usuarios directos con total_points !== 0)
 * @param {Tree} node Nodo del usuario
 * @returns {Array} Array de objetos con datos de líneas activas
 */
const getActiveLinesData = (node) => {
  const activeLinesData = []
  
  // Usar el campo childs del árbol para identificar afiliados directos
  if (node.childs && node.childs.length > 0) {
    // Buscar los usuarios correspondientes a los IDs en childs
    const directUsers = users.filter(u => node.childs.includes(u.id))
    
    for (let directUser of directUsers) {
      // Se considera línea activa si total_points es diferente de cero
      const userTotalPoints = directUser.total_points || 0
      const isActiveLine = userTotalPoints !== 0
      
      if (isActiveLine) {
        activeLinesData.push({
          userId: directUser.id,
          name: directUser.name,
          points: userTotalPoints
        })
      }
    }
  }
  
  return activeLinesData
}

/**
 * Verifica si las líneas directas están activas
 * Una línea se considera activa si el total_points del usuario frontal es diferente de cero
 * @param {Tree} node Nodo del usuario
 * @returns {number} Número de líneas activas
 */
const getActiveLines = (node) => {
  let activeLines = 0
  
  // Usar el campo childs del árbol para identificar afiliados directos
  if (node.childs && node.childs.length > 0) {
    // Buscar los usuarios correspondientes a los IDs en childs
    const directUsers = users.filter(u => node.childs.includes(u.id))
    
    addLog(`DEBUG - Usuario ${node.name} tiene ${node.childs.length} hijos en childs: ${JSON.stringify(node.childs)}`)
    addLog(`DEBUG - Encontrados ${directUsers.length} usuarios directos`)
    
    for (let directUser of directUsers) {
      // Se considera línea activa si total_points es diferente de cero
      const userTotalPoints = directUser.total_points || 0
      const isActiveLine = userTotalPoints !== 0
      
      addLog(`DEBUG - Usuario directo ${directUser.name}: total_points=${userTotalPoints}`)
      
      if (isActiveLine) {
        activeLines++
        addLog(`DEBUG - LÍNEA ACTIVA: ${directUser.name} (total_points=${userTotalPoints} !== 0)`)
      } else {
        addLog(`DEBUG - LÍNEA NO ACTIVA: ${directUser.name} (total_points=${userTotalPoints} === 0)`)
      }
    }
  } else {
    addLog(`DEBUG - Usuario ${node.name} no tiene hijos`)
  }
  
  addLog(`DEBUG - Total líneas activas para ${node.name}: ${activeLines}`)
  return activeLines
}

/**
 * CALCULA EL RANGO DE UN USUARIO SEGÚN SUS REQUISITOS
 * 
 * Esta función evalúa si un usuario cumple con los requisitos para cada rango,
 * desde el más alto (EMBAJADOR SIFRAH) hasta el más bajo (ACTIVO).
 * 
 * REQUISITOS PARA CADA RANGO:
 * - Puntos Totales (PT): Campo total_points del usuario
 * - Líneas Activas (LA): Número de afiliados directos con activated=true
 * - Reconsumo (RP): Puntos personales del usuario (campo points)
 * 
 * @param {Tree} node - Nodo del usuario a evaluar
 * @returns {string} Rango asignado ('none', 'ACTIVO', 'BRONCE', 'PLATA', etc.)
 */
const calc_rank = (node) => {
  addLog(`\n🔍 EVALUANDO RANGO PARA: ${node.name}`)
  addLog(`📊 Datos del usuario:`)
  addLog(`   - Puntos totales: ${node.total_points}`)
  addLog(`   - Reconsumo: ${node.reconsumo}`)
  addLog(`   - Líneas activas: ${getActiveLines(node)}`)
  
  // ========================================
  // VALIDACIÓN BÁSICA: USUARIO DEBE ESTAR ACTIVADO
  // ========================================
  if (!node.activated) {
    addLog(`❌ Usuario no activado, rango: none`)
    return 'none'
  }
  
  addLog(`✅ Usuario activado, evaluando rangos...`)
  
  // ========================================
  // PREPARAR DATOS PARA EVALUACIÓN
  // ========================================
  const n = node.total_arr.length
  const arr = [...node.total_arr] // Copia para no modificar el original
  
  // Ordenar de mayor a menor para facilitar cálculos
  arr.sort((a, b) => b - a)

  // Obtener solo los rangos de tipo 'simple' (no dependientes)
  const rankLimitsSimple = ranks.filter(
    (el) => el.type_calculation === 'simple'
  )

  /**
   * EVALÚA SI EL USUARIO CUMPLE CON LOS REQUISITOS DE UN RANGO ESPECÍFICO
   * 
   * Esta función interna verifica paso a paso si el usuario cumple con todos
   * los requisitos necesarios para obtener un rango específico.
   * 
   * @param {Object} rankLimitSimple - Configuración del rango a evaluar
   * @returns {string|null} Nombre del rango si cumple, null si no cumple
   */
  const valueRankLimits = (rankLimitSimple) => {
      addLog(`\n🎯 EVALUANDO RANGO: ${rankLimitSimple.rank}`)
      addLog(`📋 Requisitos:`)
      addLog(`   - Puntos Totales: ${rankLimitSimple.threshold_points}`)
      addLog(`   - Líneas Activas: ${rankLimitSimple.minimum_frontals}`)
      addLog(`   - Reconsumo: ${rankLimitSimple.reconsumo_required}`)
      
      // ========================================
      // PASO 1: VERIFICAR RECONSUMO DEL USUARIO
      // ========================================
      addLog(`\n1️⃣ Verificando reconsumo...`)
      if (!checkReconsumo(node, rankLimitSimple.reconsumo_required)) {
        addLog(`❌ No cumple reconsumo: ${node.reconsumo || 0} < ${rankLimitSimple.reconsumo_required}`)
        return null
      }
      addLog(`✅ Cumple reconsumo: ${node.reconsumo || 0} >= ${rankLimitSimple.reconsumo_required}`)

      // ========================================
      // PASO 2: VERIFICAR LÍNEAS ACTIVAS
      // ========================================
      addLog(`\n2️⃣ Verificando líneas activas...`)
      addLog(`📋 Requisito: ${rankLimitSimple.minimum_frontals} líneas activas`)
      
      const activeLines = getActiveLines(node)
      addLog(`📊 Líneas activas encontradas: ${activeLines}`)
      
      if (activeLines < rankLimitSimple.minimum_frontals) {
        addLog(`❌ No cumple líneas activas: ${activeLines} < ${rankLimitSimple.minimum_frontals}`)
        addLog(`💡 El usuario necesita ${rankLimitSimple.minimum_frontals} líneas activas, pero solo tiene ${activeLines}`)
        return null
      }
      addLog(`✅ Cumple líneas activas: ${activeLines} >= ${rankLimitSimple.minimum_frontals}`)

      // ========================================
      // PASO 3: CALCULAR PML Y PML-R (SIN TRUNCAR)
      // ========================================
      addLog(`\n3️⃣ Calculando PML y PML-R...`)
      
      // Obtener solo las líneas activas (usuarios directos activos)
      const activeLinesData = getActiveLinesData(node)
      const activeLinesArr = activeLinesData.map(line => line.points).sort((a, b) => b - a)
      
      addLog(`📊 Líneas activas encontradas: ${JSON.stringify(activeLinesArr)}`)
      addLog(`📋 Límites para ${rankLimitSimple.rank}:`)
      addLog(`   - PML (brazo mayor): debe llegar a ${rankLimitSimple.maximum_large_leg}`)
      addLog(`   - PML-R (líneas menores + reconsumo): debe llegar a ${rankLimitSimple.maximum_others_leg}`)
      
      let pml = 0  // PML sin truncar (para validación)
      let pmlr = 0  // PML-R sin truncar (para validación)
      let pmlTruncado = 0  // PML truncado al máximo del rango
      let pmlrTruncado = 0  // PML-R truncado al máximo del rango
      
      if (activeLinesArr.length > 0) {
        // ========================================
        // A) PML: Brazo con el puntaje más grande (sin truncar)
        // ========================================
        const brazoMayor = activeLinesArr[0]  // La línea mayor (ya está ordenada)
        pml = brazoMayor
        
        // Truncar PML al máximo permitido del rango (solo si excede el límite)
        // Si tiene menos que el máximo, se usa el valor real (ej: 200 < 360, usa 200)
        // Si excede el máximo, se trunca al límite (ej: 400 > 360, usa 360)
        pmlTruncado = Math.min(pml, rankLimitSimple.maximum_large_leg)
        
        addLog(`\n📊 PML (Brazo mayor): ${brazoMayor} puntos`)
        addLog(`📊 PML truncado al límite del rango: ${pmlTruncado} puntos (máximo: ${rankLimitSimple.maximum_large_leg})`)
        
        // ========================================
        // B) SUMAR RECONSUMO DEL USUARIO AL BRAZO MÁS PEQUEÑO
        // ========================================
        const reconsumoUsuario = node.points || 0  // Reconsumo = puntos personales
        const smallestLineIndex = activeLinesArr.length - 1
        const smallestLinePoints = activeLinesArr[smallestLineIndex]
        
        addLog(`💰 Agregando reconsumo del usuario (${reconsumoUsuario}) al brazo más pequeño (${smallestLinePoints})...`)
        
        const nuevaLineaMasPequena = smallestLinePoints + reconsumoUsuario
        addLog(`   Nueva línea más pequeña: ${smallestLinePoints} + ${reconsumoUsuario} = ${nuevaLineaMasPequena}`)
        
        // ========================================
        // C) PML-R: Truncar cada pierna menor individualmente y luego sumar
        // ========================================
        // IMPORTANTE: Cada pierna menor se trunca individualmente al máximo permitido
        // Luego se suman todas las piernas truncadas
        let sumaLineasMenores = 0  // Para validación (sin truncar)
        let sumaLineasMenoresTruncadas = 0  // Para cálculo de puntos totales (truncadas)
        
        // Procesar todas las líneas excepto la mayor (índice 0)
        for (let i = 1; i < activeLinesArr.length; i++) {
          let valorLinea = activeLinesArr[i]
          
          // Si es la línea más pequeña, agregar el reconsumo
          if (i === smallestLineIndex) {
            valorLinea = nuevaLineaMasPequena
          }
          
          // Sumar sin truncar para validación
          sumaLineasMenores += valorLinea
          
          // Truncar cada pierna individualmente al máximo permitido
          const piernaTruncada = Math.min(valorLinea, rankLimitSimple.maximum_others_leg)
          sumaLineasMenoresTruncadas += piernaTruncada
          
          addLog(`   Pierna ${i}: ${valorLinea} puntos → truncada a ${piernaTruncada} puntos (máximo: ${rankLimitSimple.maximum_others_leg})`)
        }
        
        pmlr = sumaLineasMenores  // Sin truncar (para validación)
        pmlrTruncado = sumaLineasMenoresTruncadas  // Suma de piernas truncadas (para cálculo de puntos totales)
        
        addLog(`📊 Suma de líneas menores + reconsumo (sin truncar): ${sumaLineasMenores} puntos`)
        addLog(`📊 PML-R (suma de piernas truncadas): ${pmlrTruncado} puntos`)
        
      } else {
        addLog(`⚠️ No hay líneas activas`)
      }
      
      // ========================================
      // PASO 4: VALIDAR PML Y PML-R (solo se trunca si excede, no hay mínimo requerido)
      // ========================================
      // IMPORTANTE: maximum_large_leg y maximum_others_leg son MÁXIMOS permitidos:
      // - Si el valor es <= al máximo, cumple y se usa el valor real
      // - Si el valor excede el máximo, se trunca al máximo para calcular puntos totales
      addLog(`\n4️⃣ Validando PML y PML-R para el rango...`)
      addLog(`📊 Límites para ${rankLimitSimple.rank}:`)
      addLog(`   - PML máximo permitido: ${rankLimitSimple.maximum_large_leg}`)
      addLog(`   - PML-R máximo permitido por pierna: ${rankLimitSimple.maximum_others_leg}`)
      addLog(`   - Si exceden estos límites, se truncan para calcular puntos totales`)
      
      // PML: cualquier valor cumple, solo se trunca si excede el máximo
      // Ejemplo para PLATA (máximo 675):
      // - Si tiene 672: 672 <= 675 → cumple ✅, se usa 672 para puntos
      // - Si tiene 675: 675 <= 675 → cumple ✅, se usa 675 para puntos
      // - Si tiene 800: 800 > 675 → cumple ✅, se trunca a 675 para puntos
      addLog(`✅ PML: ${pml} puntos`)
      if (pml > rankLimitSimple.maximum_large_leg) {
        addLog(`   → Se truncará a ${rankLimitSimple.maximum_large_leg} para calcular puntos totales (excede el máximo)`)
      } else {
        addLog(`   → Se usará ${pml} para calcular puntos totales (dentro del límite)`)
      }
      
      // PML-R: cualquier valor cumple, cada pierna se trunca individualmente si excede
      // Ejemplo para PLATA (máximo 500 por pierna):
      // - Si suma 400: cumple ✅, cada pierna se trunca individualmente si excede 500
      // - Si suma 500: cumple ✅, cada pierna se trunca individualmente si excede 500
      // - Si suma 2000: cumple ✅, cada pierna se trunca a 500 máximo
      addLog(`✅ PML-R suma total: ${pmlr} puntos`)
      addLog(`   → Cada pierna se truncará individualmente a máximo ${rankLimitSimple.maximum_others_leg} si excede`)
      
      // ========================================
      // PASO 5: CALCULAR PUNTOS TOTALES (PML truncado + PML-R truncado)
      // ========================================
      addLog(`\n5️⃣ Calculando puntos totales (PML truncado + PML-R truncado)...`)
      
      // Los puntos totales son la suma de PML truncado + PML-R truncado
      const puntosTotalesCalculados = pmlTruncado + pmlrTruncado
      
      addLog(`📊 PML truncado: ${pmlTruncado} puntos`)
      addLog(`📊 PML-R truncado: ${pmlrTruncado} puntos`)
      addLog(`📊 Puntos totales calculados: ${pmlTruncado} + ${pmlrTruncado} = ${puntosTotalesCalculados}`)
      addLog(`📊 Puntos requeridos para ${rankLimitSimple.rank}: ${rankLimitSimple.threshold_points}`)
      
      // Validar usando los puntos totales calculados (PML truncado + PML-R truncado)
      if (puntosTotalesCalculados >= rankLimitSimple.threshold_points) {
        // ========================================
        // RESUMEN: TODOS LOS REQUISITOS CUMPLIDOS
        // ========================================
        addLog(`\n✅ RESUMEN DE VALIDACIÓN PARA ${rankLimitSimple.rank}:`)
        addLog(`   ✅ Reconsumo: ${node.reconsumo || 0} >= ${rankLimitSimple.reconsumo_required}`)
        addLog(`   ✅ Líneas Activas: ${activeLines} >= ${rankLimitSimple.minimum_frontals}`)
        addLog(`   ✅ PML (brazo mayor sin truncar): ${pml} >= ${rankLimitSimple.maximum_large_leg}`)
        addLog(`   ✅ PML-R (líneas menores + reconsumo sin truncar): ${pmlr} >= ${rankLimitSimple.maximum_others_leg}`)
        addLog(`   ✅ Puntos Totales (PML truncado + PML-R truncado): ${puntosTotalesCalculados} >= ${rankLimitSimple.threshold_points}`)
        addLog(`\n🎉 RANGO ASIGNADO: ${rankLimitSimple.rank}`)
        return rankLimitSimple.rank
      }
      
      addLog(`❌ No cumple puntos totales: ${puntosTotalesCalculados} < ${rankLimitSimple.threshold_points}`)
      addLog(`💡 El usuario necesita ${rankLimitSimple.threshold_points} puntos totales (PML truncado + PML-R truncado), pero solo tiene ${puntosTotalesCalculados}`)
      return null
    }

    // ========================================
    // EVALUAR RANGOS DE MAYOR A MENOR
    // ========================================
    addLog(`\n🔄 Evaluando rangos de mayor a menor...`)
    
    for (const rankLimitSimple of rankLimitsSimple) {
      let rankCalculated = valueRankLimits(rankLimitSimple)
      if (rankCalculated) {
        addLog(`\n🎉 RANGO FINAL ASIGNADO: ${rankCalculated}`)
        return rankCalculated
      }
    }

    // ========================================
    // RANGO POR DEFECTO PARA USUARIOS ACTIVADOS
    // ========================================
    addLog(`\n⚠️ No cumple requisitos para ningún rango específico`)
    addLog(`📌 Asignando rango por defecto: ACTIVO`)
    return 'ACTIVO'
}

/**
 * Completar de rellenar el resto de los rangos
 * @returns {void}
 */
const completeDependencyRanks = () => {
  const rankLimitsDependency = ranks.filter(
    (el) => el.type_calculation === 'rank_dependency'
  )
  for (const rankLimitDependency of rankLimitsDependency) {
    for (let node of tree)
      if (is_rank(node, rankLimitDependency))
        node.rank = rankLimitDependency.rank // Dependerán de: rankLimitDependency.rank_dependencies
  }
}

/**
 * Verifica si debajo del nodo se cumplen las condiciones para que pertenezca a un rango específico
 * @param {object}    node Nodo del arbol
 * @param {number[]}  node.total_arr Cantidad de puntos agrupados por hijos
 * @param {string[]}  node.childs Id de los nodos hijos
 * @param {string}    node.parentId
 * @param {string}    node.plan
 * @param {string}    node.dni
 * @param {string}    node.name
 * @param {boolean}   node.activated
 * @param {number}    node.points
 * @param {number}    node.affiliation_points
 * @param {Rank}      rank Objeto del rango con sus límites
 * @param {String}    rank.rank Nombre del rango
 * @returns {boolean}
 */
const is_rank = (node, rank) => {
  let total = 0
  const M = rank.threshold_points
  const M1 = rank.maximum_large_leg
  const M2 = rank.maximum_others_leg

  const n = node.childs.length

  const arr = node.total_arr

  // Suma los puntos grupales de acuerdo a las limitaciones de las piernas del nodo
  for (const [i, a] of arr.entries()) {
    if (i == 0) total += Math.min(arr[i], M1)
    if (i >= 1) total += Math.min(arr[i], M2)
  }

  /**
   * @param {String} rank_name
   * @returns {String}
   */
  const build_attr_rank_name = (rank_name) => {
    return `_${rank_name
      .replace(/ /g, '_')
      .replace(/\-/g, '')
      .replace('__', '_')}`
  }

  // Crea un objeto con contadores temporales para saber cuantos hijos con tales rangos fueron encontrados
  let countChildRank = {}
  /**
  const countChildRank = {
    _ACTIVO: 0,
    _BRONCE: 0,
    _PLATA: 0,
    _ORO: 0,
    _ZAFIRO: 0,
    _DIAMANTE: 0,
    _EMBAJADOR_ESTRELLA: 0,
    _EMBAJADOR_ELITE: 0,
  }
 */
  for (const temp_rank of ranks) {
    const attr_rank_name = build_attr_rank_name(temp_rank.rank)
    countChildRank[attr_rank_name] = 0
  }

  const rankLimitsDependency = ranks.filter(
    (el) => el.type_calculation === 'rank_dependency'
  )

  // Suma los contadores segun los rangos encontrados de los hijos del nodo
  for (const _id of node.childs) {
    for (const rank of ranks) {
      if (find_rank(_id, rank)) {
        const attr_rank_name = build_attr_rank_name(rank.rank)
        countChildRank[attr_rank_name] += 1
      }
    }
  }

  // Verifica si el nodo cumple con las otras limitaciiones de dependencia segun el rango en el que se encuentre
  for (const rankLimitDependency of ranks) {
    const attr_rank_name = build_attr_rank_name(rankLimitDependency.rank)
    const more_than_dependencies = rankLimitDependency.rank_dependencies.every(
      (el) => {
        if (el.diff_branch === false) {
          return countChildRank[attr_rank_name] >= el.minimum
        }
      }
    )

    if (total >= M && n >= 3 && more_than_dependencies) {
      return true
    }
  }

  return false
}

/**
 * Verifica si debajo del nodo existe el rango especificado o uno superior
 * @param {string}    id Id del nodo
 * @param {Rank}      rank Objeto del rango con sus límites
 * @param {string}    rank.rank Nombre del rango
 * @returns {boolean}
 */
function find_rank(id, rank) {
  const node = tree.find((e) => e.id == id)

  const i = ranks.find((el) => el.rank === node.rank).pos
  const j = rank.pos

  if (i >= j) return true

  for (let _id of node.childs) {
    if (find_rank(_id, rank)) return true
  }

  return false
}

// update on DB
async function updateDB() {
  console.log('updateDB ...')

  // create closed
  await Closed.insert({
    id: rand(),
    date: new Date(),
    tree,
    // TODO: de prueba
    activations: [],
    affiliations: [],
    aff_transactions: [],
  })
  // db.closeds.deleteMany({})

  // pay residuals
  for (let node of tree) {
    if (node.residual_bonus) {
      await Transaction.insert({
        id: rand(),
        date: new Date(),
        user_id: node.id,
        type: 'in',
        value: node.residual_bonus,
        name: 'residual',
      })
    }
  }

  // bono excedente
  for (let node of tree) {
    if (node.excedent_bonus) {
      await Transaction.insert({
        id: rand(),
        date: new Date(),
        user_id: node.id,
        type: 'in',
        value: node.excedent_bonus,
        name: 'excedent bonus',
      })
    }
  }

  // bono alcance rango
  for (let node of tree) {
    if (node._pays) {
      for (let _pay of node._pays) {
        await Transaction.insert({
          id: rand(),
          date: new Date(),
          user_id: node.id,
          type: 'in',
          value: _pay.value,
          desc: _pay.name,
          name: 'rank bonus',
        })
      }

      await User.updateOne(
        { id: node.id },
        {
          pays: node.pays,
        }
      )
    }
  }

  // reset users
  await User.updateMany({},
    {
      _activated: false,
      activated: false,
      rank: 'none',
      points: 0,
      affiliation_points: 0,
      closed: true,
    }
  )

  // update users
  for (let node of tree) {
    if (node.rank != 'none') {

      await User.updateOne(
        { id: node.id },
        {
          rank: node.rank,
        }
      )
    }
  }
}

main()
