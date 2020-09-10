const fetch = require('node-fetch')
const got = require('got')
const tunnel = require('tunnel')
let ip, loc, isp

async function gotJson() {
    try {
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
    }
}

async function getJson() {
    try {
        const apiURI = 'https://myip.ipip.net'
        const jsonText = await fetch(apiURI, {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "max-age=0",
                "upgrade-insecure-requests": "1",
                "cookie": "_ga=GA1.2.1315785073.1598451232; Hm_lvt_6b4a9140aed51e46402f36e099e37baf=1598620223; __cfduid=d900500f9854ad418ab049889f065d4881599618296; LOVEAPP_SESSID=f720979ec23bf9c34739b2ad8bf7215975820373; __jsluid_h=16534192e04843e5d69f39840df6b2a0"
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors"
        })
        .then(res => res.text())
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
        return jsonText
    } catch (error) {
        console.log(error)
    }
}
//

async function gotIpApi() {
    try {
        const tunnelingAgent = tunnel.httpOverHttp({
            proxy: {
                host: '192.168.10.2',
                port: 10808,
                proxyAuth: 'proxy:proxy'
            }
        })
        const api = 'http://ip-api.com/json/'
        //const api = 'http://api.ipstack.com/'
        //const api = 'http://baidu.com'
        //const apiKey = '3b46de7c1dc616e6dce491c65bdab606'
        const options = {
            url: api, // + 'check?access_key=' + apiKey,
            retry: 2,
            agent: {
                http: tunnelingAgent
            }
        }
        const jsonText = await got(options)
        .then(res => res.body)
        .then(res => JSON.parse(res))
        return jsonText
    } catch (error) {
        console.log(error)
    }
}
async function ipApi() {
    try {
        const api = 'http://ip-api.com/json/'
        const jsonText = await fetch(api,{method:"GET"})
        .then(res => res.text())
        .then(res => JSON.parse(res))
        return jsonText
    } catch (error) {
        console.log(error)
    }
}

//const a = gotJson()
//    .then(res => console.log(res))
const b = gotIpApi()
.then(res => console.log(res))

