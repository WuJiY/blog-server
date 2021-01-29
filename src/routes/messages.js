const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { Message, Reply, User } = require('../db')
const {
  getToken,
  constans: { PUBLIC_KEY },
  sortByKeyOrder,
  pageOne,
  pageAll,
} = require('../utils')

const router = new Router({ prefix: '/messages' })

router.get('/', async (ctx) => {
  const { sort, order, page, limit } = ctx.query
  const messages = await Message.find({})
    .lean()
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
  for (let i = 0; i < messages.length; i++) {
    sortByKeyOrder(messages[i].replies, sort, order)
    messages[i].repliesLength = messages[i].replies.length
    messages[i].replies = pageAll(messages[i].replies, limit)
  }
  ctx.body = { length: messages.length, messages: pageOne(messages, page, limit) }
})

router.post('/', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { id } = ctx.state.user
  const { content } = ctx.request.body
  await Message.create({ user: id, content })
  ctx.status = 200
  User.findByIdAndUpdate(id, { lastActiveAt: Date.now() }).exec()
})

router.patch('/:messageId/thumbsUp', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { id: userId } = ctx.state.user
  const { messageId } = ctx.params
  const message = await Message.findById(messageId).exec()
  await message.updateThumbsUp(userId)
  ctx.status = 200
  User.findByIdAndUpdate(userId, { lastActiveAt: Date.now() }).exec()
})

router.post('/:messageId/replies', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  const { messageId } = ctx.params
  const { content, to } = ctx.request.body
  const { id: userId } = ctx.state.user
  const [message, reply] = await Promise.all([
    Message.findById(messageId).exec(),
    Reply.create({ user: userId, content, messageId, to }),
  ])
  await message.pushReplies(reply.id)
  ctx.status = 200
  User.findByIdAndUpdate(userId, { lastActiveAt: Date.now() }).exec()
})

module.exports = router.routes()
