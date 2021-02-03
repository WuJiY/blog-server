const Router = require('@koa/router')
const { User } = require('../db')
const {
  hashPassword,
  verifyPassword,
  signToken,
  config: { userTokenCookie },
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
  ctx.status = 200
  ctx.body = { message: '注册成功' }
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
  ctx.status = 200
  ctx.body = { message: '登录成功' }
})

router.get('/logout', (ctx) => {
  ctx.cookies.set('user_token', null, userTokenCookie)
  ctx.status = 200
})

module.exports = router.routes()
