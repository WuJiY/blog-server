const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { IdCount, User } = require('../db')
const {
  hashPassword,
  verifyPassword,
  signToken,
  getToken,
  readFileSync,
  join,
  config: { userTokenCookie, userExpCookie },
  logger,
} = require('../utils')

/**
 * @param {number} id
 */
// eslint-disable-next-line consistent-return
async function updateUserActive(id) {
  if (typeof id !== 'number') {
    return logger.error(new Date(), new TypeError('id must be number'))
  }
  const user = await User.findById(id)
  if (user) {
    user.updateActive()
  }
}

const router = new Router()

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
    ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
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
    logger.error(new Date(), e)
  }
})

// 验证,刷新token
router.get(
  '/login',
  Koajwt({
    getToken,
    secret: readFileSync(join(__dirname, '../../assets/public.pem')),
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
      logger.error(new Date(), e)
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
    ctx.cookies.set('user_exp', String(Date.now() + userExpCookie.maxAge), userExpCookie)
    ctx.status = 200
    updateUserActive(user._id)
  } catch (e) {
    ctx.status = 500
    logger.error(new Date(), e)
  }
})

router.get('/logout', (ctx) => {
  try {
    ctx.cookies.set('user_token', '', { maxAge: 0 })
    ctx.cookies.set('user_exp', '', { maxAge: 0 })
    ctx.status = 200
  } catch (e) {
    ctx.status = 500
    logger.error(new Date(), e)
  }
})

module.exports = router.routes()
