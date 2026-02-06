/**
 * CÁLCULO DEL BONO RESIDUAL UNILEVEL - CRMS
 * 
 * Este script implementa la nueva lógica del bono residual según especificaciones:
 * - Se paga solo sobre puntos de reconsumo (PR), no sobre puntos de afiliación
 * - Porcentajes fijos por nivel (iguales para todos los rangos)
 * - Profundidad máxima según rango
 * - Tope de 160 puntos (100% hasta 160, 60% del porcentaje para exceso)
 * - Compresión dinámica en el CÁLCULO: omite nodos con PR=0
 * - Logs muestran TODOS los nodos con su nivel real (sin compresión)
 */

const db = require('./db')
const { User, Tree, Transaction } = db

// Función para generar ID aleatorio
function rand() { return Math.random().toString(36).substr(2) }

// ========================================
// CONFIGURACIÓN
// ========================================

/**
 * Tabla de porcentajes del bono residual por nivel
 * Estos porcentajes son iguales para todos los rangos
 */
const RESIDUAL_PERCENTAGES = [
  0.1563,  // Nivel 1: 15.63%
  0.1563,  // Nivel 2: 15.63%
  0.1875,  // Nivel 3: 18.75%
  0.0938,  // Nivel 4: 9.38%
  0.0625,  // Nivel 5: 6.25%
  0.0313,  // Nivel 6: 3.13%
  0.0313,  // Nivel 7: 3.13%
  0.0188,  // Nivel 8: 1.88%
  0.0063,  // Nivel 9: 0.63%
]

/**
 * Profundidad máxima de cobro según rango
 */
const MAX_DEPTH_BY_RANK = {
  'none': 0,
  'ACTIVO': 2,
  'BRONCE': 4,
  'PLATA': 5,
  'ORO': 6,
  'RUBÍ': 7,
  'ESMERALDA': 9,
  'DIAMANTE': 9,
  'DOBLE DIAMANTE': 9,
  'TRIPLE DIAMANTE': 9,
  'DIAMANTE IMPERIAL': 9,
  'EMBAJADOR SIFRAH': 9,
}

/**
 * Tope de puntos para cálculo completo (100%)
 * Puntos adicionales se pagan al 60% del porcentaje
 */
const TOPE_PUNTOS = 160
const REDUCCION_EXCESO = 0.6 // 60% del porcentaje original

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Obtiene los hijos directos de un nodo (usando el campo childs del árbol)
 * @param {string} nodeId - ID del nodo padre
 * @param {Array} tree - Array de nodos del árbol
 * @returns {Array} Array de nodos hijos
 */
function getDirectChildren(nodeId, tree) {
  const node = tree.find(n => n.id === nodeId)
  if (!node || !node.childs || node.childs.length === 0) {
    return []
  }
  
  return tree.filter(n => node.childs.includes(n.id))
}

/**
 * Obtiene todos los descendientes de un nodo hasta una profundidad máxima
 * CON compresión dinámica - omite nodos con PR=0 (para cálculo)
 * @param {string} nodeId - ID del nodo padre
 * @param {Array} tree - Array de nodos del árbol
 * @param {number} maxDepth - Profundidad máxima a recorrer
 * @param {number} currentEffectiveLevel - Nivel efectivo actual después de compresión (inicia en 0)
 * @returns {Array} Array de objetos {node, effectiveLevel} donde effectiveLevel es el nivel efectivo después de compresión
 */
function getDescendantsWithCompression(nodeId, tree, maxDepth, currentEffectiveLevel = 0) {
  if (currentEffectiveLevel >= maxDepth) {
    return []
  }
  
  const directChildren = getDirectChildren(nodeId, tree)
  const result = []
  
  for (const child of directChildren) {
    const pr = child.points || 0 // Puntos de reconsumo
    
    // Si tiene PR > 0, se incluye en el cálculo con el nivel efectivo actual + 1
    if (pr > 0) {
      const nextEffectiveLevel = currentEffectiveLevel + 1
      
      result.push({
        node: child,
        effectiveLevel: nextEffectiveLevel
      })
      
      // Obtener descendientes de este hijo con el siguiente nivel efectivo
      const descendants = getDescendantsWithCompression(
        child.id, 
        tree, 
        maxDepth, 
        nextEffectiveLevel
      )
      result.push(...descendants)
    } else {
      // Compresión dinámica: si PR=0, lo omitimos temporalmente
      // pero seguimos buscando en sus descendientes con el mismo nivel efectivo
      // (los descendientes "suben" un nivel efectivo)
      const descendants = getDescendantsWithCompression(
        child.id, 
        tree, 
        maxDepth, 
        currentEffectiveLevel // Mantener el mismo nivel efectivo (compresión)
      )
      result.push(...descendants)
    }
  }
  
  return result
}

