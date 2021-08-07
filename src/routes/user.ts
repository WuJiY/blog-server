import Router from '@koa/router'
import { User } from '../db'
import { signToken, hash, verify, USER_TOKEN_OPTION, A_DAY } from '../utils'
import { errorText, successText } from '../utils/status-text'
import Captcha from '../middlewares/captcha'
import UserTokenAuth from '../middlewares/user-token-auth'

const router = new Router({ prefix: '/user' })

router.use(['/register', '/login'], Captcha)

router.post('/register', async (ctx) => {
  const { mail, name, pass } = ctx.request.body
  const exists = await User.findOne({ mail }).lean().exec()
  if (exists) {
    ctx.throw(401, errorText.USER_EXISTS)
  }
  const hashedPass = await hash(pass)
  const user = await User.create({ mail, name, pass: hashedPass })
  const token = await signToken({ id: user._id, role: user.role })
  ctx.cookies.set('user_token', token, USER_TOKEN_OPTION)
  ctx.status = 200
  ctx.body = { message: successText.REGISTER_SUCCESS }
})

router.post('/login', async (ctx) => {
  const { mail, pass } = ctx.request.body
  const user = await User.findOne({ mail }).lean().exec()
  if (user) {
    const passMatched = await verify(pass, user.pass)
    if (!passMatched) {
      ctx.throw(401, errorText.PASS_INVALID)
    }
    const token = await signToken({ id: user._id, role: user.role })
    ctx.cookies.set('user_token', token, USER_TOKEN_OPTION)
    ctx.status = 200
    ctx.body = { message: successText.LOGIN_SUCCESS }
  } else {
    ctx.throw(401, errorText.USER_NOT_EXISTS)
  }
})

router.get('/logout', (ctx) => {
  ctx.cookies.set('user_token', null, USER_TOKEN_OPTION)
  ctx.status = 200
  ctx.body = { message: successText.LOGOUT_SUCCESS }
})

router.get('/auth', UserTokenAuth, async (ctx) => {
  const { id, role, exp } = ctx.state.jwt
  const user = await User.findById(id).lean().select('name mail avatar createdAt role').exec()
  if (Date.now() - exp < A_DAY) {
    const token = await signToken({ id, role })
    ctx.cookies.set('user_token', token, USER_TOKEN_OPTION)
  }
  ctx.status = 200
  ctx.body = user
})

export default router.routes()
