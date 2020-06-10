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
  }

  type EarthIp {
    cip: String
    cid: String
    cname: String
  }

  type AlienIp {
    ip: String
  }

  type Query {
    listConfig: [Config]
    getConfig(ip: String): Config
    getEarthIp: EarthIp
    getAlienIp: AlienIp
  }

  type Mutation {
    updateConfig: String
    deleteConfig(id: String): String
    removeDNSRecord(id: String): String
    addDNSRecord(ps: String, ip: String): String
  }
`

const resolvers = {
  Query: {
    listConfig: ConfigsDAO.listConfig,
    getConfig: ConfigsDAO.getConfig,
    getAlienIp: ConfigsDAO.getAlienIp,
    getEarthIp: ConfigsDAO.getEarthIp
  },
  Mutation: {
    updateConfig: ConfigsDAO.updateConfigs,
    deleteConfig: ConfigsDAO.deleteOneConfig,
    removeDNSRecord: ConfigsDAO.removeOneDNSRecord,
    addDNSRecord: ConfigsDAO.addDNSRecord
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
