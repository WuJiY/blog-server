const Koa = require('koa')
const Helmet = require('koa-helmet')
const Cors = require('@koa/cors')
const BodyParser = require('koa-bodyparser')
const Logger = require('koa-logger')
const router = require('./routes')
const {
  connectDb,
  constans: { MAX_AGE },
  config: { origin, port },
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
      logger.error(err)
    }
    if (err.status === 401) {
      err.message = '用户认证失败，请重新登录'
    } else if (err.status === 500) {
      err.message = '服务器错误'
    }
    ctx.status = err.status
    throw err
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

// 应该导出app.listen()返回的Server对象，而不是app本身
module.exports = app.listen(port)
