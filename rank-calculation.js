/**
 * MÓDULO DE CÁLCULO DE RANGOS MLM
 * 
 * Este módulo contiene toda la lógica para calcular los rangos de usuarios
 * según sus requisitos: puntos totales, líneas activas, reconsumo, PML y PML-R
 */

// ========================================
// CONFIGURACIÓN DE RANGOS
// ========================================

/**
 * Configuración de pagos por rango
 */
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

/**
 * Configuración de requisitos por rango
 * Ordenados de mayor a menor (descendente)
 */
const ranks = [
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

// Agregar rangos adicionales
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

// ========================================
// FUNCIONES DE VALIDACIÓN
// ========================================

/**
 * Verifica si un usuario cumple con el reconsumo requerido
 * @param {Tree} node Nodo del usuario
 * @param {number} reconsumo_required Reconsumo mínimo requerido
 * @returns {boolean}
 */
const checkReconsumo = (node, reconsumo_required) => {
  const userReconsumo = node.reconsumo || 0
  return userReconsumo >= reconsumo_required
}

/**
 * Obtiene los datos de las líneas activas (usuarios directos activos)
 * @param {Tree} node Nodo del usuario
 * @param {User[]} users Array de usuarios de la base de datos
 * @returns {Array} Array de objetos con datos de líneas activas
 */
const getActiveLinesData = (node, users) => {
  const activeLinesData = []
  
  // Usar el campo childs del árbol para identificar afiliados directos
  if (node.childs && node.childs.length > 0) {
    // Buscar los usuarios correspondientes a los IDs en childs
    const directUsers = users.filter(u => node.childs.includes(u.id))
    
    for (let directUser of directUsers) {
      // Solo considerar usuarios activos (activated=true)
      const isActiveUser = directUser.activated
      
      if (isActiveUser) {
        activeLinesData.push({
          userId: directUser.id,
          name: directUser.name,
          points: directUser.total_points || 0
        })
      }
    }
  }
  
  return activeLinesData
}

/**
 * Verifica si las líneas directas están activas
 * @param {Tree} node Nodo del usuario
 * @param {User[]} users Array de usuarios de la base de datos
 * @param {Function} addLog Función para agregar logs
 * @returns {number} Número de líneas activas
 */
const getActiveLines = (node, users, addLog) => {
  let activeLines = 0
  
  // Usar el campo childs del árbol para identificar afiliados directos
  if (node.childs && node.childs.length > 0) {
    // Buscar los usuarios correspondientes a los IDs en childs
    const directUsers = users.filter(u => node.childs.includes(u.id))
    
    if (addLog) {
      addLog(`DEBUG - Usuario ${node.name} tiene ${node.childs.length} hijos en childs: ${JSON.stringify(node.childs)}`)
      addLog(`DEBUG - Encontrados ${directUsers.length} usuarios directos`)
    }
    
    for (let directUser of directUsers) {
      // Solo considerar usuarios activos (activated=true)
      const isActiveUser = directUser.activated
      
      if (addLog) {
        addLog(`DEBUG - Usuario directo ${directUser.name}: activated=${directUser.activated}`)
      }
      
      if (isActiveUser) {
        activeLines++
        if (addLog) {
          addLog(`DEBUG - LÍNEA ACTIVA: ${directUser.name} (usuario activo)`)
        }
      } else {
        if (addLog) {
          addLog(`DEBUG - Usuario NO activo: ${directUser.name}`)
        }
      }
    }
  } else {
    if (addLog) {
      addLog(`DEBUG - Usuario ${node.name} no tiene hijos`)
    }
  }
  
  if (addLog) {
    addLog(`DEBUG - Total líneas activas para ${node.name}: ${activeLines}`)
  }
  return activeLines
}

// ========================================
// FUNCIÓN PRINCIPAL DE CÁLCULO DE RANGOS
// ========================================

/**
 * CALCULA EL RANGO DE UN USUARIO SEGÚN SUS REQUISITOS
 * 
 * Esta función evalúa si un usuario cumple con los requisitos para cada rango,
 * desde el más alto (EMBAJADOR SIFRAH) hasta el más bajo (ACTIVO).
 * 
 * REQUISITOS PARA CADA RANGO:
 * - Reconsumo (RP): Puntos personales del usuario (campo points)
 * - Líneas Activas (LA): Número de afiliados directos con activated=true
 * - PML: Brazo mayor debe llegar al maximum_large_leg requerido
 * - PML-R: Suma de líneas menores + reconsumo debe llegar al maximum_others_leg requerido
 * - Puntos Totales (PT): Campo total_points del usuario debe llegar al threshold_points requerido
 * 
 * @param {Tree} node - Nodo del usuario a evaluar
 * @param {User[]} users - Array de usuarios de la base de datos
 * @param {Function} addLog - Función para agregar logs (opcional)
 * @returns {string} Rango asignado ('none', 'ACTIVO', 'BRONCE', 'PLATA', etc.)
 */
const calc_rank = (node, users, addLog = null) => {
  if (addLog) {
    addLog(`\n🔍 EVALUANDO RANGO PARA: ${node.name}`)
    addLog(`📊 Datos del usuario:`)
    addLog(`   - Puntos totales: ${node.total_points}`)
    addLog(`   - Reconsumo: ${node.reconsumo}`)
    addLog(`   - Líneas activas: ${getActiveLines(node, users, addLog)}`)
  }
  
  // ========================================
  // VALIDACIÓN BÁSICA: USUARIO DEBE ESTAR ACTIVADO
  // ========================================
  if (!node.activated) {
    if (addLog) {
      addLog(`❌ Usuario no activado, rango: none`)
    }
    return 'none'
  }
  
  if (addLog) {
    addLog(`✅ Usuario activado, evaluando rangos...`)
  }
  
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
      if (addLog) {
        addLog(`\n🎯 EVALUANDO RANGO: ${rankLimitSimple.rank}`)
        addLog(`📋 Requisitos:`)
        addLog(`   - Puntos Totales: ${rankLimitSimple.threshold_points}`)
        addLog(`   - Líneas Activas: ${rankLimitSimple.minimum_frontals}`)
        addLog(`   - Reconsumo: ${rankLimitSimple.reconsumo_required}`)
      }
      
      // ========================================
      // PASO 1: VERIFICAR RECONSUMO DEL USUARIO
      // ========================================
      if (addLog) {
        addLog(`\n1️⃣ Verificando reconsumo...`)
      }
      if (!checkReconsumo(node, rankLimitSimple.reconsumo_required)) {
        if (addLog) {
          addLog(`❌ No cumple reconsumo: ${node.reconsumo || 0} < ${rankLimitSimple.reconsumo_required}`)
        }
        return null
      }
      if (addLog) {
        addLog(`✅ Cumple reconsumo: ${node.reconsumo || 0} >= ${rankLimitSimple.reconsumo_required}`)
      }

      // ========================================
      // PASO 2: VERIFICAR LÍNEAS ACTIVAS
      // ========================================
      if (addLog) {
        addLog(`\n2️⃣ Verificando líneas activas...`)
        addLog(`📋 Requisito: ${rankLimitSimple.minimum_frontals} líneas activas`)
      }
      
      const activeLines = getActiveLines(node, users, addLog)
      
      if (addLog) {
        addLog(`📊 Líneas activas encontradas: ${activeLines}`)
      }
      
      if (activeLines < rankLimitSimple.minimum_frontals) {
        if (addLog) {
          addLog(`❌ No cumple líneas activas: ${activeLines} < ${rankLimitSimple.minimum_frontals}`)
          addLog(`💡 El usuario necesita ${rankLimitSimple.minimum_frontals} líneas activas, pero solo tiene ${activeLines}`)
        }
        return null
      }
      if (addLog) {
        addLog(`✅ Cumple líneas activas: ${activeLines} >= ${rankLimitSimple.minimum_frontals}`)
      }

      // ========================================
      // PASO 3: CALCULAR PML Y PML-R
      // ========================================
      if (addLog) {
        addLog(`\n3️⃣ Calculando PML y PML-R...`)
      }
      
      // Obtener solo las líneas activas (usuarios directos activos)
      const activeLinesData = getActiveLinesData(node, users)
      const activeLinesArr = activeLinesData.map(line => line.points).sort((a, b) => b - a)
      
      if (addLog) {
        addLog(`📊 Líneas activas encontradas: ${JSON.stringify(activeLinesArr)}`)
        addLog(`📋 Límites para ${rankLimitSimple.rank}:`)
        addLog(`   - PML (brazo mayor): debe llegar a ${rankLimitSimple.maximum_large_leg}`)
        addLog(`   - PML-R (líneas menores + reconsumo): debe llegar a ${rankLimitSimple.maximum_others_leg}`)
      }
      
      let pml = 0
      let pmlr = 0
      
      if (activeLinesArr.length > 0) {
        // ========================================
        // A) PML: Brazo con el puntaje más grande
        // ========================================
        const brazoMayor = activeLinesArr[0]  // La línea mayor (ya está ordenada)
        pml = brazoMayor
        
        if (addLog) {
          addLog(`\n📊 PML (Brazo mayor): ${brazoMayor} puntos`)
        }
        
        // ========================================
        // B) SUMAR RECONSUMO DEL USUARIO AL BRAZO MÁS PEQUEÑO
        // ========================================
        const reconsumoUsuario = node.points || 0  // Reconsumo = puntos personales
        const smallestLineIndex = activeLinesArr.length - 1
        const smallestLinePoints = activeLinesArr[smallestLineIndex]
        
        if (addLog) {
          addLog(`💰 Agregando reconsumo del usuario (${reconsumoUsuario}) al brazo más pequeño (${smallestLinePoints})...`)
        }
        
        const nuevaLineaMasPequena = smallestLinePoints + reconsumoUsuario
        
        if (addLog) {
          addLog(`   Nueva línea más pequeña: ${smallestLinePoints} + ${reconsumoUsuario} = ${nuevaLineaMasPequena}`)
        }
        
        // ========================================
        // C) PML-R: Suma de todas las líneas con menos puntaje + reconsumo
        // ========================================
        let sumaLineasMenores = 0
        
        // Sumar todas las líneas excepto la mayor (índice 0)
        for (let i = 1; i < activeLinesArr.length; i++) {
          if (i === smallestLineIndex) {
            // Esta es la línea más pequeña, usar la nueva con reconsumo
            sumaLineasMenores += nuevaLineaMasPequena
          } else {
            // Otras líneas menores (no la mayor)
            sumaLineasMenores += activeLinesArr[i]
          }
        }
        
        pmlr = sumaLineasMenores
        
        if (addLog) {
          addLog(`📊 Suma de líneas menores + reconsumo: ${sumaLineasMenores} puntos`)
          addLog(`📋 Valores para validación:`)
          addLog(`   - PML (brazo mayor): ${pml} puntos`)
          addLog(`   - PML-R (líneas menores + reconsumo): ${pmlr} puntos`)
        }
        
      } else {
        if (addLog) {
          addLog(`⚠️ No hay líneas activas`)
        }
      }
      
      // ========================================
      // PASO 4: VALIDAR PML Y PML-R POR SEPARADO
      // ========================================
      if (addLog) {
        addLog(`\n4️⃣ Validando requisitos PML y PML-R para el rango...`)
        addLog(`📊 Requisitos para ${rankLimitSimple.rank}:`)
        addLog(`   - PML debe ser >= ${rankLimitSimple.maximum_large_leg}`)
        addLog(`   - PML-R debe ser >= ${rankLimitSimple.maximum_others_leg}`)
      }
      
      // Validar PML (brazo mayor debe llegar al máximo requerido)
      if (pml < rankLimitSimple.maximum_large_leg) {
        if (addLog) {
          addLog(`❌ No cumple requisito PML: ${pml} < ${rankLimitSimple.maximum_large_leg}`)
          addLog(`💡 El brazo mayor necesita llegar a ${rankLimitSimple.maximum_large_leg} puntos, pero solo tiene ${pml}`)
        }
        return null
      }
      if (addLog) {
        addLog(`✅ Cumple requisito PML: ${pml} >= ${rankLimitSimple.maximum_large_leg}`)
      }
      
      // Validar PML-R (líneas menores + reconsumo deben llegar al máximo requerido)
      if (pmlr < rankLimitSimple.maximum_others_leg) {
        if (addLog) {
          addLog(`❌ No cumple requisito PML-R: ${pmlr} < ${rankLimitSimple.maximum_others_leg}`)
          addLog(`💡 Las líneas menores + reconsumo necesitan llegar a ${rankLimitSimple.maximum_others_leg} puntos, pero solo tienen ${pmlr}`)
        }
        return null
      }
      if (addLog) {
        addLog(`✅ Cumple requisito PML-R: ${pmlr} >= ${rankLimitSimple.maximum_others_leg}`)
      }
      
      // ========================================
      // PASO 5: VALIDAR PUNTOS TOTALES (campo total_points de la DB)
      // ========================================
      if (addLog) {
        addLog(`\n5️⃣ Verificando puntos totales (campo total_points de la DB)...`)
      }
      const userTotalPoints = node.total_points || 0
      
      if (addLog) {
        addLog(`📊 Puntos totales del usuario (total_points): ${userTotalPoints}`)
        addLog(`📊 Puntos requeridos para ${rankLimitSimple.rank}: ${rankLimitSimple.threshold_points}`)
      }
      
      // Validar usando el campo total_points directamente
      if (userTotalPoints >= rankLimitSimple.threshold_points) {
        // ========================================
        // RESUMEN: TODOS LOS REQUISITOS CUMPLIDOS
        // ========================================
        if (addLog) {
          addLog(`\n✅ RESUMEN DE VALIDACIÓN PARA ${rankLimitSimple.rank}:`)
          addLog(`   ✅ Reconsumo: ${node.reconsumo || 0} >= ${rankLimitSimple.reconsumo_required}`)
          addLog(`   ✅ Líneas Activas: ${activeLines} >= ${rankLimitSimple.minimum_frontals}`)
          addLog(`   ✅ PML (brazo mayor): ${pml} >= ${rankLimitSimple.maximum_large_leg}`)
          addLog(`   ✅ PML-R (líneas menores + reconsumo): ${pmlr} >= ${rankLimitSimple.maximum_others_leg}`)
          addLog(`   ✅ Puntos Totales (total_points): ${userTotalPoints} >= ${rankLimitSimple.threshold_points}`)
          addLog(`\n🎉 RANGO ASIGNADO: ${rankLimitSimple.rank}`)
        }
        return rankLimitSimple.rank
      }
      
      if (addLog) {
        addLog(`❌ No cumple puntos totales: ${userTotalPoints} < ${rankLimitSimple.threshold_points}`)
        addLog(`💡 El usuario necesita ${rankLimitSimple.threshold_points} puntos totales, pero solo tiene ${userTotalPoints}`)
      }
      return null
    }

    // ========================================
    // EVALUAR RANGOS DE MAYOR A MENOR
    // ========================================
    if (addLog) {
      addLog(`\n🔄 Evaluando rangos de mayor a menor...`)
    }
    
    for (const rankLimitSimple of rankLimitsSimple) {
      let rankCalculated = valueRankLimits(rankLimitSimple)
      if (rankCalculated) {
        if (addLog) {
          addLog(`\n🎉 RANGO FINAL ASIGNADO: ${rankCalculated}`)
        }
        return rankCalculated
      }
    }

    // ========================================
    // RANGO POR DEFECTO PARA USUARIOS ACTIVADOS
    // ========================================
    if (addLog) {
      addLog(`\n⚠️ No cumple requisitos para ningún rango específico`)
      addLog(`📌 Asignando rango por defecto: ACTIVO`)
    }
    return 'ACTIVO'
}

