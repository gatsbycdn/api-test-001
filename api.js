const { ApolloServer, gql } = require('apollo-server')
const { ConfigsDAO } = require('./ConfigsDAO.js')

const typeDefs = gql`
  type Config {
    name: String
    address: String
    alterId: String
    id: String
    ip: String
    path: String
    ps: String
    type: String
    vid: String
    status: String
  }

  type EarthIp {
    cip: String
    cid: String
    cname: String
  }

  type AlienIp {
    ip: String
  }

  type ProxyIp {
    fl: String
    ip: String
    ts: String
    colo: String
    loc: String
  }

  type DeleteResult {
    n: Int
    ok: Int
  }

  type DeleteCommandResult {
    result: DeleteResult
    id: String
    deletedCount: Int
  }

  type RemoveErrors {
    code: Int
    message: String
  }

  type RemoveResult {
    id: String
  }

  type RemoveResponse {
    result: RemoveResult
    success: Boolean
    errors: [RemoveErrors]
    messages: [RemoveErrors]
  }

  type CloudFlareResult {
    id: String
    zone_id: String
    zone_name: String
    name: String
    type: String
    content: String
    proxiable: Boolean
    proxied: Boolean
    ttl: Int
    locked: Boolean
    created_on: String
    modified_on: String
  }

  type AddDNSError {
    code: Int
    message: String
  }

  type CloudFlareApi {
    result: CloudFlareResult
    success: Boolean
    errors: [AddDNSError]
  }

  type AllInOne {
    proxyIP: ProxyIp
    localIP: EarthIp
    config: Config
    configElse: [Config]
  }

  type GetItems {
    config: Config
    configElse: [Config]
  }

  type AlterConfigAddress {
    address: String
    success: Boolean
    error: String
  }

  type Query {
    listConfig: [Config]
    getConfig(ip: String): Config
    getEarthIp: EarthIp
    getAlienIp: AlienIp
    allInOne: AllInOne
    getItems: GetItems
  }

  type Mutation {
    updateConfig: [CloudFlareResult]
    deleteConfig(id: String): DeleteCommandResult
    removeDNSRecord(id: String): RemoveResponse
    addDNSRecord(ps: String, ip: String): CloudFlareApi
    alterAddress(address: String): AlterConfigAddress
  }
`

const resolvers = {
  Query: {
    listConfig: ConfigsDAO.listConfig,
    getConfig: ConfigsDAO.getConfig,
    getAlienIp: ConfigsDAO.getAlienIp,
    getEarthIp: ConfigsDAO.getEarthIp,
    allInOne: ConfigsDAO.allInOne,
    getItems: ConfigsDAO.getItems
  },
  Mutation: {
    updateConfig: ConfigsDAO.updateConfigs,
    deleteConfig: ConfigsDAO.deleteOneConfig,
    removeDNSRecord: ConfigsDAO.removeOneDNSRecord,
    addDNSRecord: ConfigsDAO.addDNSRecord,
    alterAddress: ConfigsDAO.alterOutbound
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})


