const { readFileSync, createWriteStream } = require('fs')
const { join } = require('path')
const mongoose = require('mongoose')
const { genSalt, hash } = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require('../../assets/auth.json')

// eslint-disable-next-line operator-linebreak
const errorlogout =
  process.env.NODE_ENV === 'development'
    ? process.stderr
    : createWriteStream(join(__dirname, '../../server.log'), { flags: 'a' })
const logger = new console.Console(process.stdout, errorlogout)

const constans = {
  //       UTC+8      7 days
  MAX_AGE: 28800000 + 604800000,
}

const config = {
  userTokenCookie: {
    maxAge: constans.MAX_AGE,
  },
  userExpCookie: {
    maxAge: constans.MAX_AGE,
    httpOnly: false,
  },
}

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
    logger.error(new Date(), e)
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
  const token = jwt.sign(payload, key, {
    algorithm: 'RS256',
    expiresIn: constans.MAX_AGE - 28800000,
  })
  return token
}

/**
 * 用于koa-jwt选项
 * @param {object} ctx
 */
function getToken(ctx) {
  const userToken = ctx.cookies.get('user_token')
  if (!userToken) {
    return null
  }
  return userToken
}

module.exports = {
  constans,
  config,
  logger,
  connectDb,
  hashPassword,
  verifyPassword,
  signToken,
  getToken,
  readFileSync,
  join,
}
