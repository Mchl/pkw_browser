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
    let obwod = JSON.parse(chunk.toString())

    if (obwod.geoJSON.features.length !== 0) {
      callback(false, `${JSON.stringify(obwod)}\n`)
      return
    }

    const powiatUri =
      obwod.powiat.slice(0, 1).toUpperCase() === obwod.powiat.slice(0, 1)
        ? obwod.powiat
        : `powiat ${obwod.powiat}`

    const requestPath = encodeURI(
      `https://nominatim.openstreetmap.org/search/Poland/${powiatUri}/${obwod.miejscowosc}/${obwod.ulica}/${obwod.numerPosesji}?format=geojson`,
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

fs.createReadStream("./data/2019_pe/obwody_glosowania_1.jsonl")
  .pipe(split())
  .pipe(superAgentTransformStream)
  .pipe(fs.createWriteStream("./data/2019_pe/obwody_glosowania.jsonl"))
