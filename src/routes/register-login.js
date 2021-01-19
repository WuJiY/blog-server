const { readFileSync } = require('fs')
const { join } = require('path')
const Router = require('@koa/router')
const Koajwt = require('koa-jwt')
const { Id, User } = require('../db')
const { hashPassword, signToken } = require('../utils')

const router = new Router()

router.post('/register', async (ctx) => {
  const { mail, name, pass } = ctx.request.body
  if (!mail || !name || !pass) {
    ctx.status = 403
    return
  }
  const exits = await User.findOne({ mail })
  if (exits) {
    ctx.status = 205
    return
  }
  const id = await Id.findById('users')
  const hashed = await hashPassword(pass)
  const token = signToken({ id: id.value })
  User.create({
    _id: id.value,
    mail,
    name,
    salt: hashed.salt,
    pass: hashed.pass,
  })
  id.incr()
  ctx.cookies.set('user_token', token, { maxAge: 28800000 + 300000 })
  ctx.body = { id: id.value }
})

router.get(
  '/login',
  Koajwt({
    getToken(ctx) {
      const userToken = ctx.cookies.get('user_token')
      if (!userToken) {
        return null
      }
      return userToken
    },
    secret: readFileSync(join(__dirname, '../../assets/public.pem')),
  }),
  (ctx) => {
    const { id } = ctx.state.user
    const token = signToken({ id })
    ctx.cookies.set('user_token', token, { maxAge: 28800000 + 300000 })
    ctx.body = { id }
  }
)

module.exports = router.routes()
