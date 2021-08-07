import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken'
import { PRIVATE_KEY_PATH, PUBLIC_KEY_PATH } from './config'

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

/**
 * token签发
 * @param expiresIn 默认7天
 */
export function signToken(payload: object, expiresIn = '7d') {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(PRIVATE_KEY_PATH, (err, key) => {
      if (err) {
        return reject(err)
      }
      jwt.sign(
        { iat: Date.now(), ...payload },
        key,
        { algorithm: 'RS256', expiresIn, noTimestamp: true },
        (err, token) => {
          if (err || !token) {
            return reject(err)
          }
          return resolve(token)
        }
      )
    })
  })
}

/**
 * token验证
 */
export function verifyToken(token: string) {
  return new Promise<JwtPayload>((resolve, reject) => {
    fs.readFile(PUBLIC_KEY_PATH, (err, key) => {
      if (err) {
        return reject(err)
      }
      jwt.verify(token, key, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err || !decoded) {
          return reject(err)
        }
        return resolve(decoded)
      })
    })
  })
}

/**
 * 从cookie中取值
 */
export function getCookieValue(name: string, cookie: string) {
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
