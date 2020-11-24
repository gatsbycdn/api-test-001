require('dotenv').config()
const fetch = require('node-fetch')
const got = require('got')
const fs = require('fs')

let configs


class ConfigsDAO {

  static async injectDB(conn) {
    if (configs) {
      return
    }
    try {
      configs = await conn.db('test').collection('configs')
    } catch (error) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`)
    }
  }

  static async getAlienIp () {
    const apiURI = 'https://api.ipify.org'
    const alienIp = await fetch(apiURI, { method: 'GET' })
      .then(res => res.text())
      .then(res => ({ ip: res }))
    //console.log(alienIp)
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
      //console.log(jsonText)
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

  static async gotDomesticIp() {
    try {
      let ip, loc, isp
      const apiURI = 'https://myip.ipip.net'
      const options = {
          url: apiURI,
          //timeout: 1500,
          retry: 2,
          headers: {
              "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
              "accept-language": "en-US,en;q=0.9",
              "cache-control": "max-age=0",
              "upgrade-insecure-requests": "1",
              "cookie": "_ga=GA1.2.1315785073.1598451232; Hm_lvt_6b4a9140aed51e46402f36e099e37baf=1598620223; __cfduid=d900500f9854ad418ab049889f065d4881599618296; LOVEAPP_SESSID=f720979ec23bf9c34739b2ad8bf7215975820373; __jsluid_h=16534192e04843e5d69f39840df6b2a0"
          }
      }
      const response = await got(options)
      .then(res => res.body)
      .then(res => {
          ip = res.split(' ')[1].split('：')[1]
          loc = res.split(' ').slice(3,6).join('').split('：')[1]
          isp = res.split(' ')[7].replace('\n','')
          return({
              ip: ip,
              loc: loc,
              isp: isp
          })
      })
      return response
  } catch (error) {
      console.log(error)
  }}


  static async getConfig (_, arg) {
    try {
      const config = await configs.findOne({ ip: arg.ip })
      return config
    } catch (e) {
      console.error(e)
    }
  }

  static async listConfig () {
    try {
      const config = await configs.find({ type: 'A' }, { name: 1, content: 1 }).limit(50).toArray()
      return config
    } catch (e) {
      console.error(e)
    }
  }

  static async getV2Config () {
    try {
      const fileName = process.env.V2RAY_CONFIG_DIR || '/usr/local/etc/v2ray/config.json'
      const file = require(fileName)
      const v2Address = file.outbounds[0].settings.vnext[0].address
      //console.log(v2Address)
      return v2Address
    } catch (error) {
      console.error(e)
    }
  }

  static async getItems () {
    try {
      const v2Address = await ConfigsDAO.getV2Config()
      const config = await configs.findOne({ address: v2Address })
      const configAll= await configs.find({ type: 'A' }, { name: 1, content: 1 }).toArray()
      const configElse = configAll.filter(obj => obj.id!==config.id)
      const all = {
        config: config,
        configElse: configElse
      }
      //console.log(all)
      return all
    } catch (error) {
      console.log(error)
    }
  }

  static async deleteOneConfig (_, arg) {
    try {
      //console.log(arg)
      const deleteResult = await configs.deleteOne({ id: arg.id })
      const returnResult = {
        result: deleteResult.result,
        id: arg.id,
        deletedCount: deleteResult.deletedCount
      }
      //console.log(returnResult)
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
      //console.log(removeResult)

      return removeResult


    } catch (e) {
      console.error(e)
    }
  }

  static async updateConfigs () {
    try {
      //await configs.deleteMany({})
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
      //console.log(itemsArray)

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
      ////console.log(commandResult)
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
        .then(res => ({...res, id: res.result.id}))
        .then(res => {
          if (res.success) {
            configs.updateOne({ name: res.result.name }, { $set: {
              type: res.result.type,
              ip: res.result.content,
              vid: process.env.V2RAY_VID,
              alterId: '32',
              path: process.env.V2RAY_PATH,
              ps: res.result.name.split('.')[0],
              status: 'unknown'
            }, $setOnInsert: {
              id: res.id,
              address: res.result.name
            }}, { upsert: true }, function(err, result) {
              if (err) throw err;
              console.log(result.result)
           })
          }
        })
        .then(res => ({success: true}))
        /*.then(res => {
          console.log(res)
          console.log(typeof(res.result.created_on))
          res.success
        })*/
      //console.log(cloudFlareApiCallback)
      return cloudFlareApiCallback
    } catch (e) {
      console.error(e)
      return { error: e }
    }
  }
  
  static async ipInfo () {
    const proxyIP = await ConfigsDAO.getProxyIp()
    const localIP = await ConfigsDAO.gotDomesticIp()

    try {
      const v2Address = await ConfigsDAO.getV2Config()
      const all = {
        proxyIP: proxyIP,
        localIP: localIP,
        v2Address: v2Address
      }
      //console.log(all)
      return all
    } catch (e) {
      console.log(e)
      return null
    }
    
  }
  
  static async allInOne () {
    const proxyIP = await ConfigsDAO.getProxyIp()
    //const localIP = await ConfigsDAO.getEarthIp()
    const localIP = await ConfigsDAO.gotDomesticIp()

    try {
      const v2Address = await ConfigsDAO.getV2Config()
      const config = await configs.findOne({ address: v2Address })
      const configAll= await configs.find({ type: 'A' }, { name: 1, content: 1 }).toArray()
      const configElse = configAll.filter(obj => obj.id!==config.id)
      const all = {
        proxyIP: proxyIP,
        localIP: localIP,
        config: config,
        configElse: configElse
      }
      //console.log(all)
      return all

    } catch (e) {
      console.error(e)
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
      const fileName = process.env.V2RAY_CONFIG_DIR || '/usr/local/etc/v2ray/config.json';
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
      //console.log(JSON.stringify(file, null, 2));
      //console.log('writing to ' + fileName);
      return addressAlteredResponse
    } catch (e) {
      console.error(e)
      return { 
        error: e, 
        success: false 
      }
    }
  }

  static async tisu() {
    try {
      await fetch("https://tisu-api.speedtest.cn/api/v2/speedup/reopen?source=www", {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-csrf-token": "",
          "x-requested-with": "XMLHttpRequest",
          "cookie": "_ga=GA1.2.667675721.1596437884; UM_distinctid=173b31cec0445b-0ea8560860caa-3323765-e1000-173b31cec057e7; __gads=ID=b2cb1ff6d0ab990e:T=1597990683:S=ALNI_MbhF99yehzRL30K4KJNDIE1isxUdA; Hm_lvt_8decfd249e4c816635a72c825e27da1a=1597990684; _gid=GA1.2.1681173685.1598149396; remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6Ik15d2EwMkJMUXdTQ29RUThXd0QxMlE9PSIsInZhbHVlIjoiSEc2RWVpdkdFdXNQT1J2YmdKNXkwMHQzWGx3ODJUN1U3QmJVVWwrS3ludjZhWXNVQjRcL1d6YlwvU1hpN0NUS3ZCdGtoUHc1Y2YxMCtUSlJqXC8zRWw4YnNPMUUxK1NpRlBcL05jMExFRTFhUjQwPSIsIm1hYyI6IjgxMzI1NzFkYTQ3ZjVhMmUxMmE3N2EyYzk5NDdhN2EyZGRjOWZmZGY3OGNhYzhjNjhkNTIzODBkZDY5YzEwZGEifQ%3D%3D; Hm_lpvt_8decfd249e4c816635a72c825e27da1a=1598179700; laravel_token=eyJpdiI6ImpzUWVNWUFpVG5EQ2FPM2JsOWI3UUE9PSIsInZhbHVlIjoiZVFrTlR5c1wvNVVIQkorNFBpTkp4VnBGZEhqYW40dFBEUWtiTVRIVVwvcDNoSEl3Tk9aamxVblQ0RmFadDhaSFNqcCtIaVwvRTRGb0ZRU0l4ZzYzWU5cLytSZzg0MjRLV0Z6MlVxT3hJbkVsMTQwUkZjMElUYzNpblpDcUpZNktvZDkrMVA5dTZ0ak5lUXlMTGNkUGNSVWhYUUVlQnBKRlJXb0xOb2RibDY4RlFWWWlWQlVSemtrMHowN3pwYlpWcGhjZ25ONGM4cFhEeG1POEhPMERoM3A3NDNJS0hOdWsyY3dcL0F1eExGXC9HZFhZcVpxOXFVUUI0djhqSGttNU5FNTRzdmg1M1o3dUhEVDh0VTluaUV3bUdjT2c9PSIsIm1hYyI6ImZkMmNkODY2ODQwMDlhNmEyZmJhMGVkMWNlODhjNGU1ZmVkNjU3MmU5NWIwYWE3NTg0NTE2Y2Q4NWUyZmZlMWQifQ%3D%3D; speedtest_session=eyJpdiI6ImN4dU5Eb2J6em5Oc0tQNGxodjVRaVE9PSIsInZhbHVlIjoiOVV4VFdCVjVaT2c5cmxJbWhWRlNGc3B1QjNGek5na1RKd2JJTXFyQ2xlUTc0b0lvNytjYWFaQnB0UDQwYXJYUCIsIm1hYyI6IjQ5MDAwMjEwODg0NjU0MTg0MTdlOWQyMTE2MGY2NTgyYjk3YjNjYjAyNmE5NmI0Njg4YmVmNGFjMWM5MmQzZjAifQ%3D%3D"
        },
        "referrer": "https://www.speedtest.cn/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors"
      })
      .then(res => console.log(res))      
    } catch (error) {
      console.log(error)
      
    }
  }

  static async testGot (hostname) {
    try {
    const options = {
        url: "https://" + hostname,
        //timeout: 1500,
        retry: 2
    }
    const response = await got(options)
    //console.log(response.statusMessage)
    //console.log(response.statusCode)
    return response.statusCode
    } catch (error) {
    console.log(error.response)
    return error
    }
}

  static async getHostname () {
    try {
      const config = await configs.find({ type: 'A' }, { name: 1, _id: 0 }).limit(50).toArray()
      let newConfig = await config
      .filter( obj => isNaN(Number(obj['name'].slice(1,3))) === false )
      .map(dict => dict['name'])
      console.log(newConfig)
      return newConfig
    } catch (e) {
      console.error(e)
    }
  }

  static async updateStatus () {
    try {
      const hostNames = await Promise.all((await ConfigsDAO.getHostname()).map(
        async (hostname) => {
            console.log(hostname)
            let status = (await ConfigsDAO.testGot(hostname) === 200) ? 'online' : 'offline'
            console.log(status)
            configs.findOneAndUpdate({name:hostname},{$set:{status:status}})
            }
          )).then(res => res)
      console.log(hostNames)
      return {success: true}
    } catch (error) {
    console.log(error)
    return {error: error}
    }
  }
}

module.exports = { ConfigsDAO: ConfigsDAO }

// ConfigsDAO.getV2Config()
// init mongodb db.configs.createIndex({"id":1},{ unique: true })
