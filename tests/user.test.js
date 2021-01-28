const assert = require('assert').strict
const app = require('../src/app')
// eslint-disable-next-line import/order
const request = require('supertest')(app)
const { User } = require('../src/db')

describe('用户操作[GET /user]', () => {
  let cookies
  before(async () => {
    await User.deleteMany({})
    const res = await request.post('/register').send({ mail: 't', name: 't', pass: 't' })
    cookies = res.headers['set-cookie'].join('&')
  })

  after(async () => {
    await User.deleteMany({})
  })

  it('自动登录成功[GET /user/auth]', async () => {
    const res = await request.get('/user/auth').set('Cookie', cookies)
    assert.equal(res.status, 200)
    assert.equal(res.body._id.length, 24)
    assert.equal(res.body.salt, undefined)
    assert.equal(res.body.pass, undefined)
  })

  it('自动登录验证失败[GET /user/auth]', async () => {
    const res = await request.get('/user/auth')
    assert.equal(res.status, 401)
    assert.equal(res.text, '用户认证失败，请重新登录')
  })

  it('更新用户在线成功[PATCH /user/polling]', async () => {
    const res = await request.patch('/user/polling').set('Cookie', cookies)
    assert.equal(res.status, 200)
  })

  it('更新用户在线失败[PATCH /user/polling]', async () => {
    const res = await request.patch('/user/polling')
    assert.equal(res.status, 401)
    assert.equal(res.text, '用户认证失败，请重新登录')
  })
})
