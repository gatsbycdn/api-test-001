const { MongoClient } = require('mongodb')


class UsersDAO {
  static getDb () {
    const url = 'mongodb://localhost:27017'
    const client = new MongoClient(
      url,
      { useNewUrlParser: true },
      { poolSize: 50, w: 1, wtimeout: 2500 }
    )
    return client
  }

  static async getUser (_, arg) {
    try {
      const conn = await UsersDAO.getDb().connect()
      const users = await conn.db('test').collection('users')
      const user = await users.findOne({ email: arg.email })
      console.log(user)
      return user
    } catch (e) {
      console.error(e)
    }
  }

  static async listUser () {
    try {
      const conn = await UsersDAO.getDb().connect()
      const users = await conn.db('test').collection('users')
      // const myString = await users.find({}, {email:1}).toArray();
      const user = await users.find({}).toArray()
      return user
    } catch (e) {
      console.error(e)
    }
  }

  static async addUser (_, arg) {
    try {
      const conn = await UsersDAO.getDb().connect()
      const users = await conn.db('test').collection('users')
      console.log(arg)
      const result = await users.insertOne(arg)
      const savedUser = await conn.db('test').collection('users')
        .findOne({ _id: result.insertedId })
      return savedUser
    } catch (e) {
      console.error(e)
    }
  }

  static async updateUser (_, arg) {
    try {
      const conn = await UsersDAO.getDb().connect()
      const users = await conn.db('test').collection('users')
      console.log(arg)
      await users.updateOne({ email: arg.email },
        { $set: arg }, { upsert: true })
      const updaedUser = await conn.db('test').collection('users')
        .findOne(arg)
      return updaedUser
    } catch (e) {
      console.error(e)
    }
  }

  static async deleteUser (_, arg) {
    try {
      const conn = await UsersDAO.getDb().connect()
      const users = await conn.db('test').collection('users')
      await users.deleteOne({ email: arg.email })
      // console.log(result)
      return 'removed'
    } catch (e) {
      console.error(e)
    }
  }
}

module.exports = { UsersDAO: UsersDAO }
