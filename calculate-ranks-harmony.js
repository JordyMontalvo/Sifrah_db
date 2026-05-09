/**
 * SCRIPT DE CÁLCULO DE RANGOS - SISTEMA HARMONY
 * 
 * Este script integra el nuevo sistema de rangos Harmony con la base de datos real.
 * 
 * CAMBIOS PRINCIPALES:
 * - PP (Puntaje Personal) = max(puntos_productos, puntos_afiliacion  
 * - PG (Puntaje Grupal) = total_points
 * - Activos Directos = directos con PP >= 180
 * - Piernas con Rango = piernas con usuarios que cerraron cierto rango
 * - Sin balance de piernas (unilevel puro)
 */

const db = require('./db')
const fs = require('fs')
const { ranksHarmony } = require('./ranks-config-harmony')
const {
  calcularPP,
  obtenerPG,
  contarActivosDirectos,
  calcularRangosTodos
} = require('./rank-calculation-harmony')

const { User, Tree } = db

let users = []
let tree = []
let logs = []

function addLog(log) {
  console.log(log)
  logs.push(log)
}

/**
 * FUNCIÓN PRINCIPAL
 */
async function main() {
  addLog('╔══════════════════════════════════════════════════════════════════════╗')
  addLog('║                                                                      ║')
  addLog('║       CÁLCULO DE RANGOS - SISTEMA HARMONY                            ║')
  addLog('║                                                                      ║')
  addLog('╚══════════════════════════════════════════════════════════════════════╝\n')

  // ============================================
  // PASO 1: OBTENER DATOS DE LA BD
  // ============================================
  addLog('📊 PASO 1: Obteniendo datos de la base de datos...\n')
  
  users = await User.find({})
  tree = await Tree.find({})
  
  addLog(`✅ Obtenidos ${users.length} usuarios`)
  addLog(`✅ Obtenidos ${tree.length} nodos del árbol\n`)

  // ============================================
  // PASO 2: ENRIQUECER DATOS
  // ============================================
  addLog('🔗 PASO 2: Enriqueciendo datos del árbol...\n')
  enrichTreeData()

  // ============================================
  // PASO 3: PREPARAR USUARIOS PARA CÁLCULO
  // ============================================
  addLog('⚙️  PASO 3: Preparando usuarios para cálculo de rangos...\n')
  
  const usuariosParaCalculo = prepararUsuariosParaCalculo()
  addLog(`✅ Preparados ${usuariosParaCalculo.length} usuarios\n`)

  // ============================================
  // PASO 4: CALCULAR RANGOS
  // ============================================
  addLog('🏆 PASO 4: Calculando rangos con nuevo sistema Harmony...\n')
  
  const rangosCalculados = calcularRangosTodos(usuariosParaCalculo, logs)
  
  addLog('\n✅ Rangos calculados exitosamente\n')

  // ============================================
  // PASO 5: APLICAR RANGOS AL ÁRBOL
  // ============================================
  addLog('📝 PASO 5: Aplicando rangos al árbol...\n')
  
  aplicarRangosAlArbol(rangosCalculados)

  // ============================================
  // PASO 6: GENERAR REPORTE
  // ============================================
  addLog('\n╔══════════════════════════════════════════════════════════════════════╗')
  addLog('║                      RESUMEN DE RANGOS                               ║')
  addLog('╚══════════════════════════════════════════════════════════════════════╝\n')
  
  generarResumenRangos(rangosCalculados)

  // ============================================
  // PASO 7: GUARDAR LOGS
  // ============================================
  const date = new Date().toISOString().split('T')[0]
  const filename = `harmony_rank_logs_${date}.txt`
  fs.writeFileSync(filename, logs.join('\n'))
  addLog(`\n📄 Logs guardados en: ${filename}`)

  // ============================================
  // PASO 8: ACTUALIZAR BD
  // ============================================
  addLog('\n💾 PASO 8: Actualizando base de datos...')
  await updateDB()
  
  addLog('\n╔══════════════════════════════════════════════════════════════════════╗')
  addLog('║                      ✅ PROCESO COMPLETADO                            ║')
  addLog('╚══════════════════════════════════════════════════════════════════════╝\n')
}

/**
 * ENRIQUECE LOS DATOS DEL ÁRBOL CON INFORMACIÓN DE USUARIOS
 */
