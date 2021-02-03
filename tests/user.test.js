const assert = require('assert').strict
const app = require('../src/app')
const request = require('supertest')(app)
const { User } = require('../src/db')
const { signToken } = require('../src/utils')

describe('用户操作[GET /user]', () => {
  let user
  let cookie
  let expiringCookie

  before(async () => {
    user = await User.create({ mail: 't', name: 't', salt: 't', pass: 't' })
    const token = signToken({ id: user.id, role: user.role })
    cookie = `user_token=${token}`
    const expiringToken = signToken({ id: user.id, role: user.role }, 60000)
    expiringCookie = `user_token=${expiringToken}`
  })

  after(async () => {
    await User.deleteMany({})
  })

  it('自动登录成功[GET /user/auth]', async () => {
    const res = await request.get('/user/auth').set('Cookie', cookie)
    assert.equal(res.status, 200)
    assert.equal(res.body._id, user.id)
    assert.equal(res.body.name, user.name)
    assert.equal(res.body.mail, user.mail)
    assert.equal(res.body.avatar, user.avatar)
    assert.equal(res.body.role, user.role)
    assert.equal(res.body.createdAt, user.createdAt.toISOString())
    assert.equal(res.body.salt, undefined)
    assert.equal(res.body.pass, undefined)
  })

  it('更新用户在线成功[PATCH /user/polling]', async () => {
    const res = await request.patch('/user/polling').set('Cookie', cookie)
    assert.equal(res.status, 200)
  })

  it('token验证失败时应该抛出指定的错误', async () => {
    const res = await request.get('/user/auth')
    assert.equal(res.status, 401)
    assert.equal(res.text, '用户认证失败，请重新登录')
  })

  it('token快到期时自动续期', async () => {
    const res = await request.get('/user/auth').set('Cookie', expiringCookie)
    assert(res.status, 200)
    assert.equal(res.headers['set-cookie'][0].split(';')[0].split('=')[0], 'user_token')
  })
})
