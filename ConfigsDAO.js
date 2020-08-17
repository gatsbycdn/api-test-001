require('dotenv').config()
const { MongoClient } = require('mongodb')
const fetch = require('node-fetch')
const fs = require('fs');

class ConfigsDAO {
  static async getAlienIp () {
    const apiURI = 'https://api.ipify.org'
    const alienIp = await fetch(apiURI, { method: 'GET' })
      .then(res => res.text())
      .then(res => ({ ip: res }))
    console.log(alienIp)
    return alienIp
  }

  static async getProxyIp () {
    try {
      const apiURI = 'https://www.cloudflare.com/cdn-cgi/trace'
      const jsonText = await fetch(apiURI, { method: 'GET' })
      .then(res => res.text())
      .then(res => res.split('\n').join('",\n"'))
      .then(res => res.split('=').join('":"'))
      .then(res => res.slice(0,res.length-3))
      .then(res => '{"' + res + '}')
      .then(res => JSON.parse(res))
      console.log(jsonText)
      return jsonText
    } catch(e) {
      console.log(e)
      return {
        ip: "null",
        loc: "failed to fetch: getProxyIp"
      }
    }
  }

  static async getEarthIp () {
    try {
      const apiURI = 'http://pv.sohu.com/cityjson?ie=utf-8'
      const earthIp = await fetch(apiURI, { method: 'GET' })
        .then(res => res.text())
        .then(res => res.slice(0, -1))
        .then(res => res.split('=')[1])
        .then(res => JSON.parse(res))
      return earthIp
    } catch(e) {
      console.log(e)
      return {
        cname: 'failed to fetch: getEarthIp',
        cip: 'null'
      }
    }
  }

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
      const config = await configs.findOne({ ip: arg.ip })
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
      const config = await configs.find({ type: 'A' }, { name: 1, content: 1 }).limit(50).toArray()
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
      const deleteResult = await configs.deleteOne({ id: arg.id })
      const returnResult = {
        result: deleteResult.result,
        id: arg.id,
        deletedCount: deleteResult.deletedCount
      }
      console.log(returnResult)
      return returnResult
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
      const removeResult= await fetch(apiURI, {
        method: 'DELETE',
        headers: headers
      })
      .then(res => res.text())
      .then(res => JSON.parse(res))
      console.log(removeResult)

      return removeResult


    } catch (e) {
      console.error(e)
    }
  }

  static async updateConfigs () {
    try {
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      await configs.deleteMany({})
      await configs.createIndex({"id":1},{ unique: true })
      const headers = {
        Authorization: `Bearer ${process.env.DNS_BEARER}`,
        'Content-Type': 'application/json'
      }
      const zoneId = process.env.DNS_ZONE_ID
      const api = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100`
      const updateFromCloudFlare = await fetch(api, { method: 'GET', headers: headers })
        .then(res => res.text())
        .then(res => JSON.parse(res))
        .then(res => res.result)

      const itemsArray = Array.from(updateFromCloudFlare)
      console.log(itemsArray)

      await Promise.all(itemsArray.map(obj => configs.updateMany({ name: obj.name },
          {
            $set:
              {
                type: obj.type,
                ip: obj.content,
                vid: process.env.V2RAY_VID,
                alterId: '32',
                path: process.env.V2RAY_PATH,
                ps: obj.name.split('.')[0],
                status: 'unknown'
              },
            $setOnInsert:
              {
                id: obj.id,
                address: obj.name
              }
          },
          { upsert: true }, function(err, result) {
            if (err) throw err;
            console.log(result.upsertedCount)
         })))

      //console.log(commandResult)

      return updateFromCloudFlare
    } catch (e) {
      console.error(e)
      return { error: e }
    }
  }

  static async addDNSRecord (_, arg) {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.DNS_WRITE_BEARER}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
      const params = {
        type: 'A',
        name: arg.ps,
        content: arg.ip,
        // "priority": false,
        ttl: 120
      }
      const baseAPI = `https://api.cloudflare.com/client/v4/zones/${process.env.DNS_ZONE_ID}/dns_records`
      const cloudFlareApiCallback = await fetch(baseAPI, { method: 'post', headers: headers, body: JSON.stringify(params) })
        .then(res => res.text())
        .then(res => JSON.parse(res))
        /*.then(res => {
          console.log(res)
          console.log(typeof(res.result.created_on))
          res.success
        })*/
      console.log(cloudFlareApiCallback)
      return cloudFlareApiCallback
    } catch (e) {
      console.error(e)
      return { error: e }
    }
  }  
  
  static async allInOne () {
    
    const localIP = await ConfigsDAO.getEarthIp()

    try {
      const proxyIP = await ConfigsDAO.getProxyIp()
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      const config = await configs.findOne({ ip: proxyIP.ip })
      const configAll= await configs.find({ type: 'A' }, { name: 1, content: 1 }).toArray()
      const configElse = configAll.filter(obj => obj.id!==config.id)
      const all = {
        proxyIP: proxyIP,
        localIP: localIP,
        config: config,
        configElse: configElse
      }
      console.log(all)
      return all

    } catch (e) {
      console.error(e)
      const conn = await ConfigsDAO.getDb().connect()
      const configs = await conn.db('test').collection('configs')
      const config = { address: 'failed to fetch' }
      const proxyIp = { ip: 'failed to fetch' }
      const configAll= await configs.find({ type: 'A' }, { name: 1, content: 1 }).limit(50).toArray()
      const all = {
        proxyIP: proxyIp,
        localIP: localIP,
        config: config,
        configElse: configAll
      }
      return all
    }
    
  }

  static async alterOutbound (_, arg) {
    try {
      const fileName = process.env.V2RAY_CONFIG_DIR || '/etc/v2ray/config.json';
      const file = require(fileName);
      const addressToAlter = arg.address
      file.outbounds[0].settings.vnext[0].address = addressToAlter;
      fs.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
      });
      const addressAlteredResponse = {
        address: addressToAlter,
        success: true
      } 
      console.log(JSON.stringify(file, null, 2));
      console.log('writing to ' + fileName);
      return addressAlteredResponse
    } catch (e) {
      console.error(e)
      return { 
        error: e, 
        success: false 
      }
    }
  }
}

module.exports = { ConfigsDAO: ConfigsDAO }

// init mongodb db.configs.createIndex({"id":1},{ unique: true })
