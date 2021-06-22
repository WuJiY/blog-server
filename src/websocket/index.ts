import type { Server } from 'https'
import type { IncomingMessage } from 'http'
import type { Socket } from 'net'
import WS from 'ws'
import { createLogger, getToken, verifyToken } from '../utils'
import type { Logger } from '../utils'
import { User } from '../db'

interface Payload {
  id: string
  role: 'normal' | 'admin'
}

class WSSWrapper {
  public wss: WS.Server
  private logger: Logger

  constructor(server: Server) {
    this.wss = new WS.Server({ noServer: true })
    this.logger = createLogger('ws_server_error')

    server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const token = getToken('user_token', request.headers.cookie)
      if (!token) {
        socket.destroy()
        return
      }
      verifyToken(token).then(
        (decoded) => {
          const { id, role } = <Payload>decoded
          this.wss.handleUpgrade(request, socket, head, (ws, request) => {
            this.wss.emit('connection', ws, request, { id, role })
            if (process.env.NODE_ENV === 'dev') {
              console.log(
                `[WSS] connect from user ${id}, current connections ${this.wss.clients.size}`
              )
            }
          })
        },
        () => {
          socket.destroy()
        }
      )
    })

    const address = server.address()
    if (address && typeof address !== 'string') {
      console.log(`[WSS] websocket server listening at wss://localhost:${address.port}`)
    }

    this.wss.on('close', function () {
      this.removeAllListeners()
      console.log('[WSS] websocket server closed')
    })

    this.wss.on('error', (err) => {
      this.logger.error(err)
    })
  }
}

export default function initWebSocketServer(server: Server) {
  // 单例
  const wssWrapper = new WSSWrapper(server)

  wssWrapper.wss.on('connection', function (ws, request, ...args: [Payload]) {
    const payload = args[0]

    // TODO:用户登出

    // 广播某用户上线，当多个页面登录同一个用户，需要前端状态更新时忽略自身
    this.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(JSON.stringify({ type: 'user_online', id: payload.id }))
      }
    })

    const intervalId = setInterval(() => {
      ws.ping()
    }, 60000)

    ws.on('close', () => {
      clearInterval(intervalId)

      User.findByIdAndUpdate(payload.id, { lastActiveAt: new Date().toISOString() }, (err, doc) => {
        if (err || !doc) {
          return
        }
        doc.save()
      })

      // 广播某用户离线，当多个页面登录同一个用户，需要前端状态更新时忽略自身
      this.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({ type: 'user_offline', id: payload.id }))
        }
      })
    })
  })

  return wssWrapper
}
