const Koa = require('koa')
const Helmet = require('koa-helmet')
const Cors = require('@koa/cors')
const BodyParser = require('koa-bodyparser')
const Logger = require('koa-logger')
const router = require('./routes')
const {
  connectDb,
  constans: { MAX_AGE },
  config: { origin },
  logger,
} = require('./utils')

connectDb()

const app = new Koa()

app.use(Helmet())
if (process.env.NODE_ENV === 'development') {
  app.use(Logger())
}
app.use(Cors({ credentials: true, origin, maxAge: MAX_AGE / 1000 }))
app.use(BodyParser({ enableTypes: ['json'] }))

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    if (!err.expose) {
      logger.error(new Date().toLocaleString('zh-CN', { hour12: false }), err)
    }
    if (err.status === 401) {
      err.message = '用户认证失败，请重新登录'
    } else if (err.status === 500) {
      err.message = '服务器错误'
    }
    ctx.status = err.statusCode || err.status || 500
    throw err
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

module.exports = app.callback()
