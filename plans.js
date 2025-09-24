const db = require('./db')

const { Plan } = db

async function main() {
  console.log('main ...')

  const plans = [
    {
      id: "early",
      name: "BÁSICO",
      amount: 150,
      img: "https://ik.imagekit.io/asu/lehaim/plan2_Ekks6_hF5.png",
      affiliation_points: 40,
      n: 1,
      max_products: 1,
      // products: [],
      kit: 50,
    },
    {
      id: "basic",
      name: "PIONERO",
      amount: 350,
      img: "https://ik.imagekit.io/asu/lehaim/plan2_Ekks6_hF5.png",
      affiliation_points: 120,
      n: 9,
      max_products: 3,
      // products: [],
      kit: 50,
    },
    {
      id: "standard",
      name: "EMPRESARIO",
      amount: 750,
      img: "https://ik.imagekit.io/asu/lehaim/plan3_exL_uYDGf.png",
      affiliation_points: 280,
      n: 9,
      max_products: 7,
      // products: [],
      kit: 50,
    },
    {
      id: "master",
      name: "PROFESIONAL",
      amount: 1050,
      img: "https://ik.imagekit.io/asu/lehaim/plan2_Ekks6_hF5.png",
      affiliation_points: 400,
      n: 9,
      max_products: 10,
      // products: [],
      kit: 50,
    },
  ]

  for(var i = 0; i < plans.length; i++) {
    console.log('...')
    await Plan.insert(plans[i])
  }

}

main()
