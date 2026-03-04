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
  // PASO 3: CALCULAR PUNTOS TOTALES ACUMULADOS POR PIERNA (RAW)
  // ========================================
  console.log('💰 Calculando puntos totales reales por pierna...')
  
  for (let node of tree) {
    // Calculamos el total de puntos de toda su organización (sin truncar aún)
    node.total_points_raw = total_points(node.id)
    node.total_arr = []

    if (node.childs && node.childs.length > 0) {
      for (let childId of node.childs) {
        // Obtenemos los puntos totales acumulados de cada hijo directo
        const childTotal = total_points(childId)
        if (childTotal > 0) {
          node.total_arr.push(childTotal)
        }
      }
      // Ordenar de mayor a menor para facilitar los cálculos de VMP más adelante
      node.total_arr.sort((a, b) => b - a)
    }
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
  {
    pos: 10,
    rank: 'EMBAJADOR SIFRAH',
    type_calculation: 'simple',
    minimum_frontals: 6,
    threshold_points: 600000,
    maximum_large_leg: 100000,
    maximum_others_leg: 100000,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 9,
    rank: 'DIAMANTE IMPERIAL',
    type_calculation: 'simple',
    minimum_frontals: 6,
    threshold_points: 300000,
    maximum_large_leg: 55000,
    maximum_others_leg: 55000,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 8,
    rank: 'TRIPLE DIAMANTE',
    type_calculation: 'simple',
    minimum_frontals: 5,
    threshold_points: 170000,
    maximum_large_leg: 37500,
    maximum_others_leg: 37500,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 7,
    rank: 'DOBLE DIAMANTE',
    type_calculation: 'simple',
    minimum_frontals: 5,
    threshold_points: 85000,
    maximum_large_leg: 19000,
    maximum_others_leg: 19000,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 6,
    rank: 'DIAMANTE',
    type_calculation: 'simple',
    minimum_frontals: 4,
    threshold_points: 45000,
    maximum_large_leg: 12000,
    maximum_others_leg: 12000,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 5,
    rank: 'ESMERALDA',
    type_calculation: 'simple',
    minimum_frontals: 4,
    threshold_points: 20000,
    maximum_large_leg: 5500,
    maximum_others_leg: 5500,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 4,
    rank: 'RUBÍ',
    type_calculation: 'simple',
    minimum_frontals: 4,
    threshold_points: 7500,
    maximum_large_leg: 2100,
    maximum_others_leg: 2100,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 3,
    rank: 'ORO',
    type_calculation: 'simple',
    minimum_frontals: 3,
    threshold_points: 3500,
    maximum_large_leg: 1350,
    maximum_others_leg: 1350,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 2,
    rank: 'PLATA',
    type_calculation: 'simple',
    minimum_frontals: 3,
    threshold_points: 1500,
    maximum_large_leg: 600,
    maximum_others_leg: 600,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
  {
    pos: 1,
    rank: 'BRONCE',
    type_calculation: 'simple',
    minimum_frontals: 2,
    threshold_points: 500,
    maximum_large_leg: 300,
    maximum_others_leg: 300,
    reconsumo_required: 160,
    rank_dependencies: [],
  },
]
ranks.push({
  pos: 0,
  rank: 'ACTIVO',
  type_calculation: 'simple',
  minimum_frontals: 0,
  threshold_points: 1,
  maximum_large_leg: 0,
  maximum_others_leg: 0,
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
  
  if (!node.activated) {
    addLog(`❌ Usuario no activado, rango: none`)
    return 'none'
  }
  
  const activeLinesArr = [...node.total_arr]
  const rankLimitsSimple = ranks.filter((el) => el.type_calculation === 'simple')

  const valueRankLimits = (rankLimitSimple) => {
      addLog(`\n🎯 EVALUANDO RANGO: ${rankLimitSimple.rank}`)
      
      // 1. Reconsumo
      if (!checkReconsumo(node, rankLimitSimple.reconsumo_required)) {
        addLog(`❌ No cumple reconsumo: ${node.reconsumo || 0} < ${rankLimitSimple.reconsumo_required}`)
        return null
      }

      // 2. Líneas Activas
      const activeLines = getActiveLines(node)
      if (activeLines < rankLimitSimple.minimum_frontals) {
        addLog(`❌ No cumple líneas activas: ${activeLines} < ${rankLimitSimple.minimum_frontals}`)
        return null
      }

      // 3. Truncamiento VMP y Suma de Puntos
      const vmp = rankLimitSimple.maximum_large_leg || 0
      let calcActiveLines = [...activeLinesArr]
      const puntosPersonales = (node.points || 0) + (node.affiliation_points || 0)
      
      if (calcActiveLines.length > 0) {
        calcActiveLines[calcActiveLines.length - 1] += puntosPersonales
      }

      let totalPointsCalculated = 0
      for (let i = 0; i < calcActiveLines.length; i++) {
        totalPointsCalculated += (vmp > 0) ? Math.min(calcActiveLines[i], vmp) : calcActiveLines[i]
      }
      
      if (calcActiveLines.length === 0) {
        totalPointsCalculated = (vmp > 0) ? Math.min(puntosPersonales, vmp) : puntosPersonales
      }

      // 4. Validación Final
      if (totalPointsCalculated >= rankLimitSimple.threshold_points) {
        addLog(`✅ RANGO ASIGNADO: ${rankLimitSimple.rank} (${totalPointsCalculated} puntos)`)
        // Actualizamos total_points con el valor calificado para este rango para que se guarde en DB
        node.total_points = totalPointsCalculated 
        return rankLimitSimple.rank
      }
      
      return null
  }

  for (const rankLimitSimple of rankLimitsSimple) {
    let rankCalculated = valueRankLimits(rankLimitSimple)
    if (rankCalculated) return rankCalculated
  }

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
