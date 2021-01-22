const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { Message, IdCount } = require('../db')
const {
  logger,
  handleSort,
  handlePage,
  getToken,
  constans: { PUBLIC_KEY },
} = require('../utils')

const router = new Router({ prefix: '/messages' })

router.get('/length', async (ctx) => {
  try {
    const idCount = await IdCount.findById('messages').exec()
    ctx.body = idCount.value
  } catch (e) {
    ctx.status = 500
    logger.error(new Date(), e)
  }
})

router.get('/', async (ctx) => {
  const { sort, order, page, limit } = ctx.query
  try {
    const messages = await Message.find({}, '-__v')
      .populate('user', 'name avatar lastActive')
      .exec()
    handleSort(messages, sort, order)
    ctx.body = handlePage(messages, page, limit)
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

router.post(
  '/',
  Koajwt({
    getToken,
    secret: PUBLIC_KEY,
  }),
  async (ctx) => {
    const { id } = ctx.state.user
    const { content } = ctx.request.body
    try {
      const idCount = await IdCount.findById('messages').exec()
      await Message.create({ _id: idCount.value, user: id, content })
      idCount.incr()
      ctx.status = 200
    } catch (e) {
      ctx.status = 500
      logger.error(new Date(), e)
    }
  }
)

module.exports = router.routes()
