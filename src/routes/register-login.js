const Router = require('@koa/router')
const tencentcloud = require('tencentcloud-sdk-nodejs')
const { User } = require('../db')
const {
  hashPassword,
  verifyPassword,
  signToken,
  config: { userTokenCookie },
} = require('../utils')
const tencentCert = require('../../assets/tencent-credential.json')

const router = new Router()

router.post(
  '/register',
  async (ctx, next) => {
    if (process.env.NODE_ENV === 'test') {
      ctx.state.register = ctx.request.body.register
      return next()
    }
    const CaptchaClient = tencentcloud.captcha.v20190722.Client
    const client = new CaptchaClient({
      credential: tencentCert.credential,
      region: '',
      profile: { httpProfile: { endpoint: 'captcha.tencentcloudapi.com' } },
    })
    const { Ticket, Randstr } = ctx.request.body
    const res = await client.DescribeCaptchaResult({
      CaptchaType: 9,
      UserIp: ctx.ip,
      Ticket,
      Randstr,
      ...tencentCert.captcha,
    })
    if (res.CaptchaCode !== 1) {
      ctx.throw(403, '验证码校验失败')
    }
    ctx.state.register = ctx.request.body.register
    return next()
  },
  async (ctx) => {
    const { mail, name, pass } = ctx.state.register
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
  }
)

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
