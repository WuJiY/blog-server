const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { Book } = require('../db')
const {
  getToken,
  constans: { PUBLIC_KEY },
} = require('../utils')

const router = new Router({ prefix: '/books' })

router.get('/', async (ctx) => {
  const books = await Book.find({}).lean().exec()
  const read = []
  const unread = []
  for (let i = 0; i < books.length; i++) {
    if (books[i].isRead) {
      read.push(books[i])
    } else {
      unread.push(books[i])
    }
  }
  ctx.body = { read, unread }
})

router.post('/', Koajwt({ getToken, secret: PUBLIC_KEY }), async (ctx) => {
  if (ctx.state.user.role !== 'admin') {
    ctx.throw(403)
  }
  const books = ctx.request.body
  await Book.create([...books.read, ...books.unread])
  ctx.status = 200
})

module.exports = router.routes()
