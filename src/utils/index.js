const { readFileSync, createWriteStream } = require('fs')
const { join } = require('path')
const mongoose = require('mongoose')
const { genSalt, hash } = require('bcrypt')
const jwt = require('jsonwebtoken')
const chunk = require('lodash/chunk')
const auth = require('../../assets/auth.json')

const errorlogout = createWriteStream(join(__dirname, '../../server.log'), { flags: 'a' })
const logger = new console.Console(process.stdout, errorlogout)
logger.error = logger.error.bind(null, new Date().toLocaleString('zh-CN', { hour12: false }))

const constans = {
  //       UTC+8      7 days
  MAX_AGE: 28800000 + 604800000,
  PUBLIC_KEY: readFileSync(join(__dirname, '../../assets/public.pem')),
  PRIVATE_KEY: readFileSync(join(__dirname, '../../assets/private.pem')),
}

const config = {
  userTokenCookie: {
    maxAge: constans.MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  },
  userExpCookie: {
    maxAge: constans.MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  },
  origin: process.env.NODE_ENV === 'production' ? 'https://apasser.xyz' : undefined,
}

/**
 * 连接数据库
 */
async function connectDb() {
  const dbName = process.env.NODE_ENV === 'test' ? 'blog-test' : 'blog'
  try {
    await mongoose.connect(`mongodb://localhost/${dbName}`, {
      user: auth.user,
      pass: auth.pass,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
      useFindAndModify: false,
    })
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
  const token = jwt.sign(payload, constans.PRIVATE_KEY, {
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

/**
 * 处理排序查询
 * @param {object[]} arr 由对象组成的数组
 * @param {string} key 元素对象属性
 * @param {string} order 升序或降序('asc' | 'desc')，默认降序
 * @returns 有key：原地排序无返回值；无key：无操作
 */
function sortByKeyOrder(arr, key, order) {
  if (!key) {
    return
  }
  let flag = 1
  if (order === 'asc') {
    flag = -1
  }
  arr.sort((a, b) => {
    if (a[key] < b[key]) {
      return flag
    }
    if (a[key] > b[key]) {
      return -flag
    }
    return 0
  })
}

/**
 * 处理分页查询，返回特定页
 * @param {any[]} arr 任意数组
 * @param {string} page 页码
 * @param {string} limit 每页元素个数，默认10
 * @returns {[] | any[]} 有page：可分页则返回指定页数组，不可分页或page < 1返回空数组；无page：返回原数组
 */
function pageOne(arr, page, limit = '10') {
  if (!page) {
    return arr
  }
  const paged = chunk(arr, parseInt(limit, 10))
  return paged[parseInt(page, 10) - 1] ?? []
}

/**
 * @param {any[]} arr 任意数组
 * @param {string} limit 每页元素个数，默认10
 */
function pageAll(arr, limit = '10') {
  return chunk(arr, parseInt(limit, 10))
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
  sortByKeyOrder,
  pageOne,
  pageAll,
}
