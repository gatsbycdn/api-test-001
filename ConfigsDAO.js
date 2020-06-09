require('dotenv').config()
const { MongoClient } = require('mongodb')
const fetch = require('node-fetch')

class ConfigsDAO {
  static getDb () {
    const url = process.env.LOCAL_DB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      { poolSize: 50, w: 1, wtimeout: 2500 },
    )
    return client
  }

  static async getConfig (_, arg) {
    try {
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      const config = await configs.findOne({ name: arg.name })
      console.log(user)
      return config
    } catch (e) {
      console.error(e)
    }
  }

  static async listConfig () {
    try {
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      // const myString = await users.find({}, {email:1}).toArray();
      const config = await configs.find({type:"A"},{"name":1,"content":1}).toArray()
      console.log(config)
      return config
    } catch (e) {
      console.error(e)
    }
  }

  static async deleteOneConfig (_, arg) {
    try {
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      console.log(arg)
      await configs.deleteOne({ id: arg.id })
      return arg.id
    } catch (e) {
      console.error(e)
    }
  }

  static async updateConfigs () {
    try {
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      await configs.deleteMany({})
      const headers = {'Authorization': 'Bearer Fpi4Tw5xYBDAjlN1zF-HNkXPiaEtTJfhdWVUB34Z',
        'Content-Type': 'application/json'}
      const zoneId = '940683270391a4ca2dee68628b7d64ee'
      const api = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`
      await fetch(api, 
        { method: "GET", headers: headers})
        .then( res => res.text())
        .then( res => JSON.parse(res))
        .then( res => res['result'])
        .then( res => res.map(obj => configs.updateMany({
          name:obj['name']},
          { 
            $set: 
              { type: obj['type'],
                ip: obj['content'],
                vid: "de438087-770d-b3a2-bc93-3716a7893227",
                alterId: "32",
                path: "googoogaga",
                ps: obj['name'].split('.')[0],
              },  
            $setOnInsert:
              { id: obj['id'],
                address: obj['name'],
              }
          },
          {upsert:true})))
    } catch (e) {
      console.error(e)
      return { error: e }
    }
  }



  
}

// ConfigsDAO.updateConfigs()
// ConfigsDAO.listConfig()

module.exports = { ConfigsDAO: ConfigsDAO }
