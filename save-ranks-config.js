const db = require('./db')

// Script para guardar la configuración del nuevo sistema de rangos en la BD
async function saveRanksConfig() {
  console.log('💾 Guardando configuración del nuevo sistema de rangos...\n')

  // Configuración de rangos actualizada
  const ranksConfig = {
    id: 'ranks_config_v2',
    version: '2.0',
    date: new Date(),
    description: 'Nuevo sistema de rangos MLM con 11 niveles, validaciones de reconsumo y PML/PML-R',
    ranks: [
      {
        pos: 10,
        rank: 'EMBAJADOR SIFRAH',
        type_calculation: 'simple',
        minimum_frontals: 6,
        threshold_points: 400000,
        maximum_large_leg: 80000,
        maximum_others_leg: 66666.7,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 9,
        rank: 'DIAMANTE IMPERIAL',
        type_calculation: 'simple',
        minimum_frontals: 6,
        threshold_points: 225000,
        maximum_large_leg: 45000,
        maximum_others_leg: 37500,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 8,
        rank: 'TRIPLE DIAMANTE',
        type_calculation: 'simple',
        minimum_frontals: 5,
        threshold_points: 125000,
        maximum_large_leg: 27500,
        maximum_others_leg: 25000,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 7,
        rank: 'DOBLE DIAMANTE',
        type_calculation: 'simple',
        minimum_frontals: 5,
        threshold_points: 80000,
        maximum_large_leg: 19200,
        maximum_others_leg: 16000,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 6,
        rank: 'DIAMANTE',
        type_calculation: 'simple',
        minimum_frontals: 4,
        threshold_points: 38000,
        maximum_large_leg: 10260,
        maximum_others_leg: 9500,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 5,
        rank: 'ESMERALDA',
        type_calculation: 'simple',
        minimum_frontals: 4,
        threshold_points: 18000,
        maximum_large_leg: 5400,
        maximum_others_leg: 4500,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 4,
        rank: 'RUBÍ',
        type_calculation: 'simple',
        minimum_frontals: 4,
        threshold_points: 8000,
        maximum_large_leg: 2400,
        maximum_others_leg: 2000,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 3,
        rank: 'ORO',
        type_calculation: 'simple',
        minimum_frontals: 3,
        threshold_points: 3300,
        maximum_large_leg: 1320,
        maximum_others_leg: 1100,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 2,
        rank: 'PLATA',
        type_calculation: 'simple',
        minimum_frontals: 3,
        threshold_points: 1500,
        maximum_large_leg: 675,
        maximum_others_leg: 500,
        reconsumo_required: 160,
        rank_dependencies: []
      },
      {
        pos: 1,
        rank: 'BRONCE',
        type_calculation: 'simple',
        minimum_frontals: 2,
        threshold_points: 600,
        maximum_large_leg: 360,
        maximum_others_leg: 300,
        reconsumo_required: 120,
        rank_dependencies: []
      }
    ],
    pays: [
      { name: 'BRONCE', payed: false, value: 60 },
      { name: 'PLATA', payed: false, value: 300 },
      { name: 'ORO', payed: false, value: 600 },
      { name: 'RUBÍ', payed: false, value: 1200 },
      { name: 'ESMERALDA', payed: false, value: 2500 },
      { name: 'DIAMANTE', payed: false, value: 5000 },
      { name: 'DOBLE DIAMANTE', payed: false, value: 10000 },
      { name: 'TRIPLE DIAMANTE', payed: false, value: 20000 },
      { name: 'DIAMANTE IMPERIAL', payed: false, value: 40000 },
      { name: 'EMBAJADOR SIFRAH', payed: false, value: 80000 }
    ],
    features: {
      reconsumo_validation: true,
      active_lines_validation: true,
      pml_pmlr_calculation: true,
      detailed_logging: true,
      progressive_bonuses: true
    },
    migration_notes: [
      'Sistema anterior tenía 5 rangos, nuevo sistema tiene 11 rangos',
      'Agregada validación de reconsumo mensual',
      'Implementado sistema PML/PML-R para control de líneas',
      'Mejorado sistema de logs para auditoría',
      'Actualizada estructura de pagos con valores progresivos'
    ]
  }

  try {
    // Guardar configuración en la base de datos
    await db.User.insert({
      id: 'ranks_config_v2',
      name: 'Sistema Rangos MLM',
      lastName: 'Configuración',
      dni: 'CONFIG_V2',
      email: 'config@sifrah.com',
      type: 'system_config',
      config: ranksConfig,
      date: new Date(),
      active: true
    })

    console.log('✅ Configuración guardada exitosamente en la base de datos')
    console.log(`📊 Total de rangos: ${ranksConfig.ranks.length}`)
    console.log(`💰 Total de pagos: ${ranksConfig.pays.length}`)
    console.log(`🔧 Características: ${Object.keys(ranksConfig.features).length}`)

    // Mostrar resumen de rangos
    console.log('\n📋 Resumen de rangos:')
    ranksConfig.ranks.forEach(rank => {
      console.log(`- ${rank.rank}: ${rank.threshold_points.toLocaleString()} puntos, ${rank.minimum_frontals} líneas`)
    })

    console.log('\n💰 Resumen de pagos:')
    ranksConfig.pays.forEach(pay => {
      console.log(`- ${pay.name}: $${pay.value.toLocaleString()}`)
    })

    console.log('\n🎉 ¡Sistema de rangos guardado y listo para usar!')

  } catch (error) {
    console.error('❌ Error al guardar configuración:', error.message)
  }
}

saveRanksConfig().catch(console.error)





