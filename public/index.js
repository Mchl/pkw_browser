const mymap = L.map("mapid").setView([52.088611111111, 19.407222222222], 7)

const baseLayers = {}
const overLays = {}

baseLayers.OpenStreetMap = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
    detectRetina: true,
  },
)

const obwodPopup = obwod => `
Powiat: ${obwod.powiat}<br/>
Gmina: ${obwod.gmina}<br/>
Numer obwodu: ${obwod.numerObwodu}<br/>
Liczba mieszkańców: ${obwod.mieszkancy}<br/>
Liczba wyborców: ${obwod.wyborcy}<br/>
Siedziba: ${obwod.pelnaSiedziba}<br/>
Granice: ${obwod.opisGranic}<br/>
Liczba kart ważnych: ${obwod.liczbaKartWaznych}<br/>
Lista nr 5 - KKW LEWICA RAZEM - RAZEM, UNIA PRACY, RSS: ${obwod.lista5} (${(
  (100 * obwod.lista5) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
1 ZAWISZA Marcelina Monika: ${obwod.lista5_1} (${(
  (100 * obwod.lista5_1) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
2 PRZYSTAJKO Jerzy: ${obwod.lista5_2} (${(
  (100 * obwod.lista5_2) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
3 PIWCEWICZ Jolanta Anna: ${obwod.lista5_3} (${(
  (100 * obwod.lista5_3) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
4 BROWARNY Wojciech Jan: ${obwod.lista5_4} (${(
  (100 * obwod.lista5_4) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
5 JAROŃSKA Kamila Maria: ${obwod.lista5_5} (${(
  (100 * obwod.lista5_5) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
6 MAKÓWKA Jacek Edward: ${obwod.lista5_6} (${(
  (100 * obwod.lista5_6) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
7 STABROWSKA Anna Ewa: ${obwod.lista5_7} (${(
  (100 * obwod.lista5_7) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
8 DROST Andrzej Oswald: ${obwod.lista5_8} (${(
  (100 * obwod.lista5_8) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
9 BURAKOWSKA Krystyna Anna: ${obwod.lista5_9} (${(
  (100 * obwod.lista5_9) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
10 CHUDY Filip: ${obwod.lista5_10} (${(
  (100 * obwod.lista5_10) /
  obwod.liczbaKartWaznych
).toFixed(2)}%)<br/>
`

const markers = L.markerClusterGroup()
const addObwodMarker = obwod => {
  const coordinates = obwod.geoJSON.features[0].geometry.coordinates
  markers.addLayer(
    L.marker([coordinates[1], coordinates[0]]).bindPopup(obwodPopup(obwod)),
  )
}

const heatmapData = []
const addHeatmapData = obwod => {
  const coordinates = obwod.geoJSON.features[0].geometry.coordinates
  heatmapData.push([
    coordinates[1],
    coordinates[0],
    obwod.lista5 / obwod.liczbaKartWaznych,
  ])
}

const obwody = fetch("../data/2019_pe/obwody_glosowania.jsonl")
  .then(response => response.text())
  .then(text => text.split("\n"))
  .then(rows => rows.slice(0, -1))
  .then(rows => rows.map(JSON.parse))

const wyniki = fetch("../data/2019_pe/wyniki_gl_na_kand_po_obwodach_12.csv")
  .then(response => response.text())
  .then(text => text.split("\n"))
  .then(rows => rows.slice(1, -1))
  .then(rows => rows.map(row => row.split(";")))
  .then(rows =>
    rows.reduce((wyniki, row) => {
      const [teryt, numerObwodu] = row
      if (!wyniki[teryt]) {
        wyniki[teryt] = {}
      }
      wyniki[teryt][numerObwodu] = row
      return wyniki
    }, {}),
  )

