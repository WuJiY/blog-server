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
  const { newBooks, modified } = ctx.request.body
  const op = []
  for (let i = 0; i < modified.update.length; i++) {
    op.push(Book.findByIdAndUpdate(modified.update[i], { isRead: true }).exec())
  }
  for (let i = 0; i < modified.delete.length; i++) {
    op.push(Book.findByIdAndDelete(modified.delete[i]).exec())
  }
  await Promise.all([Book.create([...newBooks.read, ...newBooks.unread]), ...op])
  ctx.status = 200
})

module.exports = router.routes()
