import fs from 'fs'
import path from 'path'

type LoggerTypes = 'server_error' | 'client_error' | 'ws_server_error'

export class Logger {
  private console: Console

  constructor(type: LoggerTypes) {
    const logPath = path.join(process.cwd(), `/log/${type}.log`)
    // 确保文件存在
    fs.appendFileSync(logPath, '')
    const errOut = fs.createWriteStream(logPath, { flags: 'a' })
    errOut.once('ready', () => console.log(`[Logger] ${type} log wirte stream is ready`))
    this.console = new console.Console(process.stdout, errOut)
  }

  error(err: any) {
    this.console.error(new Date().toLocaleString('zh-CN', { hourCycle: 'h23' }), err)
  }
}

export function createLogger(type: LoggerTypes) {
  return new Logger(type)
}
