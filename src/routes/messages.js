const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { Message, IdCount, Reply, User } = require('../db')
const {
  logger,
  getToken,
  constans: { PUBLIC_KEY },
  sortByKeyOrder,
  pageOne,
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
    const messages = await Message.find({})
      .populate('user', 'name avatar lastActiveAt')
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'name avatar lastActiveAt',
        },
      })
      .populate({
        path: 'replies',
        populate: {
          path: 'to',
          select: 'name avatar lastActiveAt',
        },
      })
      .exec()
    sortByKeyOrder(messages, sort, order)
    ctx.body = pageOne(messages, page, limit)
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

router.post('/', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { id } = ctx.state.user
  const { content } = ctx.request.body
  try {
    const idCount = await IdCount.findByIdAndUpdate('messages', { $inc: { value: 1 } }).exec()
    await Message.create({ _id: idCount.value, user: id, content })
    ctx.status = 200
    User.findByIdAndUpdate(id, { lastActiveAt: Date.now() }).exec()
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

router.patch('/:messageId/thumbsUp', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { id: userId } = ctx.state.user
  const messageId = parseInt(ctx.params.messageId, 10)
  try {
    const message = await Message.findById(messageId).exec()
    await message.updateThumbsUp(userId)
    ctx.status = 200
    User.findByIdAndUpdate(userId, { lastActiveAt: Date.now() }).exec()
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

router.post('/:messageId/replies', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const messageId = parseInt(ctx.params.messageId, 10)
  const { content, to } = ctx.request.body
  const { id } = ctx.state.user
  try {
    const [message, idCount] = await Promise.all([
      Message.findByIdAndUpdate(messageId, { $inc: { repliesLength: 1 } }).exec(),
      IdCount.findByIdAndUpdate('replies', { $inc: { value: 1 } }).exec(),
    ])
    await Promise.all([
      Reply.create({ _id: idCount.value, user: id, content, messageId, to }),
      message.pushReplies(idCount.value),
    ])
    ctx.status = 200
    User.findByIdAndUpdate(id, { lastActiveAt: Date.now() }).exec()
  } catch (e) {
    ctx.status = 500
    logger(e)
  }
})

module.exports = router.routes()
