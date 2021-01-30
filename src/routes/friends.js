const Router = require('@koa/router')
const { Friend } = require('../db')
const { pageOne } = require('../utils')

const router = new Router({ prefix: '/friends' })

router.get('/', async (ctx) => {
  const { page, limit } = ctx.query
  const friens = await Friend.find({}).lean().exec()
  ctx.body = pageOne(friens, page, limit)
})

module.exports = router.routes()
