const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { User } = require('../db')
const {
  logger,
  getToken,
  constans: { PUBLIC_KEY },
} = require('../utils')

const router = new Router({ prefix: '/users' })

// 自动登录后传用户数据
router.get(
  '/current',
  Koajwt({
    getToken,
    secret: PUBLIC_KEY,
  }),
  async (ctx) => {
    try {
      const { id } = ctx.state.user
      const user = await User.findByIdAndUpdate(id, { lastActiveAt: Date.now() })
        .select('name mail avatar registeredAt')
        .exec()
      if (!user) {
        ctx.status = 400
        return
      }
      ctx.body = user
    } catch (e) {
      ctx.status = 500
      logger.error(e)
    }
  }
)

module.exports = router.routes()
