const Router = require('@koa/router')
const { sortByKeyOrder, pageOne } = require('../utils')
const parsePosts = require('../utils/parse-posts')

const router = new Router({ prefix: '/posts' })

router.get('/', async (ctx) => {
  const { sort, order, page, limit } = ctx.query
  const posts = await parsePosts('../../posts')
  sortByKeyOrder(posts, sort, order)
  ctx.body = pageOne(posts, page, limit)
})

module.exports = router.routes()
