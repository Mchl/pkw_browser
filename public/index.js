const mymap = L.map("mapid").setView([51.505, 21], 6)

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
  maxZoom: 18,
}).addTo(mymap)

const obwodPopup = obwod => `
Powiat: ${obwod.powiat}<br/>
Gmina: ${obwod.gmina}<br/>
Numer obwodu: ${obwod.numerObwodu}<br/>
Liczba mieszkańców: ${obwod.mieszkancy}<br/>
Liczba wyborców: ${obwod.wyborcy}<br/>
Siedziba: ${obwod.pelnaSiedziba}<br/>
Granice: ${obwod.opisGranic}

`

const markers = L.markerClusterGroup()
const addObwodMarker = obwod => {
  if (obwod.geoJSON.features.length > 0) {
    const coordinates = obwod.geoJSON.features[0].geometry.coordinates
    markers.addLayer(
      L.marker([coordinates[1], coordinates[0]]).bindPopup(obwodPopup(obwod)),
    )
    // L.marker()
    //   .addTo(mymap)
  }
}

fetch("../data/2019_pe/obwody_glosowania.json")
  .then(response => response.json())
  .then(obwody => obwody.forEach(addObwodMarker))
  .then(mymap.addLayer(markers))
