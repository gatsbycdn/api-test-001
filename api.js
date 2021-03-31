const { ApolloServer, gql } = require('apollo-server')
const { ConfigsDAO } = require('./ConfigsDAO.js')
const { MongoClient } = require('mongodb')

const typeDefs = gql`
  type Config {
    name: String
    address: String
    id: String
    ip: String
    ps: String
    type: String
    status: String
    proxied: Boolean
  }

  type EarthIp {
    cip: String
    cid: String
    cname: String
  }

  type DomesticIp {
    ip: String
    loc: String
    isp: String
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
    id: String
    result: CloudFlareResult
    success: Boolean
    errors: [AddDNSError]
  }

  type IpInfo {
    proxyIP: ProxyIp
    localIP: DomesticIp
    v2Address: String
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

  type StatusResult {
    success: Boolean
    error: String
  }

  type ProxyResult {
    success: Boolean
    error: String
  }

  type Query {
    listConfig: [Config]
    getConfig(ip: String): Config
    getEarthIp: EarthIp
    getAlienIp: AlienIp
    getItems: GetItems
    ipInfo: IpInfo
    findOneById(id: String): Config
  }

  type Mutation {
    updateConfig: [CloudFlareResult]
    deleteConfig(id: String): DeleteCommandResult
    removeDNSRecord(id: String): RemoveResponse
    addDNSRecord(ps: String, ip: String): Config
    alterAddress(address: String): AlterConfigAddress
    updateStatus: StatusResult
    updateStatusOne(address: String): StatusResult
    proxify(id: String, proxied: Boolean): Config
  }
`

const resolvers = {
  Query: {
    listConfig: ConfigsDAO.listConfig,
    getConfig: ConfigsDAO.getConfig,
    getAlienIp: ConfigsDAO.getAlienIp,
    getEarthIp: ConfigsDAO.getEarthIp,
    getItems: ConfigsDAO.getItems,
    ipInfo: ConfigsDAO.ipInfo,
    findOneById: ConfigsDAO.findOneById
  },
  Mutation: {
    updateConfig: ConfigsDAO.updateConfigs,
    deleteConfig: ConfigsDAO.deleteOneConfig,
    removeDNSRecord: ConfigsDAO.removeOneDNSRecord,
    addDNSRecord: ConfigsDAO.addDNSRecord,
    alterAddress: ConfigsDAO.alterOutbound,
    updateStatus: ConfigsDAO.updateStatus,
    updateStatusOne: ConfigsDAO.updateStatusOne,
    proxify: ConfigsDAO.proxify
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

const uri = process.env.LOCAL_DB_URI || 'mongodb://localhost:27017'
MongoClient.connect(
    uri,
        { useNewUrlParser: true, useUnifiedTopology: true },
        { poolSize: 50, w: 1, wtimeout: 2500 }
    )
    .catch(err => {
      console.error(err.stack)
      process.exit(1)
    })
    .then(async client => {
      await ConfigsDAO.injectDB(client)
      server.listen().then(({ url }) => {
      console.log(`🚀  Server ready at ${url}`)
    })
    })



