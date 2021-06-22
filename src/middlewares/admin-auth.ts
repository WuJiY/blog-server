import type { ParameterizedContext, Next } from 'koa'

export default async function AdminAuth(ctx: ParameterizedContext, next: Next) {
  if (ctx.state.jwt?.role !== 'admin') {
    ctx.throw(401)
  }
  return next()
}
