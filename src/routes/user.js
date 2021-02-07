const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { User } = require('../db')
const {
  constans: { PUBLIC_KEY },
  signToken,
  config: { USER_TOKEN_COOKIE },
} = require('../utils')

const router = new Router({ prefix: '/user' })

// 自动登录
router.get('/auth', Koajwt({ cookie: 'user_token', secret: PUBLIC_KEY }), async (ctx) => {
  const { id, role, exp } = ctx.state.user
  const user = await User.findByIdAndUpdate(id, { lastActiveAt: Date.now() })
    .lean()
    .select('name mail avatar createdAt role')
    .exec()
  // 续期
  if (Date.now() - exp < 86400000) {
    const token = signToken({ id, role })
    ctx.cookies.set('user_token', token, USER_TOKEN_COOKIE)
  }
  ctx.body = user
})

router.patch('/polling', Koajwt({ cookie: 'user_token', secret: PUBLIC_KEY }), async (ctx) => {
  await User.findByIdAndUpdate(ctx.state.user.id, { lastActiveAt: Date.now() })
  ctx.status = 200
})

module.exports = router.routes()
