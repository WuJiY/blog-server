import Router from '@koa/router'
import STS from 'qcloud-cos-sts'
import UserTokenAuth from '../middlewares/user-token-auth'
import AdminAuth from '../middlewares/admin-auth'
import { errorText } from '../utils/status-text'
import { tencentCret } from '../utils/config'

const router = new Router()

/**
 * 临时密钥服务
 */
router.get('/sts', UserTokenAuth, AdminAuth, async (ctx) => {
  // prefix = dir/name.ext
  // const { prefix } = ctx.request.body
  const policy = STS.getPolicy([
    {
      action: 'name/cos:PutObject',
      bucket: 'blog-1302895217',
      region: 'ap-nanjing',
      prefix: '*',
    },
  ])
  try {
    const tempCred = await STS.getCredential({
      secretId: tencentCret.credential.secretId,
      secretKey: tencentCret.credential.secretKey,
      policy,
    })
    ctx.status = 200
    ctx.body = tempCred
  } catch {
    ctx.throw(500, errorText.COS_TEMP_CRED_GET_FAIL)
  }
})

export default router.routes()