function enrichTreeData() {
  tree.forEach((node) => {
    const user = users.find((e) => e.id == node.id)
    
    if (!user) {
      addLog(`⚠️ Usuario no encontrado para nodo ${node.id}`)
      return
    }

    // Datos básicos
    node.parentId = user.parentId
    node.plan = user.plan
    node.dni = user.dni
    node.name = user.name + ' ' + user.lastName
    
    // Estado
    node.activated = user.activated
    node._activated = user._activated ? user._activated : false
    
    // Puntos
    node.points = Number(user.points) || 0
    node.affiliation_points = user.affiliation_points || 0
    node.total_points = user.total_points || 0
    
    // Bonificaciones (mantener para compatibilidad)
    node.residual_bonus = 0
    node.residual_bonus_arr = []
    node.excedent_bonus = 0
    node.excedent_bonus_arr = []
    
    // Pagos (usar nueva configuración si no existe)
    const paysHarmony = ranksHarmony.map(r => ({
      name: r.name,
      payed: false,
      value: r.id * 1000 // Valor temporal, puedes ajustar
    }))
    node.pays = user.pays || paysHarmony
    node._pays = []
  })
  
  addLog(`✅ Datos enriquecidos para ${tree.length} nodos`)
}

/**
 * PREPARA USUARIOS PARA EL CÁLCULO DE RANGOS
 * Convierte la estructura del árbol al formato que espera el módulo de cálculo
 */
function prepararUsuariosParaCalculo() {
  return tree.map((node) => {
    const propio = Number(node.points || 0) + Number(node.affiliation_points || 0)
    const pgSinPropio = Math.max(0, (node.total_points || 0) - propio)
    return {
      id: node.id,
      name: node.name,
      puntos_productos: node.points || 0,
      puntos_afiliacion: node.affiliation_points || 0,
      total_points: pgSinPropio,
      directos: node.childs || [],
    }
  })
}

/**
 * APLICA LOS RANGOS CALCULADOS AL ÁRBOL
 */
function aplicarRangosAlArbol(rangosCalculados) {
  for (let node of tree) {
    const rangoId = rangosCalculados[node.id] || 0
    const rangoInfo = ranksHarmony.find(r => r.id === rangoId)
    
    if (rangoInfo) {
      node.rank = rangoInfo.name
      addLog(`✅ ${node.name.padEnd(30)} → ${rangoInfo.name}`)
    } else {
      node.rank = 'ACTIVO'
      addLog(`⚪ ${node.name.padEnd(30)} → ACTIVO (sin rango)`)
    }
  }
}

/**
 * GENERA RESUMEN DE RANGOS
 */
function generarResumenRangos(rangosCalculados) {
  const conteo = {}
  ranksHarmony.forEach(r => conteo[r.name] = 0)
  conteo['ACTIVO'] = 0

  for (let userId in rangosCalculados) {
    const rangoId = rangosCalculados[userId]
    const rangoInfo = ranksHarmony.find(r => r.id === rangoId)
    const rangoNombre = rangoInfo ? rangoInfo.name : 'ACTIVO'
    conteo[rangoNombre]++
  }

  addLog('┌─────────────────────────┬──────────┐')
  addLog('│ RANGO                   │ CANTIDAD │')
  addLog('├─────────────────────────┼──────────┤')
  
  for (let rango in conteo) {
    if (conteo[rango] > 0) {
      const nombrePad = rango.padEnd(23)
      const cantidadPad = conteo[rango].toString().padStart(8)
      addLog(`│ ${nombrePad} │ ${cantidadPad} │`)
    }
  }
  
  addLog('└─────────────────────────┴──────────┘')
}

/**
 * ACTUALIZA LA BASE DE DATOS
 */
async function updateDB() {
  try {
    const operations = []

    for (let node of tree) {
      operations.push({
        updateOne: {
          filter: { id: node.id },
          update: {
            $set: {
              rank: node.rank,
              // Guardar snapshot del mes
              last_rank_calculation: {
                date: new Date(),
                rank: node.rank,
                pp: calcularPP({
                  puntos_productos: node.points,
                  puntos_afiliacion: node.affiliation_points
                }),
                pg: node.total_points,
                activos_directos: contarActivosDirectos(
                  { id: node.id, directos: node.childs || [] },
                  users.map(u => ({
                    id: u.id,
                    puntos_productos: u.points || 0,
                    puntos_afiliacion: u.affiliation_points || 0
                  }))
                )
              }
            }
          }
        }
      })
    }

    if (operations.length > 0) {
      await User.bulkWrite(operations)
      addLog(`✅ Actualizados ${operations.length} usuarios en la base de datos`)
    }

  } catch (error) {
    addLog(`❌ Error al actualizar BD: ${error.message}`)
    throw error
  }
}

// ============================================
// EJECUTAR
// ============================================

main()
  .then(() => {
    addLog('\n🎉 Proceso finalizado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    addLog('\n❌ Error en el proceso:')
    addLog(error.stack)
    process.exit(1)
  })
