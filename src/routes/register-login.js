const { readFileSync } = require('fs')
const { join } = require('path')
const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const Keygrip = require('keygrip')
const { IdCount, User } = require('../db')
const {
  hashPassword,
  verifyPassword,
  signToken,
  config: { userTokenCookie, userIdCookie },
  auth,
  logger,
} = require('../utils')

const router = new Router()

// ctx.cookies默认没有Keygrip对象
router.use((ctx, next) => {
  ctx.cookies.keys = new Keygrip([auth.pass])
  return next()
})

router.post('/register', async (ctx) => {
  const { mail, name, pass } = ctx.request.body
  // todo:验证
  if (!mail || !name || !pass) {
    ctx.status = 403
    return
  }
  try {
    const [user, idCount, hashed] = await Promise.all([
      User.findOne({ mail }),
      IdCount.findById('users'),
      hashPassword(pass),
    ])
    if (user) {
      ctx.status = 400
      return
    }
    const token = signToken({ id: idCount.value })
    ctx.cookies.set('user_token', token, userTokenCookie)
    ctx.cookies.set('user_id', String(idCount.value), userIdCookie)
    ctx.status = 200
    User.create({
      _id: idCount.value,
      mail,
      name,
      salt: hashed.salt,
      pass: hashed.pass,
    })
    idCount.incr()
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

// 验证,刷新token
router.get(
  '/login',
  Koajwt({
    getToken(ctx) {
      const userToken = ctx.cookies.get('user_token')
      if (!userToken) {
        return null
      }
      return userToken
    },
    secret: readFileSync(join(__dirname, '../../assets/public.pem')),
  }),
  (ctx) => {
    try {
      const { id } = ctx.state.user
      const token = signToken({ id })
      ctx.cookies.set('user_token', token, userTokenCookie)
      ctx.cookies.set('user_id', String(id), userIdCookie)
      ctx.status = 200
    } catch (e) {
      ctx.status = 500
      logger.error(e)
    }
  }
)

router.post('/login', async (ctx) => {
  const { mail, pass } = ctx.request.body
  // todo:验证
  if (!mail || !pass) {
    ctx.status = 403
    return
  }
  try {
    const user = await User.findOne({ mail }, ['_id', 'salt', 'pass'])
    if (!user) {
      ctx.status = 400
      return
    }
    const hashedPass = await verifyPassword(pass, user.salt)
    if (user.pass !== hashedPass) {
      ctx.status = 401
      return
    }
    const token = signToken({ id: user._id })
    ctx.cookies.set('user_token', token, userTokenCookie)
    //                         virtual(id):string
    ctx.cookies.set('user_id', user.id, userIdCookie)
    ctx.status = 200
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

router.get('/loginout', (ctx) => {
  try {
    ctx.cookies.set('user_token', '', { maxAge: 0 })
    ctx.cookies.set('user_id', '', { maxAge: 0 })
    ctx.status = 200
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

module.exports = router.routes()