/**
 * ASIGNA RANGOS INICIALES A TODOS LOS USUARIOS
 * 
 * Esta función recorre todos los nodos del árbol y asigna el rango correspondiente
 * según los requisitos de puntos totales, líneas activas y reconsumo.
 * 
 * Solo los usuarios con activated=true pueden tener rangos superiores a 'none'.
 * 
 * @param {Tree[]} tree - Array de nodos del árbol
 * @param {User[]} users - Array de usuarios de la base de datos
 * @param {Function} addLog - Función para agregar logs (opcional)
 * @returns {void}
 */
const initialRanks = (tree, users, addLog = null) => {
  if (addLog) {
    console.log('🏆 Asignando rangos iniciales...')
  }
  let usersWithRanks = 0
  
  for (let node of tree) {
    if (node.activated) {
      // Usuario activado: calcular rango según requisitos
      node.rank = calc_rank(node, users, addLog)
      usersWithRanks++
      if (addLog) {
        addLog(`✅ Usuario ${node.name} asignado rango: ${node.rank}`)
      }
    } else {
      // Usuario no activado: rango 'none'
      node.rank = 'none'
      if (addLog) {
        addLog(`❌ Usuario ${node.name} no activado, rango: none`)
      }
    }
  }
  
  if (addLog) {
    console.log(`✅ Rangos asignados: ${usersWithRanks} usuarios activos de ${tree.length} total`)
  }
}

