import type { ParameterizedContext, Next } from 'koa'
import * as TencentCaptcha from 'tencentcloud-sdk-nodejs/tencentcloud/services/captcha'
import { errorText } from '../utils/status-text'
import { tencentCret } from '../utils/config'

const client = new TencentCaptcha.captcha.v20190722.Client({
  credential: tencentCret.credential,
  region: '',
  profile: {},
})

export default async function Captcha(ctx: ParameterizedContext, next: Next) {
  if (process.env.NODE_ENV === 'test') {
    return next()
  }
  const { Ticket, Randstr } = ctx.request.body
  const res = await client.DescribeCaptchaResult({
    CaptchaType: 9,
    UserIp: ctx.ip,
    Ticket,
    Randstr,
    ...tencentCret.captcha,
  })
  if (res.CaptchaCode !== 1) {
    ctx.throw(404, errorText.CAPTCHA_INVALID)
  }
  return next()
}
