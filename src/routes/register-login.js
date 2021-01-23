const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { IdCount, User } = require('../db')
const {
  hashPassword,
  verifyPassword,
  signToken,
  getToken,
  constans: { PUBLIC_KEY },
  config: { userTokenCookie, userExpCookie },
  logger,
} = require('../utils')

/**
 * 更新用户最近活动时间
 * @param {number} id
 */
async function updateUserActive(id) {
  const user = await User.findById(id).exec()
  user?.updateActive()
}

const router = new Router()

router.post('/register', async (ctx) => {
  const { mail, name, pass } = ctx.request.body
  // todo: 人机验证(captcha)
  if (!mail || !name || !pass) {
    ctx.status = 403
    return
  }
  try {
    const [user, idCount, hashed] = await Promise.all([
      User.findOne({ mail }).exec(),
      IdCount.findById('users').exec(),
      hashPassword(pass),
    ])
    if (user) {
      ctx.status = 400
      return
    }
    const token = signToken({ id: idCount.value })
    ctx.cookies.set('user_token', token, userTokenCookie)
    ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
    ctx.status = 200
    await User.create({
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

// token验证，续期，用于自动登录
router.get(
  '/login',
  Koajwt({
    getToken,
    secret: PUBLIC_KEY,
  }),
  async (ctx) => {
    try {
      const { id } = ctx.state.user
      const token = signToken({ id })
      ctx.cookies.set('user_token', token, userTokenCookie)
      ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
      ctx.status = 200
      updateUserActive(id)
    } catch (e) {
      ctx.status = 500
      logger.error(e)
    }
  }
)

router.post('/login', async (ctx) => {
  const { mail, pass } = ctx.request.body
  // todo: 人机验证(captcha)
  if (!mail || !pass) {
    ctx.status = 403
    return
  }
  try {
    const user = await User.findOne({ mail }, ['_id', 'salt', 'pass']).exec()
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
    ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
    ctx.status = 200
    user.updateActive()
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

router.get('/logout', (ctx) => {
  try {
    ctx.cookies.set('user_token', '', { maxAge: 0 })
    ctx.cookies.set('user_exp', '', { maxAge: 0 })
    ctx.status = 200
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

module.exports = router.routes()
