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

const TransformStream = require("stream").Transform

const csvTransformStream = new TransformStream({
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

    callback(false, JSON.stringify(obwod))
  },
})

const powiatMiejski = powiat =>
  powiat.slice(0, 1).toUpperCase() === powiat.slice(0, 1)

const nominatimCall = (obwod, requestPath) =>
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
      return obwod
    })

const superAgentTransformStream = new TransformStream({
  objectMode: true,
  transform: function transformer(chunk, encoding, callback) {
    let obwod = JSON.parse(chunk)

    if (obwod.geoJSON && obwod.geoJSON.features.length !== 0) {
      callback(false, `${JSON.stringify(obwod)}\n`)
      console.log("skipping...")
      return
    }

    const powiatUri = encodeURIComponent(
      powiatMiejski(obwod.powiat) ? obwod.powiat : `powiat ${obwod.powiat}`,
    )
    const miejscowoscUri = encodeURIComponent(obwod.miejscowosc)
    const ulicaUri = encodeURIComponent(obwod.ulica)
    const numerPosesjiUri = encodeURIComponent(obwod.numerPosesji)

    const requestPath = `https://nominatim.openstreetmap.org/search/Poland/${powiatUri}/${miejscowoscUri}/${ulicaUri}/${numerPosesjiUri}?format=geojson`

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
        return obwod
      })
      .then(obwod => {
        if (
          obwod.geoJSON.features.length === 0 &&
          obwod.ulica.split(" ").length > 1
        ) {
          const ulicaSplit = obwod.ulica.split(" ")
          const ulicaUri = encodeURIComponent(ulicaSplit[ulicaSplit.length - 1])
          const requestPath = `https://nominatim.openstreetmap.org/search/Poland/${powiatUri}/${miejscowoscUri}/${ulicaUri}/${numerPosesjiUri}?format=geojson`

          console.log({ requestPath })

          return superagent
            .get(requestPath)
            .use(throttle.plugin())
            .set(
              "User-Agent",
              "PKW Browser - contact developer at mail@michaljarosz.biz",
            )
            .then(data => {
              console.log({ geoJSON: data.text })
              obwod.geoJSON = JSON.parse(data.text)
              return obwod
            })
        }
        return obwod
      })
      .then(obwod => callback(false, `${JSON.stringify(obwod)}\n`))
      .catch(console.error)
  },
})

const inputPath = process.argv[2]
const outputPath = process.argv[3]

if (/csv$/.test(inputPath)) {
  fs.createReadStream(inputPath)
    .pipe(split())
    .pipe(csvTransformStream)
    .pipe(superAgentTransformStream)
    .pipe(fs.createWriteStream(outputPath))
} else if (/jsonl$/.test(inputPath)) {
  fs.createReadStream(inputPath)
    .pipe(split())
    .pipe(superAgentTransformStream)
    .pipe(fs.createWriteStream(outputPath))
}
