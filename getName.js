const fetch = require('node-fetch')

const headers = {'Authorization': 'Bearer Fpi4Tw5xYBDAjlN1zF-HNkXPiaEtTJfhdWVUB34Z', 'Content-Type': 'application/json'}
const zoneId = "940683270391a4ca2dee68628b7d64ee"
const baseUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`
async function getName() {
  const urls = await fetch(baseUrl, {method: 'GET', headers: headers})
  .then(res => res.text())
  .then(data => JSON.parse(data))
  .then(data => data['result'])
  .then(data => data.map(obj => obj['name']))

  return urls
}

