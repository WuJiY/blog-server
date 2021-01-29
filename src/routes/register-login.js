const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { User } = require('../db')
const {
  hashPassword,
  verifyPassword,
  signToken,
  getToken,
  constans: { PUBLIC_KEY },
  config: { userTokenCookie, userExpCookie },
} = require('../utils')

const router = new Router()

router.post('/register', async (ctx) => {
  const { mail, name, pass } = ctx.request.body
  const exits = await User.findOne({ mail }).exec()
  if (exits) {
    ctx.throw(400, '用户已存在')
  }
  const hashed = await hashPassword(pass)
  const user = await User.create({ mail, name, salt: hashed.salt, pass: hashed.pass })
  //                        改为字符串版本
  const token = signToken({ id: user.id, role: user.role })
  ctx.cookies.set('user_token', token, userTokenCookie)
  ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
  ctx.status = 200
  ctx.body = { message: '注册成功' }
})

// token验证，续期
router.get('/login', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { id, role } = ctx.state.user
  const token = signToken({ id, role })
  ctx.cookies.set('user_token', token, userTokenCookie)
  ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
  ctx.status = 200
})

router.post('/login', async (ctx) => {
  const { mail, pass } = ctx.request.body
  const user = await User.findOne({ mail }).exec()
  if (!user) {
    ctx.throw(400, '用户不存在')
  }
  const hashedPass = await verifyPassword(pass, user.salt)
  if (user.pass !== hashedPass) {
    ctx.throw(400, '密码错误')
  }
  const token = signToken({ id: user._id, role: user.role })
  ctx.cookies.set('user_token', token, userTokenCookie)
  ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
  ctx.status = 200
  ctx.body = { message: '登录成功' }
})

router.get('/logout', (ctx) => {
  ctx.cookies.set('user_token')
  ctx.cookies.set('user_exp')
  ctx.status = 200
})

module.exports = router.routes()
