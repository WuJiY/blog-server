const { readFileSync, createWriteStream } = require('fs')
const { join } = require('path')
const mongoose = require('mongoose')
const { genSalt, hash } = require('bcrypt')
const jwt = require('jsonwebtoken')
const chunk = require('lodash/chunk')
const auth = require('../../assets/auth.json')

function createServerLogger() {
  const serverStatsWS = createWriteStream(join(__dirname, '../../server-stats.log'), { flags: 'a' })
  const serverErrorWS = createWriteStream(join(__dirname, '../../server-error.log'), { flags: 'a' })
  const serverLogger = new console.Console(serverStatsWS, serverErrorWS)
  serverLogger.log = serverLogger.log.bind(
    null,
    new Date().toLocaleString('zh-Hans-CN', { hourCycle: 'h23' })
  )
  serverLogger.error = serverLogger.error.bind(
    null,
    new Date().toLocaleString('zh-Hans-CN', { hourCycle: 'h23' })
  )
  return serverLogger
}

function createClientLogger() {
  const clientStatsWS = createWriteStream(join(__dirname, '../../client-stats.log'), { flags: 'a' })
  const clientErrorWS = createWriteStream(join(__dirname, '../../client-error.log'), { flags: 'a' })
  const clientLogger = new console.Console(clientStatsWS, clientErrorWS)
  clientLogger.log = clientLogger.log.bind(
    null,
    new Date().toLocaleString('zh-Hans-CN', { hourCycle: 'h23' })
  )
  clientLogger.error = clientLogger.error.bind(
    null,
    new Date().toLocaleString('zh-Hans-CN', { hourCycle: 'h23' })
  )
  return clientLogger
}

const constans = {
  A_WEEK: 604800000,
  TEN_YEAR: 31536000000,
  PUBLIC_KEY: readFileSync(join(__dirname, '../../assets/public.pem')),
  PRIVATE_KEY: readFileSync(join(__dirname, '../../assets/private.pem')),
}

const config = {
  USER_TOKEN_COOKIE: {
    maxAge: constans.A_WEEK,
    sameSite: 'none',
  },
  CLIENT_STATS_COOKIE: {
    maxAge: constans.TEN_YEAR,
    sameSite: 'none',
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
  } catch (err) {
    console.error(err)
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
 * @param {number} expiresIn 默认7天，单位毫秒
 */
function signToken(payload, expiresIn = constans.A_WEEK) {
  const token = jwt.sign({ iat: Date.now(), ...payload }, constans.PRIVATE_KEY, {
    expiresIn,
    algorithm: 'RS256',
    noTimestamp: true,
  })
  return token
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
  serverLogger: createServerLogger(),
  clientLogger: createClientLogger(),
  connectDb,
  hashPassword,
  verifyPassword,
  signToken,
  sortByKeyOrder,
  pageOne,
  pageAll,
}