Promise.all([obwody, wyniki])
  .then(([obwody, wyniki]) =>
    obwody.map(obwod => {
      if (wyniki[obwod.teryt] && wyniki[obwod.teryt][obwod.numerObwodu]) {
        return {
          ...obwod,
          liczbaKartWaznych: wyniki[obwod.teryt][obwod.numerObwodu][28],
          lista5: wyniki[obwod.teryt][obwod.numerObwodu][82],
          lista5_1: wyniki[obwod.teryt][obwod.numerObwodu][83],
          lista5_2: wyniki[obwod.teryt][obwod.numerObwodu][84],
          lista5_3: wyniki[obwod.teryt][obwod.numerObwodu][85],
          lista5_4: wyniki[obwod.teryt][obwod.numerObwodu][86],
          lista5_5: wyniki[obwod.teryt][obwod.numerObwodu][87],
          lista5_6: wyniki[obwod.teryt][obwod.numerObwodu][88],
          lista5_7: wyniki[obwod.teryt][obwod.numerObwodu][89],
          lista5_8: wyniki[obwod.teryt][obwod.numerObwodu][90],
          lista5_9: wyniki[obwod.teryt][obwod.numerObwodu][91],
          lista5_10: wyniki[obwod.teryt][obwod.numerObwodu][92],
        }
      } else {
        return {
          ...obwod,
          liczbaKartWaznych: 0,
        }
      }
    }),
  )
  .then(obwody => obwody.filter(obwod => obwod.liczbaKartWaznych !== 0))
  .then(obwody =>
    obwody.forEach(obwod => {
      if (obwod.geoJSON.features.length > 0) {
        addObwodMarker(obwod)
        addHeatmapData(obwod)
      }
    }),
  )
  .then(() => {
    overLays["Komisje obwodowe"] = markers
    const heatLayer = new L.heatLayer(heatmapData, {
      radius: 30,
      maxZoom: 12,
      max: 0.2,
    })
    overLays.Heatmapa = heatLayer
    L.control
      .layers(baseLayers, overLays, {
        hideSingleBase: true,
      })
      .addTo(mymap)
    baseLayers.OpenStreetMap.addTo(mymap)
    overLays["Komisje obwodowe"].addTo(mymap)
    overLays.Heatmapa.addTo(mymap)
  })

// 0: "Kod terytorialny gminy"
// 1: "Nr obwodu głosowania"
// 2: "Typ obszaru"
// 3: "Typ obwodu"
// 4: "Siedziba Obwodowej Komisji Wyborczej"
// 5: "Gmina"
// 6: "Powiat"
// 7: "Województwo"
// 8: "Komisja otrzymała kart do głosowania"
// 9: "Liczba wyborców uprawnionych do głosowania"
// 10: "w tym umieszczonych w części A spisu wyborców"
// 11: "w tym umieszczonych w części B spisu wyborców"
// 12: "Nie wykorzystano kart do głosowania"
// 13: "Liczba wyborców, którym wydano karty do głosowania"
// 14: "w tym w części A spisu wyborców"
// 15: "w tym w części B spisu wyborców"
// 16: "Liczba wyborców głosujących przez pełnomocnika"
// 17: "Liczba wyborców głosujących na podstawie zaświadczenia o prawie do głosowania"
// 18: "Liczba wyborców, którym wysłano pakiety wyborcze"
// 19: "Liczba otrzymanych kopert zwrotnych"
// 20: "Liczba kopert zwrotnych, w których nie było oświadczenia o osobistym i tajnym oddaniu głosu"
// 21: "Liczba kopert zwrotnych, w których oświadczenie nie było podpisane"
// 22: "Liczba kopert zwrotnych, w których nie było koperty na kartę do głosowania"
// 23: "Liczba kopert zwrotnych, w których znajdowała się niezaklejona koperta na kartę do głosowania"
// 24: "Liczba kopert na kartę do głosowania wrzuconych do urny"
// 25: "Liczba kart wyjętych z urny"
// 26: "w tym liczba kart wyjętych z kopert na kartę do głosowania"
// 27: "Liczba kart nieważnych"
// 28: "Liczba kart ważnych"
// 29: "Liczba głosów nieważnych"
// 30: "w tym z powodu postawienia znaku „X” obok nazwiska dwóch lub większej liczby kandydatów"
// 31: "w tym z powodu niepostawienia znaku „X” obok nazwiska żadnego kandydata"
// 32: "w tym z powodu postawienia znaku „X” wyłącznie obok skreślonego nazwiska kandydata"
// 33: "Liczba głosów ważnych oddanych łącznie na wszystkie listy kandydatów"
// 82: "Lista nr 5 - KKW LEWICA RAZEM - RAZEM, UNIA PRACY, RSS"
// 83: "1 ZAWISZA Marcelina Monika"
// 84: "2 PRZYSTAJKO Jerzy"
// 85: "3 PIWCEWICZ Jolanta Anna"
// 86: "4 BROWARNY Wojciech Jan"
// 87: "5 JAROŃSKA Kamila Maria"
// 88: "6 MAKÓWKA Jacek Edward"
// 89: "7 STABROWSKA Anna Ewa"
// 90: "8 DROST Andrzej Oswald"
// 91: "9 BURAKOWSKA Krystyna Anna"
// 92: "10 CHUDY Filip"
// 93: "Razem"
