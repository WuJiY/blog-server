const Router = require('@koa/router')

const router = new Router({ prefix: '/users' })

router.get('/', (ctx) => {
  ctx.body = { id: 1, name: 'zero' }
})

module.exports = router.routes()
