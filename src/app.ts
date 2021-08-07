import http2 from 'http2'
import fs from 'fs'
import Koa from 'koa'
import Helmet from 'koa-helmet'
import Cors from '@koa/cors'
import BodyParser from 'koa-bodyparser'
import Logger from 'koa-logger'
import mongoose from 'mongoose'
import router from './routes'
import { CORS_ORIGIN, A_WEEK, SERVER_KEY_PATH, SERVER_CRT_PATH, dbConfig } from './utils'
import ErrorHanlder from './middlewares/error-handler'

/**
 * 连接数据库
 */
async function connectDb() {
  const dbNameMap: Record<string, string> = {
    prod: 'blog',
    dev: 'blog-dev',
    test: 'blog-test'
  }
  const dbName = dbNameMap[process.env.NODE_ENV ?? 'prod']
  const dbPath = `mongodb://localhost/${dbName}`
  try {
    await mongoose.connect(dbPath, {
      user: dbConfig.user,
      pass: dbConfig.pass,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
      useFindAndModify: false
    })
    console.log(`[mongodb] ${dbPath} connect successfully`)
  } catch (err) {
    throw err
  }
}

/**
 * 启动服务
 */
function startServer() {
  return new Promise<void>((resolve, reject) => {
    try {
      const app = new Koa()

      app.use(Helmet())

      app.use(Logger())

      app.use(Cors({ credentials: true, origin: CORS_ORIGIN, maxAge: A_WEEK / 1000 }))

      app.use(BodyParser({ enableTypes: ['json'] }))

      app.use(ErrorHanlder())

      app.use(router.routes())
      app.use(router.allowedMethods())

      const serverOption = {
        key: fs.readFileSync(SERVER_KEY_PATH),
        cert: fs.readFileSync(SERVER_CRT_PATH)
      }

      const server = http2.createSecureServer(serverOption, app.callback())

      server.listen(process.env.PORT)
      console.log(`[config] NODE_ENV: ${process.env.NODE_ENV} PORT: ${process.env.PORT}`)
      console.log(`[server] server running at https://localhost:${process.env.PORT}`)

      return resolve()
    } catch (err) {
      return reject(err)
    }
  })
}

Promise.all([connectDb(), startServer()]).then(
  () => {
    return process.send?.('ready')
  },
  (err) => {
    console.error(err)
    return process.exit(1)
  }
)
