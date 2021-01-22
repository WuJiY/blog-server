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
      const user = await User.findById(id, [
        'name',
        'mail',
        'avatar',
        'registerDate',
        'passModified',
      ])
      if (!user) {
        ctx.status = 400
        return
      }
      ctx.body = user
      user.updateActive()
    } catch (e) {
      ctx.status = 500
      logger.error(new Date(), e)
    }
  }
)

module.exports = router.routes()
