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
    logger.error(e)
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

router.post('/', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { id } = ctx.state.user
  const { content } = ctx.request.body
  try {
    const idCount = await IdCount.findById('messages').exec()
    await Message.create({ _id: idCount.value, user: id, content })
    idCount.incr()
    ctx.status = 200
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

router.post('/thumbsUp', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { id: userId } = ctx.state.user
  const { messageId } = ctx.request.body
  try {
    const message = await Message.findById(messageId).exec()
    message.updateThumbsUp(userId)
    ctx.status = 200
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

module.exports = router.routes()
