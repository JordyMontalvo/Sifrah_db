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
 * Obtiene los datos de las líneas activas (usuarios directos con total_points !== 0)
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
      // Se considera línea activa si total_points es diferente de cero
      const userTotalPoints = directUser.total_points || 0
      const isActiveLine = userTotalPoints !== 0
      
      if (addLog) {
        addLog(`DEBUG - Usuario directo ${directUser.name}: total_points=${userTotalPoints}`)
      }
      
      if (isActiveLine) {
        activeLines++
        if (addLog) {
          addLog(`DEBUG - LÍNEA ACTIVA: ${directUser.name} (total_points=${userTotalPoints} !== 0)`)
        }
      } else {
        if (addLog) {
          addLog(`DEBUG - LÍNEA NO ACTIVA: ${directUser.name} (total_points=${userTotalPoints} === 0)`)
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
      // PASO 3: CALCULAR PML Y PML-R (SIN TRUNCAR)
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
        
        if (addLog) {
          addLog(`\n📊 PML (Brazo mayor): ${brazoMayor} puntos`)
          addLog(`📊 PML truncado al límite del rango: ${pmlTruncado} puntos (máximo: ${rankLimitSimple.maximum_large_leg})`)
        }
        
        // ========================================
        // B) SUMAR RECONSUMO DEL USUARIO AL BRAZO MÁS PEQUEÑO
        // ========================================
        const reconsumoUsuario = node.points || 0  // Para PML-R solo suman los puntos reales de productos (node.points), no afiliación
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
          
          if (addLog) {
            addLog(`   Pierna ${i}: ${valorLinea} puntos → truncada a ${piernaTruncada} puntos (máximo: ${rankLimitSimple.maximum_others_leg})`)
          }
        }
        
        pmlr = sumaLineasMenores  // Sin truncar (para validación)
        pmlrTruncado = sumaLineasMenoresTruncadas  // Suma de piernas truncadas (para cálculo de puntos totales)
        
        if (addLog) {
          addLog(`📊 Suma de líneas menores + reconsumo (sin truncar): ${sumaLineasMenores} puntos`)
          addLog(`📊 PML-R (suma de piernas truncadas): ${pmlrTruncado} puntos`)
        }
        
      } else {
        if (addLog) {
          addLog(`⚠️ No hay líneas activas`)
        }
      }
      
      // ========================================
      // PASO 4: VALIDAR PML Y PML-R (solo se trunca si excede, no hay mínimo requerido)
      // ========================================
      // IMPORTANTE: maximum_large_leg y maximum_others_leg son MÁXIMOS permitidos:
      // - Si el valor es <= al máximo, cumple y se usa el valor real
      // - Si el valor excede el máximo, se trunca al máximo para calcular puntos totales
      if (addLog) {
        addLog(`\n4️⃣ Validando PML y PML-R para el rango...`)
        addLog(`📊 Límites para ${rankLimitSimple.rank}:`)
        addLog(`   - PML máximo permitido: ${rankLimitSimple.maximum_large_leg}`)
        addLog(`   - PML-R máximo permitido por pierna: ${rankLimitSimple.maximum_others_leg}`)
        addLog(`   - Si exceden estos límites, se truncan para calcular puntos totales`)
      }
      
      // PML: cualquier valor cumple, solo se trunca si excede el máximo
      // Ejemplo para PLATA (máximo 675):
      // - Si tiene 672: 672 <= 675 → cumple ✅, se usa 672 para puntos
      // - Si tiene 675: 675 <= 675 → cumple ✅, se usa 675 para puntos
      // - Si tiene 800: 800 > 675 → cumple ✅, se trunca a 675 para puntos
      if (addLog) {
        addLog(`✅ PML: ${pml} puntos`)
        if (pml > rankLimitSimple.maximum_large_leg) {
          addLog(`   → Se truncará a ${rankLimitSimple.maximum_large_leg} para calcular puntos totales (excede el máximo)`)
        } else {
          addLog(`   → Se usará ${pml} para calcular puntos totales (dentro del límite)`)
        }
      }
      
      // PML-R: cualquier valor cumple, cada pierna se trunca individualmente si excede
      // Ejemplo para PLATA (máximo 500 por pierna):
      // - Si suma 400: cumple ✅, cada pierna se trunca individualmente si excede 500
      // - Si suma 500: cumple ✅, cada pierna se trunca individualmente si excede 500
      // - Si suma 2000: cumple ✅, cada pierna se trunca a 500 máximo
      if (addLog) {
        addLog(`✅ PML-R suma total: ${pmlr} puntos`)
        addLog(`   → Cada pierna se truncará individualmente a máximo ${rankLimitSimple.maximum_others_leg} si excede`)
      }
      
      // ========================================
      // PASO 5: CALCULAR PUNTOS TOTALES (PML truncado + PML-R truncado)
      // ========================================
      if (addLog) {
        addLog(`\n5️⃣ Calculando puntos totales (PML truncado + PML-R truncado)...`)
      }
      
      // Los puntos totales son la suma de PML truncado + PML-R truncado
      const puntosTotalesCalculados = pmlTruncado + pmlrTruncado
      
      if (addLog) {
        addLog(`📊 PML truncado: ${pmlTruncado} puntos`)
        addLog(`📊 PML-R truncado: ${pmlrTruncado} puntos`)
        addLog(`📊 Puntos totales calculados: ${pmlTruncado} + ${pmlrTruncado} = ${puntosTotalesCalculados}`)
        addLog(`📊 Puntos requeridos para ${rankLimitSimple.rank}: ${rankLimitSimple.threshold_points}`)
      }
      
      // Validar usando los puntos totales calculados (PML truncado + PML-R truncado)
      if (puntosTotalesCalculados >= rankLimitSimple.threshold_points) {
        // ========================================
        // RESUMEN: TODOS LOS REQUISITOS CUMPLIDOS
        // ========================================
        if (addLog) {
          addLog(`\n✅ RESUMEN DE VALIDACIÓN PARA ${rankLimitSimple.rank}:`)
          addLog(`   ✅ Reconsumo: ${node.reconsumo || 0} >= ${rankLimitSimple.reconsumo_required}`)
          addLog(`   ✅ Líneas Activas: ${activeLines} >= ${rankLimitSimple.minimum_frontals}`)
          addLog(`   ✅ PML (brazo mayor sin truncar): ${pml} >= ${rankLimitSimple.maximum_large_leg}`)
          addLog(`   ✅ PML-R (líneas menores + reconsumo sin truncar): ${pmlr} >= ${rankLimitSimple.maximum_others_leg}`)
          addLog(`   ✅ Puntos Totales (PML truncado + PML-R truncado): ${puntosTotalesCalculados} >= ${rankLimitSimple.threshold_points}`)
          addLog(`\n🎉 RANGO ASIGNADO: ${rankLimitSimple.rank}`)
        }
        return rankLimitSimple.rank
      }
      
      if (addLog) {
        addLog(`❌ No cumple puntos totales: ${puntosTotalesCalculados} < ${rankLimitSimple.threshold_points}`)
        addLog(`💡 El usuario necesita ${rankLimitSimple.threshold_points} puntos totales (PML truncado + PML-R truncado), pero solo tiene ${puntosTotalesCalculados}`)
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

