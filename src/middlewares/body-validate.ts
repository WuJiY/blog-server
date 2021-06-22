import type { ParameterizedContext, Next } from 'koa'
import { errorText } from '../utils/status_text'

export default function BodyValidate() {
  return (ctx: ParameterizedContext, next: Next) => {
    const bodyValues = Object.values(ctx.request.body)
    if (bodyValues.some((val) => val === undefined || val === null)) {
      ctx.throw(400, errorText.REQUEST_REJECT)
    }
    return next()
  }
}
