import Router from '@koa/router'
import BodyValidate from '../middlewares/body-validate'
import user from './user'
import articles from './articles'
import sts from './sts'

const router = new Router()

router.use(BodyValidate())

router.use(user)

router.use(articles)

router.use(sts)

export default router
