const Router = require('@koa/router')
const { Friend } = require('../db')
const { logger, pageOne } = require('../utils')

const router = new Router({ prefix: '/friends' })

router.get('/', async (ctx) => {
  const { page, limit } = ctx.query
  try {
    const friens = await Friend.find({}).exec()
    ctx.body = pageOne(friens, page, limit)
  } catch (e) {
    ctx.status = 500
    logger.error(e)
  }
})

module.exports = router.routes()
