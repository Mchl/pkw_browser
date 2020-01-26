const superagent = require("superagent")
const SuperagentThrottle = require("superagent-throttle")
const fs = require("fs")
const split = require("split2")

// Nominamtim API has a very strict usage policy
const throttle = new SuperagentThrottle({
  active: true,
  rate: 1,
  ratePer: 2000,
  concurrent: 1,
})

const trimQuotes = string => string.replace(/^"/, "").replace(/"$/, "")

const superAgentTransformStream = new require("stream").Transform({
  transform: function transformer(chunk, encoding, callback) {
    const csv = chunk
      .toString()
      .split(";")
      .map(trimQuotes)
    const [
      teryt,
      gmina,
      powiat,
      numerObwodu,
      mieszkancy,
      wyborcy,
      siedziba,
      miejscowosc,
      ulica,
      numerPosesji,
      numerLokalu,
      kodPocztowy,
      poczta,
      typObwodu,
      przystosowanyDlaNiepelnosprawnych,
      typObszaru,
      pelnaSiedziba,
      opisGranic,
    ] = csv

    let obwod = {
      teryt,
      gmina,
      powiat,
      numerObwodu: Number(numerObwodu),
      mieszkancy: Number(mieszkancy),
      wyborcy: Number(wyborcy),
      siedziba,
      miejscowosc,
      ulica,
      numerPosesji,
      numerLokalu,
      kodPocztowy,
      poczta,
      typObwodu,
      przystosowanyDlaNiepelnosprawnych:
        przystosowanyDlaNiepelnosprawnych === "Tak",
      typObszaru,
      pelnaSiedziba,
      opisGranic,
    }

    const requestPath = encodeURI(
      `https://nominatim.openstreetmap.org/search/Poland/powiat ${obwod.powiat}/${obwod.miejscowosc}/${obwod.ulica}/${obwod.numerPosesji}?format=geojson`,
    )

    console.log({ requestPath })

    superagent
      .get(requestPath)
      .use(throttle.plugin())
      .set(
        "User-Agent",
        "PKW Browser - contact developer at mail@michaljarosz.biz",
      )
      .then(data => {
        console.log({ geoJSON: data.text })
        obwod.geoJSON = JSON.parse(data.text)
        callback(false, `${JSON.stringify(obwod)}\n`)
      })
      .catch(console.error)
  },
})

fs.createReadStream("./data/2019_pe/obwody_glosowania.csv")
  .pipe(split())
  .pipe(superAgentTransformStream)
  .pipe(fs.createWriteStream("./data/2019_pe/obwody_glosowania.jsonl"))
