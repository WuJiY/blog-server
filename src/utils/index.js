const { readFileSync, createWriteStream } = require('fs')
const { join } = require('path')
const mongoose = require('mongoose')
const { genSalt, hash } = require('bcrypt')
const jwt = require('jsonwebtoken')

const auth = require('../../assets/auth.json')

const out = createWriteStream(join(__dirname, '../../server.log'), { flags: 'a' })
const logger = new console.Console(process.stdout, out)

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
    logger.log('Successfully connected to mongoDb')
  } catch (e) {
    logger.error(e)
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
 * 验证密码
 * @param {string} pass 用户输入的密码
 * @param {string} salt 用户文档保存的盐
 */
async function verifyPassword(pass, salt) {
  const hashed = await hash(pass, salt)
  return hashed
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

const constans = {
  MAX_AGE: 28800000 + 300000,
}

const config = {
  userTokenCookie: {
    maxAge: constans.MAX_AGE,
    // 默认为false但设置了Keygrip时会变为true
    signed: false,
  },
  userIdCookie: {
    maxAge: constans.MAX_AGE,
    httpOnly: false,
    signed: true,
  },
}

module.exports = {
  connectDb,
  hashPassword,
  verifyPassword,
  signToken,
  constans,
  config,
  auth,
  logger,
}
