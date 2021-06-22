import type { ParameterizedContext, Next } from 'koa'
import * as TencentCaptcha from 'tencentcloud-sdk-nodejs/tencentcloud/services/captcha'
import TENCENT_CERT from '../../assets/tencent-credential.json'
import { errorText } from '../utils/status_text'

const client = new TencentCaptcha.captcha.v20190722.Client({
  credential: TENCENT_CERT.credential,
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
    ...TENCENT_CERT.captcha,
  })
  if (res.CaptchaCode !== 1) {
    ctx.throw(404, errorText.CAPTCHA_INVALID)
  }
  return next()
}
