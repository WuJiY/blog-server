const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { User } = require('../db')
const {
  getToken,
  constans: { PUBLIC_KEY },
} = require('../utils')

const router = new Router({ prefix: '/user' })

// 自动登录
router.get('/auth', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const user = await User.findByIdAndUpdate(ctx.state.user.id, { lastActiveAt: Date.now() })
    .select('name mail avatar createdAt role')
    .exec()
  ctx.body = user
})

router.patch('/polling', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  await User.findByIdAndUpdate(ctx.state.user.id, { lastActiveAt: Date.now() })
  ctx.status = 200
})

module.exports = router.routes()
