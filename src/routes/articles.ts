import Router from '@koa/router'
import { Article } from '../db'
import { sortQuery, pageQuery, isStringArray } from '../utils'
import { errorText, successText } from '../utils/status_text'
import UserTokenAuth from '../middlewares/user-token-auth'
import AdminAuth from '../middlewares/admin-auth'

const router = new Router()

router.get('/articles', async (ctx) => {
  const sortQS = [ctx.query.sort, ctx.query.order]
  const pageQS = [ctx.query.page, ctx.query.limit]
  const articles = await Article.find({}).lean().select('-content -comments').exec()
  if (isStringArray(sortQS)) {
    sortQuery(articles, sortQS[0], sortQS[1] === 'asc' ? 'asc' : 'desc')
  }
  ctx.status = 200
  ctx.body = articles
  if (isStringArray(pageQS)) {
    ctx.body = pageQuery(articles, pageQS[0], pageQS[1])
  }
})

router.get('/article', async (ctx) => {
  const { id } = ctx.request.body
  const article = await Article.findById(id)
    .lean()
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'name avatar',
        options: {
          lean: true,
        },
      },
      options: {
        lean: true,
      },
    })
    .exec()
  if (article) {
    ctx.status = 200
    ctx.body = article
  } else {
    ctx.throw(403, errorText.ARTICLE_NOT_EXISTS)
  }
})

router.post('/article', UserTokenAuth, AdminAuth, async (ctx) => {
  const { title, content, coverUrl, path, date } = ctx.request.body
  const exists = await Article.findOne({ title }).lean().exec()
  if (exists) {
    ctx.throw(403, errorText.ARTICLE_EXISTS)
  }
  await Article.create({
    title,
    content,
    coverUrl,
    path,
    createdAt: date,
    updatedAt: date,
  })
  ctx.status = 200
  ctx.body = { message: successText.ADD_ARTICLE_SUCCESS }
})

// TODO: 无法删除
router.delete('/article', UserTokenAuth, AdminAuth, async (ctx) => {
  const { id } = ctx.request.body
  const result = await Article.deleteOne({ id }).exec()
  console.log(result)
  ctx.status = 200
  ctx.body = { message: successText.DELETE_ARTICLE_SUCCESS }
})

router.patch('/article', UserTokenAuth, AdminAuth, async (ctx) => {
  const { id, ...otherProps } = ctx.request.body
  const needChanges: Record<string, unknown> = {}
  Object.entries(otherProps).forEach(([key, val]) => {
    if (val) {
      needChanges[key] = val
    }
  })
  const article = await Article.findById(id).exec()
  if (article) {
    await article.update({ ...needChanges }).exec()
    ctx.status = 200
    ctx.body = { message: successText.UPDATE_ARTICLE_SUCCESS }
  } else {
    ctx.throw(403, errorText.ARTICLE_NOT_EXISTS)
  }
})

export default router.routes()
