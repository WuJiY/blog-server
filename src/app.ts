import http2 from 'http2'
import https from 'https'
import fs from 'fs'
import Koa from 'koa'
import Helmet from 'koa-helmet'
import Cors from '@koa/cors'
import BodyParser from 'koa-bodyparser'
import Logger from 'koa-logger'
import router from './routes'
import { connectDb, CORS_ORIGIN, A_WEEK, SERVER_KEY_PATH, SERVER_CRT_PATH } from './utils'
import ErrorHanlder from './middlewares/error-handler'
import initWebSocketServer from './websocket'

connectDb()

const app = new Koa()

app.use(Helmet())

if (process.env.NODE_ENV === 'dev') {
  app.use(Logger())
}

app.use(Cors({ credentials: true, origin: CORS_ORIGIN, maxAge: A_WEEK / 1000 }))

app.use(BodyParser({ enableTypes: ['json'] }))

app.use(ErrorHanlder())

app.use(router.routes())
app.use(router.allowedMethods())

const serverOption = {
  key: fs.readFileSync(SERVER_KEY_PATH),
  cert: fs.readFileSync(SERVER_CRT_PATH),
}

const serverPort = process.env.NODE_ENV === 'dev' ? 3000 : 3001
const wsPort = process.env.NODE_ENV === 'dev' ? 4000 : 4001

http2
  .createSecureServer(serverOption, app.callback())
  .listen(serverPort, () => console.log('[Server] Server running at https://localhost:3000'))

initWebSocketServer(https.createServer(serverOption).listen(wsPort))
