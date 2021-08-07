import type { ParameterizedContext, Next } from 'koa'

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
  return async (ctx: ParameterizedContext, next: Next) => {
    try {
      await next()
    } catch (err) {
      const { expose, statusCode, status } = <HttpError>err
      ctx.status = statusCode ?? status ?? 500
      if (expose) {
        throw err
      }
      console.error(err)
    }
  }
}
