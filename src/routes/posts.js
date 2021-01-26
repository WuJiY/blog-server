const Router = require('@koa/router')
const { logger, sortByKeyOrder, pageOne } = require('../utils')
const parsePosts = require('../utils/parse-posts')

const router = new Router({ prefix: '/posts' })

router.get('/', async (ctx) => {
  const { sort, order, page, limit } = ctx.query
  try {
    const posts = await parsePosts('../../posts')
    sortByKeyOrder(posts, sort, order)
    ctx.body = pageOne(posts, page, limit)
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

module.exports = router.routes()
