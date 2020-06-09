require('dotenv').config()
const { MongoClient } = require('mongodb')
const fetch = require('node-fetch')

class ConfigsDAO {
  static getDb () {
    const url = process.env.LOCAL_DB_URI || 'mongodb://localhost:27017'
    const client = new MongoClient(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      { poolSize: 50, w: 1, wtimeout: 2500 }
    )
    return client
  }

  static async getConfig (_, arg) {
    try {
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      const config = await configs.findOne({ name: arg.name })
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
      const config = await configs.find({ type: 'A' }, { name: 1, content: 1 }).toArray()
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

  static async removeOneDNSRecord (_, arg) {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.DNS_WRITE_BEARER}`,
        'Content-Type': 'application/json'
      }
      const zoneId = process.env.DNS_ZONE_ID
      const apiURI = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${arg.id}`
      await fetch(apiURI, {
        method: 'DELETE',
        headers: headers
      }).then((res) => {
        console.log(res)
        this.deleteOneConfig(_, arg)
        return res.id
      })
    } catch (e) {
      console.error(e)
    }
  }

  static async updateConfigs () {
    try {
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      await configs.deleteMany({})
      const headers = {
        Authorization: `Bearer ${process.env.DNS_BEARER}`,
        'Content-Type': 'application/json'
      }
      const zoneId = process.env.DNS_ZONE_ID
      const api = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`
      await fetch(api, { method: 'GET', headers: headers })
        .then(res => res.text())
        .then(res => JSON.parse(res))
        .then(res => res.result)
        .then(res => res.map(obj => configs.updateMany({ name: obj.name },
          {
            $set:
              {
                type: obj.type,
                ip: obj.content,
                vid: process.env.V2RAY_VID,
                alterId: '32',
                path: process.env.V2RAY_PATH,
                ps: obj.name.split('.')[0]
              },
            $setOnInsert:
              {
                id: obj.id,
                address: obj.name
              }
          },
          { upsert: true })))
    } catch (e) {
      console.error(e)
      return { error: e }
    }
  }

  static async addDNSRecord (_, arg) {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.DNS_WRITE_BEARER}`,
        'Content-Type': 'application/json'
      }
      const params = {
        type: 'A',
        name: arg.ps,
        content: arg.ip,
        ttl: 120,
        priority: false
      }
      const baseAPI = `https://api.cloudflare.com/client/v4/zones/${process.env.DNS_ZONE_ID}/dns_records`
      await fetch(baseAPI, { method: 'POST', headers: headers, data: params })
        .then(res => res.text())
        .then(res => JSON.parse(res))
        .then(res => res.result)
        .then(res => res.id)
    } catch (e) {
      console.error(e)
      return { error: e }
    }
  }
}

module.exports = { ConfigsDAO: ConfigsDAO }
