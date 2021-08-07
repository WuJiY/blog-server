import type Koa from 'koa'

declare module 'koa' {
  interface Request {
    body?: any
    rawBody: string
  }
  return Koa
}
