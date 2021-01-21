const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { User } = require('../db')
// eslint-disable-next-line object-curly-newline
const { logger, getToken, readFileSync, join } = require('../utils')

const router = new Router({ prefix: '/users' })

router.get(
  '/current',
  Koajwt({
    getToken,
    secret: readFileSync(join(__dirname, '../../assets/public.pem')),
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

router.get('/:id', async (ctx) => {
  let { id } = ctx.params
  try {
    if (!/\d+/.test(id)) {
      ctx.status = 400
      return
    }
    id = parseInt(id, 10)
    const user = await User.findById(id, ['name', 'avatar', 'lastActive'])
    if (!user) {
      ctx.status = 400
      return
    }
    ctx.body = user
  } catch (e) {
    ctx.status = 500
    logger.error(new Date(), e)
  }
})

module.exports = router.routes()