/**
 * Calcula el bono residual para un afiliado específico
 * Aplica el tope de 160 puntos (100% hasta 160, 60% para exceso)
 * @param {number} pr - Puntos de reconsumo del afiliado
 * @param {number} percentage - Porcentaje del nivel
 * @returns {number} Monto del bono residual
 */
function calculateResidualBonus(pr, percentage) {
  if (pr <= 0) {
    return 0
  }
  
  if (pr <= TOPE_PUNTOS) {
    // Hasta 160 puntos: se paga al 100% del porcentaje
    return pr * percentage
  } else {
    // Más de 160 puntos: primeros 160 al 100%, exceso al 60%
    const primeros160 = TOPE_PUNTOS * percentage
    const exceso = (pr - TOPE_PUNTOS) * (percentage * REDUCCION_EXCESO)
    return primeros160 + exceso
  }
}

/**
 * Calcula el bono residual unilevel para un usuario específico
 * @param {Object} userNode - Nodo del usuario en el árbol
 * @param {Array} tree - Array completo de nodos del árbol
 * @param {Function} addLog - Función opcional para logging
 * @returns {Object} { totalBonus, bonusDetails }
 */
function calculateUnilevelResidualBonus(userNode, tree, addLog = null) {
  const userRank = userNode.rank || 'none'
  const maxDepth = MAX_DEPTH_BY_RANK[userRank] || 0
  
  // Si no tiene rango válido, retornar sin logs
  if (maxDepth === 0) {
    return {
      totalBonus: 0,
      bonusDetails: []
    }
  }
  
  // Obtener descendientes CON compresión dinámica (para cálculo)
  const descendants = getDescendantsWithCompression(userNode.id, tree, maxDepth, 0)
  
  let totalBonus = 0
  const bonusDetails = []
  
  // CÁLCULO: usar descendientes con compresión dinámica
  for (const { node, effectiveLevel } of descendants) {
    // El nivel efectivo es 1-indexed, convertir a 0-indexed para array
    const levelIndex = effectiveLevel - 1
    
    if (levelIndex < 0 || levelIndex >= RESIDUAL_PERCENTAGES.length) {
      continue // Nivel fuera del rango permitido
    }
    
    const pr = node.points || 0 // Solo puntos de reconsumo
    const percentage = RESIDUAL_PERCENTAGES[levelIndex]
    const bonus = calculateResidualBonus(pr, percentage)
    
    // Solo agregar a detalles si genera bono (bonus > 0)
    if (bonus > 0) {
      totalBonus += bonus
      
      const detail = {
        level: effectiveLevel, // Nivel efectivo con compresión
        dni: node.dni,
        name: node.name,
        pr: pr,
        percentage: percentage,
        bonus: bonus,
        // Detalle del cálculo si excede 160
        calculation: pr <= TOPE_PUNTOS 
          ? `${pr} × ${(percentage * 100).toFixed(2)}% = ${bonus.toFixed(2)}`
          : `${TOPE_PUNTOS} × ${(percentage * 100).toFixed(2)}% + ${(pr - TOPE_PUNTOS)} × ${(percentage * 100 * REDUCCION_EXCESO).toFixed(2)}% = ${bonus.toFixed(2)}`
      }
      
      bonusDetails.push(detail)
    }
  }
  
  // LOGS: mostrar solo si el usuario cobró (totalBonus > 0)
  if (addLog && totalBonus > 0) {
    addLog(`\n📊 ${userNode.name} (Rango: ${userRank})`)
    addLog(`   💰 Total bono residual: ${totalBonus.toFixed(2)}`)
    for (const detail of bonusDetails) {
      addLog(`   Nivel ${detail.level}: ${detail.name} (PR: ${detail.pr}) → ${detail.calculation}`)
    }
  }
  
  return {
    totalBonus,
    bonusDetails
  }
}

/**
 * Calcula el bono residual para todos los usuarios en el árbol
 * Genera transacciones por cada afiliado que genera bono
 * @param {Array} tree - Array de nodos del árbol
 * @param {Function} addLog - Función opcional para logging
 * @param {boolean} createTransactions - Si es true, crea transacciones en la base de datos
 * @returns {void} Modifica los nodos del árbol agregando residual_bonus y residual_bonus_arr
 */
