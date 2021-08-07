import path from 'path'
import fs from 'fs'
import type { TencentCret, DbConfig } from '../typings'

function getPath(relativePath: string) {
  return path.join(process.cwd(), relativePath)
}

export const A_WEEK = 604800000

export const A_DAY = 86400000

export const USER_TOKEN_OPTION = {
  maxAge: A_WEEK,
  sameSite: <'none'>'none'
}

export const CORS_ORIGIN = process.env.NODE_ENV === 'prod' ? 'https://apasser.xyz' : undefined

export const SERVER_KEY_PATH = getPath('/assets/api.apasser.xyz.key')

export const SERVER_CRT_PATH = getPath('/assets/api.apasser.xyz.crt')

export const PRIVATE_KEY_PATH = getPath('/assets/private.pem')

export const PUBLIC_KEY_PATH = getPath('/assets/public.pem')

export const dbConfig: DbConfig = JSON.parse(fs.readFileSync(getPath('/assets/auth.json'), 'utf8'))

export const tencentCret: TencentCret = JSON.parse(
  fs.readFileSync(getPath('assets/tencent-credential.json'), 'utf8')
)
