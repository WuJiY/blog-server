/**
 * 临时密钥服务
 */

import Router from '@koa/router'
import STS from 'qcloud-cos-sts'
import UserTokenAuth from '../middlewares/user-token-auth'
import AdminAuth from '../middlewares/admin-auth'
import TENCENT_CERT from '../../assets/tencent-credential.json'
import { errorText } from '../utils/status_text'

const router = new Router()

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
      secretId: TENCENT_CERT.credential.secretId,
      secretKey: TENCENT_CERT.credential.secretKey,
      policy,
    })
    ctx.status = 200
    ctx.body = tempCred
  } catch {
    ctx.throw(500, errorText.COS_TEMP_CRED_GET_FAIL)
  }
})

export default router.routes()
