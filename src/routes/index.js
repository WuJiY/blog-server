const Router = require('@koa/router')

const router = new Router()

router.use(require('./user'))
router.use(require('./register-login'))
router.use(require('./messages'))
router.use(require('./posts'))
router.use(require('./friends'))
router.use(require('./books'))
router.use(require('./client'))

module.exports = router
