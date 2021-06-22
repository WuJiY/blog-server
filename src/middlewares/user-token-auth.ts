import fs from 'fs'
import Koajwt from 'koa-jwt'
import { PUBLIC_KEY_PATH } from '../utils'

const secret = fs.readFileSync(PUBLIC_KEY_PATH)

export default Koajwt({ cookie: 'user_token', key: 'jwt', secret })