/**
 * Verifica si debajo del nodo existe el rango especificado o uno superior
 * @param {string} id - Id del nodo
 * @param {Object} rank - Objeto del rango con sus límites
 * @param {Tree[]} tree - Array de nodos del árbol
 * @returns {boolean}
 */
const find_rank = (id, rank, tree) => {
  const node = tree.find((e) => e.id == id)

  const i = ranks.find((el) => el.rank === node.rank).pos
  const j = rank.pos

  if (i >= j) return true

  for (let _id of node.childs) {
    if (find_rank(_id, rank, tree)) return true
  }

  return false
}

/**
 * Verifica si debajo del nodo se cumplen las condiciones para que pertenezca a un rango específico
 * @param {Tree} node - Nodo del árbol
 * @param {Object} rank - Objeto del rango con sus límites
 * @param {Tree[]} tree - Array de nodos del árbol
 * @returns {boolean}
 */
const is_rank = (node, rank, tree) => {
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

  const build_attr_rank_name = (rank_name) => {
    return `_${rank_name
      .replace(/ /g, '_')
      .replace(/\-/g, '')
      .replace('__', '_')}`
  }

  // Crea un objeto con contadores temporales para saber cuantos hijos con tales rangos fueron encontrados
  let countChildRank = {}
  for (const temp_rank of ranks) {
    const attr_rank_name = build_attr_rank_name(temp_rank.rank)
    countChildRank[attr_rank_name] = 0
  }

  const rankLimitsDependency = ranks.filter(
    (el) => el.type_calculation === 'rank_dependency'
  )

  // Suma los contadores segun los rangos encontrados de los hijos del nodo
  for (const _id of node.childs) {
    for (const rankItem of ranks) {
      if (find_rank(_id, rankItem, tree)) {
        const attr_rank_name = build_attr_rank_name(rankItem.rank)
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
 * Completa rangos con dependencias (para rangos especiales)
 * @param {Tree[]} tree - Array de nodos del árbol
 * @returns {void}
 */
const completeDependencyRanks = (tree) => {
  const rankLimitsDependency = ranks.filter(
    (el) => el.type_calculation === 'rank_dependency'
  )
  for (const rankLimitDependency of rankLimitsDependency) {
    for (let node of tree)
      if (is_rank(node, rankLimitDependency, tree))
        node.rank = rankLimitDependency.rank
  }
}


// ========================================
// EXPORTS
// ========================================

module.exports = {
  ranks,
  pays,
  calc_rank,
  initialRanks,
  completeDependencyRanks,
  getActiveLines,
  getActiveLinesData,
  checkReconsumo,
}

