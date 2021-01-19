const Koa = require('koa')
const Helmet = require('koa-helmet')
const Cors = require('@koa/cors')
const BodyParser = require('koa-bodyparser')
const Logger = require('koa-logger')
const router = require('./routes')
const { connectDb } = require('./utils')

connectDb()

const app = new Koa()

app.use(Helmet())
app.use(Logger())
app.use(
  Cors({
    credentials: true,
  })
)
app.use(BodyParser())

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000)
