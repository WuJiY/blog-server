import Router from '@koa/router'
import BodyValidate from '../middlewares/body-validate'
import user from './user'
import articles from './articles'
import sts from './sts'

const router = new Router({ prefix: process.env.NODE_ENV === 'dev' ? '/dev' : undefined })

router.use(BodyValidate())

router.use(user)

router.use(articles)

router.use(sts)

export default router
