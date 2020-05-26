const { ApolloServer, gql } = require('apollo-server')
const { UsersDAO } = require('./UsersDAO.js')
const { ConfigsDAO } = require('./ConfigsDAO.js')

const typeDefs = gql`
  type User {
    email: String
    name: String
  }

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

  type Query {
    user(email: String!): User!
    listUser: [User]
    listConfig: [Config]
  }

  type Mutation {
    addUser(email: String, name: String): User
    updateUser(email: String, name: String): User
    deleteUser(email: String): String
    updateConfig: [Config]
    deleteConfig(id: String): String
  }
`

const resolvers = {
  Query: {
    user: UsersDAO.getUser,
    listUser: UsersDAO.listUser,
    listConfig: ConfigsDAO.listConfig
  },
  Mutation: {
    addUser: UsersDAO.addUser,
    updateUser: UsersDAO.updateUser,
    deleteUser: UsersDAO.deleteUser,
    updateConfig: ConfigsDAO.updateConfigs,
    deleteConfig: ConfigsDAO.deleteOneConfig,
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
