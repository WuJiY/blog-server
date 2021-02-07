const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const {
  signToken,
  clientLogger,
  constans: { PUBLIC_KEY, TEN_YEAR },
  config: { CLIENT_STATS_COOKIE },
} = require('../utils')

const router = new Router({ prefix: '/client' })

router.get('/', (ctx) => {
  if (ctx.cookies.get('client_stats')) {
    ctx.status = 204
    return
  }
  const token = signToken({}, TEN_YEAR)
  ctx.cookies.set('client_stats', token, CLIENT_STATS_COOKIE)
  ctx.status = 200
})

router.post('/error', Koajwt({ cookie: 'client_stats', secret: PUBLIC_KEY }), (ctx) => {
  const { err } = ctx.request.body
  clientLogger.error(err)
  ctx.status = 200
})

module.exports = router.routes()
