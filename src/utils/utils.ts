import fsp from 'fs/promises'
import fs from 'fs'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PRIVATE_KEY_PATH, PUBLIC_KEY_PATH, dbConfig } from './config'

/**
 * 连接数据库，失败则退出进程
 */
export async function connectDb() {
  let dbName = 'blog-dev'
  switch (process.env.NODE_ENV) {
    case 'dev':
      dbName = 'blog-dev'
      break
    case 'prod':
      dbName = 'blog'
      break
    case 'test':
      dbName = 'blog-test'
      break
    default:
      dbName = 'blog-dev'
  }
  try {
    await mongoose.connect(`mongodb://${dbConfig.ip}/${dbName}`, {
      user: dbConfig.user,
      pass: dbConfig.pass,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
      useFindAndModify: false,
    })
    console.log(`[Db] mongodb connect successfully`)
  } catch (err) {
    process.exitCode = 1
    throw err
  }
}

/**
 * 文本加密
 * @param rounds 默认为10
 */
export async function hash(data: string, rounds = 10) {
  const hash = await bcrypt.hash(data, rounds)
  return hash
}

/**
 * 文本验证
 */
export async function verify(data: string, hash: string) {
  const result = await bcrypt.compare(data, hash)
  return result
}

export async function signToken(payload: object, expiresIn = '7d') {
  const privateKey = await fsp.readFile(PRIVATE_KEY_PATH)
  const token = jwt.sign({ iat: Date.now(), ...payload }, privateKey, {
    algorithm: 'RS256',
    expiresIn,
    noTimestamp: true,
  })
  return token
}

export function verifyToken(token: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(PUBLIC_KEY_PATH, (err, key) => {
      if (err) {
        return reject(err)
      }
      jwt.verify(token, key, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err || !decoded) {
          return reject(err)
        }
        resolve(decoded)
      })
    })
  })
}

export function getToken(name: string, cookie: string | undefined) {
  if (!cookie) {
    return null
  }
  for (let i = 0, cookies = cookie.split(';'); i < cookies.length; i++) {
    const [key, value] = cookies[i].split('=')
    if (key === name) {
      return value
    }
  }
  return null
}

/**
 * 处理排序查询
 * @param arr 对象数组
 * @param key 对象属性，对应值应为```number```或```string```
 * @param order 顺序，默认为```desc```
 * @returns 原地排序无返回值
 */
export function sortQuery(
  arr: Record<string, any>[],
  key?: string,
  order: 'asc' | 'desc' = 'desc'
) {
  if (!arr.length || !key) {
    return
  }
  const allowValues = ['number', 'string']
  if (!allowValues.includes(typeof arr[0][key])) {
    return
  }
  let flag = -1
  if (order === 'asc') {
    flag = 1
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
 * 处理分页查询
 * @param limit 默认为'10'
 */
export function pageQuery(arr: Record<string, any>[], page: string, limit = '10') {
  const _page = Number.parseInt(page, 10)
  const _limit = Number.parseInt(limit, 10)
  const start = (_page - 1) * _limit
  const end = start + _limit
  const result = []
  for (let i = start; i < end; i++) {
    const value = arr[i]
    if (value !== undefined && value !== null) {
      result.push(value)
    }
  }
  return result
}

export function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every((val) => typeof val === 'string')
}
