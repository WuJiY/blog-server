const { readFileSync } = require('fs')
const { join } = require('path')
const mongoose = require('mongoose')
const { genSalt, hash } = require('bcrypt')
const jwt = require('jsonwebtoken')

const auth = require('../../assets/auth.json')

/**
 * 连接数据库
 */
async function connectDb() {
  try {
    await mongoose.connect('mongodb://localhost/blog', {
      user: auth.user,
      pass: auth.pass,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
    })
    console.log('Successfully connected to mongoDb')
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

/**
 * 密码哈希
 * @param {string} pass 密码
 */
async function hashPassword(pass) {
  const result = {}
  result.salt = await genSalt(12)
  result.pass = await hash(pass, result.salt)
  return result
}

/**
 * 签发jwt
 * @param {object} payload 负载对象
 */
function signToken(payload) {
  const key = readFileSync(join(__dirname, '../../assets/private.pem'))
  const token = jwt.sign(payload, key, { algorithm: 'RS256', expiresIn: 300 })
  return token
}

module.exports = {
  connectDb,
  hashPassword,
  signToken,
}
