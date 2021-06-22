import type { ParameterizedContext, Next } from 'koa'
import { createLogger } from '../utils'

// https://github.com/jshttp/http-errors
interface HttpError {
  expose: boolean
  message: string
  statusCode: number
  status: number
  headers?: Record<string, string>
  [customProperties: string]: any
}

export default function ErrorHanlder() {
  const serverErrorLogger = createLogger('server_error')
  return async (ctx: ParameterizedContext, next: Next) => {
    try {
      await next()
    } catch (err) {
      const { expose, statusCode, status } = <HttpError>err
      ctx.status = statusCode ?? status ?? 500
      if (expose) {
        throw err
      }
      serverErrorLogger.error(err)
    }
  }
}
