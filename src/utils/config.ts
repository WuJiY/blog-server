import path from 'path'

const cwd = process.cwd()

export const A_WEEK = 604800000

export const A_DAY = 86400000

export const USER_TOKEN_COOKIE: { maxAge: 604800000; sameSite: 'none' } = {
  maxAge: A_WEEK,
  sameSite: 'none',
}

export const CORS_ORIGIN = process.env.NODE_ENV === 'prod' ? 'https://apasser.xyz' : undefined

export const SERVER_KEY_PATH = path.join(cwd, '/assets/api.apasser.xyz.key')

export const SERVER_CRT_PATH = path.join(cwd, '/assets/api.apasser.xyz.crt')

export const PRIVATE_KEY_PATH = path.join(cwd, '/assets/private.pem')

export const PUBLIC_KEY_PATH = path.join(cwd, '/assets/public.pem')
