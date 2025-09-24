const db = require('./db')

const { Office } = db

async function main() {

  const offices = [
    { id: 'central', name: "Central", phone: '+51 959 141 444', password: 'cbm2023',
      products: [{ id: 1001, total: 0 },
                 { id: 1002, total: 0 },
                 { id: 1003, total: 0 },
                 { id: 1004, total: 0 },
                 { id: 1005, total: 0 },
                 { id: 1006, total: 0 },
                 { id: 1007, total: 0 },
                 { id: 1008, total: 0 },
                 { id: 1009, total: 0 },
                 { id: 1010, total: 0 },
                 { id: 1011, total: 0 },
                 { id: 1012, total: 0 },
                 { id: 1013, total: 0 },
                 { id: 1014, total: 0 },
                 { id: 1015, total: 0 },
                 { id: 1016, total: 0 },
                 { id: 1017, total: 0 },
                 { id: 1018, total: 0 },
                 { id: 1019, total: 0 },
                 { id: 1020, total: 0 },
                 { id: 1021, total: 0 },
                 { id: 1022, total: 0 },
                 { id: 1023, total: 0 },
                 { id: 1024, total: 0 },
                 { id: 1025, total: 0 },
                 { id: 1026, total: 0 },
                 { id: 1027, total: 0 },
                 { id: 1028, total: 0 },
                 { id: 1029, total: 0 }]
    },
    { id: 'secondary', name: "Secundaria", phone: '+51 908 804 551', password: 'cbm2023',
      products: [{ id: 1001, total: 0 },
                 { id: 1002, total: 0 },
                 { id: 1003, total: 0 },
                 { id: 1004, total: 0 },
                 { id: 1005, total: 0 },
                 { id: 1006, total: 0 },
                 { id: 1007, total: 0 },
                 { id: 1008, total: 0 },
                 { id: 1009, total: 0 },
                 { id: 1010, total: 0 },
                 { id: 1011, total: 0 },
                 { id: 1012, total: 0 },
                 { id: 1013, total: 0 },
                 { id: 1014, total: 0 },
                 { id: 1015, total: 0 },
                 { id: 1016, total: 0 },
                 { id: 1017, total: 0 },
                 { id: 1018, total: 0 },
                 { id: 1019, total: 0 },
                 { id: 1020, total: 0 },
                 { id: 1021, total: 0 },
                 { id: 1022, total: 0 },
                 { id: 1023, total: 0 },
                 { id: 1024, total: 0 },
                 { id: 1025, total: 0 },
                 { id: 1026, total: 0 },
                 { id: 1027, total: 0 },
                 { id: 1028, total: 0 },
                 { id: 1029, total: 0 }]
    },
  ]

  for(var i = 0; i < offices.length; i++) {
    await Office.insert(offices[i])
    console.log('...')
  }

}

main()
