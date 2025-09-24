const db = require('./db')

const { Product } = db

async function main() {

  const products = [

    { id: 1001, name: "COLÁGENO", type: "LINEA SIFRAH", price: 85, points: 40, img: "https://ik.imagekit.io/asu/sifrah/COLAGENO_o8P1_fwv-.jpeg" },
    // { id: 1002, name: "THE ONE CBD - Unguento",             type: "LINEA CBD", price: [60, 60, 57, 50], aff_price: [60, 60, 57, 50], img: "https://ik.imagekit.io/asu/cbm/products/Ungu%CC%88ento%20de%20cannabis_ghLUbC11e5.jpeg" },
    // { id: 1003, name: "THE ONE CBD - Te revitalizador",     type: "LINEA CBD", price: [40, 40, 35, 30], aff_price: [40, 40, 35, 30], img: "https://ik.imagekit.io/asu/cbm/products/te%20de%20cannabis_EZZ0zvLaO.jpeg" },

    // { id: 1004, name: "Power kids",                         type: "SUPLEMENTOS", price: [36, 36, 35, 30], aff_price: [36, 36, 35, 30], img: "https://ik.imagekit.io/asu/cbm/products/Power%20kids_E1WpMHscf.jpeg" },
    // { id: 1005, name: "Ferox probiótico",                   type: "SUPLEMENTOS", price: [36, 36, 35, 30], aff_price: [36, 36, 35, 30], img: "https://ik.imagekit.io/asu/cbm/products/ferox%20probio%CC%81ticos_x52JllFAQ.jpeg" },
    // { id: 1006, name: "Flora Plus (POTE)",                  type: "SUPLEMENTOS", price: [30, 30, 28, 25], aff_price: [30, 30, 28, 25], img: "https://ik.imagekit.io/asu/cbm/products/ferox%20probio%CC%81ticos_x52JllFAQ.jpeg" },
    // { id: 1007, name: "Online fit (POTE)",                  type: "SUPLEMENTOS", price: [30, 30, 28, 25], aff_price: [30, 30, 28, 25], img: "https://ik.imagekit.io/asu/cbm/3_R_LoQbonO.jpeg" },
    // { id: 1008, name: "Detox (POTE)",                       type: "SUPLEMENTOS", price: [30, 30, 28, 25], aff_price: [30, 30, 28, 25], img: "https://ik.imagekit.io/asu/cbm/4_yc-2ZYegV.jpeg" },
    // { id: 1009, name: "Full Energy (POTE)",                 type: "SUPLEMENTOS", price: [30, 30, 28, 25], aff_price: [30, 30, 28, 25], img: "https://ik.imagekit.io/asu/cbm/2_3TylsLz7h.jpeg" },
    // { id: 1010, name: "Doble Capuccino (POTE)",             type: "SUPLEMENTOS", price: [30, 30, 28, 25], aff_price: [30, 30, 28, 25], img: "https://ik.imagekit.io/asu/cbm/4_yc-2ZYegV.jpeg" },
    // { id: 1011, name: "FULL DEFENCE 911 - Inmunomodulador", type: "SUPLEMENTOS", price: [40, 40, 38, 35], aff_price: [40, 40, 38, 35], img: "https://ik.imagekit.io/asu/cbm/4_yc-2ZYegV.jpeg" },
    // { id: 1012, name: "STRONGER 2k (POTE)",                 type: "SUPLEMENTOS", price: [36, 36, 35, 30], aff_price: [36, 36, 35, 30], img: "https://ik.imagekit.io/asu/cbm/1_0uynTrwCo.jpeg" },
    // { id: 1013, name: "Protein Form - Slim & Fit",          type: "SUPLEMENTOS", price: [42, 42, 40, 40], aff_price: [42, 42, 40, 40], img: "https://ik.imagekit.io/asu/cbm/products/prostafire_8pptL_XTe.jpeg" },
    // { id: 1014, name: "FLEXI GROW - Colágeno Hidrólizado",  type: "SUPLEMENTOS", price: [40, 40, 38, 35], aff_price: [40, 40, 38, 35], img: "https://ik.imagekit.io/asu/cbm/1_0uynTrwCo.jpeg" },
    // { id: 1015, name: "MORINGA PLUS",                       type: "SUPLEMENTOS", price: [30, 30, 28, 25], aff_price: [30, 30, 28, 25], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },

    // { id: 1016, name: "Shampoo Funny Niños", type: "ASEO PERSONAL", price: [27, 27, 25, 20], aff_price: [27, 27, 25, 20], img: "https://ik.imagekit.io/asu/cbm/3_R_LoQbonO.jpeg" },
    // { id: 1017, name: "Shampoo Argan",       type: "ASEO PERSONAL", price: [27, 27, 25, 20], aff_price: [27, 27, 25, 20], img: "https://ik.imagekit.io/asu/cbm/3_R_LoQbonO.jpeg" },
    // { id: 1018, name: "ALCOHOL",             type: "ASEO PERSONAL", price: [ 5,  5,  5,  5], aff_price: [ 7,  7,  7,  7], img: "https://ik.imagekit.io/asu/cbm/3_R_LoQbonO.jpeg" },
    // { id: 1019, name: "JABON LIQUIDO",       type: "ASEO PERSONAL", price: [ 8,  8,  8,  8], aff_price: [10, 10, 10, 10], img: "https://ik.imagekit.io/asu/cbm/3_R_LoQbonO.jpeg" },

    // { id: 1020, name: "Camisetas", type: "TEXTIL Y ACCESORIOS", price: [ 25,  25,  24, 20], aff_price: [ 25,  25,  24, 20], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1021, name: "Gorras",    type: "TEXTIL Y ACCESORIOS", price: [ 25,  25,  24, 20], aff_price: [ 25,  25,  24, 20], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1022, name: "BOLSOS",    type: "TEXTIL Y ACCESORIOS", price: [3.5, 3.5, 3.5,  3], aff_price: [3.5, 3.5, 3.5,  3], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },

    // { id: 1023, name: "THE ONE CBD - Rejuvenecedora",      type: "COSMETICOS", price: [60, 60, 57, 50], aff_price: [60, 60, 57, 50], img: "https://ik.imagekit.io/asu/cbm/products/Crema%20especial%20cannabis_RVnOF43ZS.jpeg" },
    // { id: 1024, name: "THE ONE CBD - Aceite para masajes", type: "COSMETICOS", price: [60, 60, 57, 50], aff_price: [60, 60, 57, 50], img: "https://ik.imagekit.io/asu/cbm/3_R_LoQbonO.jpeg" },
    // { id: 1025, name: "THE ONE CBD - Crema corporal",      type: "COSMETICOS", price: [60, 60, 57, 50], aff_price: [60, 60, 57, 50], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1026, name: "JABON CBD",                         type: "COSMETICOS", price: [45, 45, 44, 40], aff_price: [45, 45, 44, 40], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },

    // { id: 1027, name: "Botella - H2O Brillante", type: "BEBIDAS", price: [ 1,  1,  1,  1], val: 0.5, img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1028, name: "PACA - H2O Brillante",    type: "BEBIDAS", price: [10, 10,  9,  9], val:   3, img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },

    // { id: 1029, name: "JARROS",        type: "VARIADOS", price: [17, 17, 15, 15], val: 7, img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1030, name: "ESFEROS",       type: "VARIADOS", price: [ 1,  1,  1,  1], aff_price: [ 1,  1,  1,  1], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1031, name: "Miel Melipoma", type: "VARIADOS", price: [ 8,  8,  8,  7], aff_price: [ 8,  8,  8,  7], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },

    // { id: 1032, name: "PROSTAFIRE - potenciador", type: "SUPLEMENTOS", price: [36, 36, 35, 30], aff_price: [36, 36, 35, 30], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1033, name: "TOMA TODO",                type: "VARIADOS",    price: [17, 17, 15, 15], val: 7, img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },

    // { id: 1034, name: "WARMI",    type: "SUPLEMENTOS", price: [35, 35, 30, 28], aff_price: [35, 35, 30, 28], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
    // { id: 1035, name: "NERVIZEN", type: "SUPLEMENTOS", price: [35, 35, 30, 28], aff_price: [35, 35, 30, 28], img: "https://ik.imagekit.io/asu/cbm/products/crema%20corporal%20cannabis_IoR60xBHm.jpeg" },
  ]

  for(var i = 0; i < products.length; i++) {
    console.log('...')
    await Product.insert(products[i])
  }

}

main()