async function calculateAllResidualBonuses(tree, addLog = null, createTransactions = false) {
  if (addLog) {
    addLog('\n' + '='.repeat(80))
    addLog('🚀 INICIANDO CÁLCULO DE BONOS RESIDUALES UNILEVEL')
    addLog('='.repeat(80))
  }
  
  let usersWithBonus = 0
  let totalTransactions = 0
  
  for (const node of tree) {
    // Inicializar campos de bono residual
    node.residual_bonus = 0
    node.residual_bonus_arr = []
    
    // Calcular bono residual para este usuario
    const { totalBonus, bonusDetails } = calculateUnilevelResidualBonus(node, tree, addLog)
    
    node.residual_bonus = totalBonus
    node.residual_bonus_arr = bonusDetails.map(detail => ({
      n: detail.level,
      dni: detail.dni,
      name: detail.name,
      val: detail.pr,
      r: detail.percentage,
      amount: detail.bonus,
      calculation: detail.calculation
    }))
    
    if (totalBonus > 0) {
      usersWithBonus++
      
      // Generar transacciones por cada afiliado que genera bono
      if (createTransactions) {
        for (const detail of bonusDetails) {
          // Buscar el nodo del afiliado para obtener su ID
          const affiliateNode = tree.find(n => n.dni === detail.dni && n.name === detail.name)
          const fromUserId = affiliateNode ? affiliateNode.id : null
          
          await Transaction.insert({
            id: rand(),
            date: new Date(),
            user_id: node.id, // Usuario que recibe el bono
            from_user_id: fromUserId, // Usuario del cual proviene el bono
            type: 'in',
            value: detail.bonus, // Monto del bono de este afiliado específico
            name: 'residual bonus',
            desc: `Bono residual nivel ${detail.level} - ${detail.name}`,
            // Detalles adicionales
            level: detail.level,
            affiliate_name: detail.name,
            affiliate_dni: detail.dni,
            pr: detail.pr,
            percentage: detail.percentage
          })
          totalTransactions++
        }
      }
    }
  }
  
  if (addLog) {
    addLog('\n' + '='.repeat(80))
    addLog(`✅ Cálculo completado: ${usersWithBonus} usuario(s) cobraron bono residual`)
    if (createTransactions) {
      addLog(`💳 Transacciones creadas: ${totalTransactions}`)
    }
    addLog('='.repeat(80))
  }
}

// ========================================
// TESTING / EJECUCIÓN
// ========================================

/**
 * Función principal para probar el cálculo
 */
async function main() {
  console.log('🚀 Iniciando cálculo de bonos residuales unilevel...\n')
  
  // Obtener datos de la base de datos
  const users = await User.find({})
  let tree = await Tree.find({})
  
  console.log(`✅ Obtenidos ${users.length} usuarios y ${tree.length} nodos del árbol\n`)
  
  // Enriquecer datos del árbol (similar a closed.js)
  tree.forEach((node) => {
    const user = users.find(u => u.id === node.id)
    if (user) {
      node.parentId = user.parentId
      node.dni = user.dni
      node.name = user.name + ' ' + user.lastName
      node.activated = user.activated
      node.points = Number(user.points) || 0 // Puntos de reconsumo (PR)
      node.rank = user.rank || 'none'
    }
  })
  
  // Calcular bonos residuales
  const logs = []
  function addLog(msg) {
    console.log(msg)
    logs.push(msg)
  }
  
  // Calcular bonos y crear transacciones
  await calculateAllResidualBonuses(tree, addLog, true)
  
  // Mostrar resumen de usuarios con bonos
  console.log('\n' + '='.repeat(80))
  console.log('📊 RESUMEN DE BONOS RESIDUALES')
  console.log('='.repeat(80))
  
  const usersWithBonus = tree.filter(n => n.residual_bonus > 0)
  console.log(`\nUsuarios con bono residual: ${usersWithBonus.length} de ${tree.length}`)
  
  // Mostrar top 10 usuarios con mayor bono
  const topUsers = usersWithBonus
    .sort((a, b) => b.residual_bonus - a.residual_bonus)
    .slice(0, 10)
  
  console.log('\n🏆 TOP 10 USUARIOS CON MAYOR BONO RESIDUAL:\n')
  topUsers.forEach((node, index) => {
    console.log(`${index + 1}. ${node.name}`)
    console.log(`   Rango: ${node.rank}`)
    console.log(`   Bono residual: ${node.residual_bonus.toFixed(2)}`)
    console.log(`   Afiliados que generan bono: ${node.residual_bonus_arr.length}`)
    console.log('')
  })
  
  // Guardar logs en archivo
  const fs = require('fs')
  const date = new Date().toISOString().split('T')[0]
  const filename = `residual_bonus_logs_${date}.txt`
  fs.writeFileSync(filename, logs.join('\n'))
  console.log(`\n📝 Logs guardados en: ${filename}`)
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error)
}

// Exportar funciones para uso en otros módulos
module.exports = {
  calculateUnilevelResidualBonus,
  calculateAllResidualBonuses,
  RESIDUAL_PERCENTAGES,
  MAX_DEPTH_BY_RANK,
  TOPE_PUNTOS,
  REDUCCION_EXCESO
}

