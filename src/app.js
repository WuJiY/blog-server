const Koa = require('koa')
const Helmet = require('koa-helmet')
const Cors = require('@koa/cors')
const BodyParser = require('koa-bodyparser')
const Logger = require('koa-logger')
const router = require('./routes')
const {
  connectDb,
  constans: { A_WEEK },
  config: { origin },
  serverLogger,
} = require('./utils')

connectDb()

const app = new Koa()

app.use(Helmet())
if (process.env.NODE_ENV === 'development') {
  app.use(Logger())
}
app.use(Cors({ credentials: true, origin, maxAge: A_WEEK / 1000 }))
app.use(BodyParser({ enableTypes: ['json'] }))

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500
    if (err.expose) {
      throw err
    } else {
      serverLogger.error(err)
    }
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

module.exports = app.callback()
