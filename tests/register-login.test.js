const assert = require('assert').strict
const app = require('../src/app')
// eslint-disable-next-line import/order
const request = require('supertest')(app)
const { User } = require('../src/db')

describe('注册[POST /register]', () => {
  before(async () => {
    await User.deleteMany({})
  })

  it('成功注册', async () => {
    const user = { mail: 't', name: 't', pass: 't' }
    const res = await request.post('/register').send(user)
    const userSaved = await User.findOne({ mail: user.mail }).exec()
    assert.notEqual(userSaved.salt, 't')
    assert.notEqual(userSaved.pass, 't')
    assert.equal(res.headers['set-cookie'][0].split(';')[0].split('=')[0], 'user_token')
    assert.equal(res.headers['set-cookie'][1].split(';')[0].split('=')[0], 'user_exp')
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { message: '注册成功' })
  })

  it('用户已存在', async () => {
    const user = { mail: 't' }
    const res = await request.post('/register').send(user)
    assert.equal(res.status, 400)
    assert.equal(res.text, '用户已存在')
  })
})

describe('token续期[GET /login]', () => {
  let cookies
  before(async () => {
    await User.deleteMany({})
    const res = await request.post('/register').send({ mail: 't', name: 't', pass: 't' })
    cookies = res.headers['set-cookie'].join('&')
  })

  after(async () => {
    await User.deleteMany({})
  })

  it('合法token', async () => {
    const res = await request.get('/login').set('Cookie', cookies)
    assert.equal(res.headers['set-cookie'][0].split(';')[0].split('=')[0], 'user_token')
    assert.equal(res.headers['set-cookie'][1].split(';')[0].split('=')[0], 'user_exp')
    assert.equal(res.status, 200)
  })

  it('非法token', async () => {
    const res = await request.get('/login').set('Cookie', 'user_token=t&user_exp=t')
    assert.equal(res.status, 401)
  })
})

describe('登录[POST /login]', () => {
  before(async () => {
    await request.post('/register').send({ mail: 't', name: 't', pass: 't' })
  })

  after(async () => {
    await User.deleteMany({})
  })

  it('成功登录', async () => {
    const res = await request.post('/login').send({ mail: 't', pass: 't' })
    assert.equal(res.headers['set-cookie'][0].split(';')[0].split('=')[0], 'user_token')
    assert.equal(res.headers['set-cookie'][1].split(';')[0].split('=')[0], 'user_exp')
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { message: '登录成功' })
  })

  it('密码错误', async () => {
    const res = await request.post('/login').send({ mail: 't', pass: 'tt' })
    assert.equal(res.status, 400)
    assert.equal(res.text, '密码错误')
  })

  it('用户不存在', async () => {
    const res = await request.post('/login').send({ mail: 'tt', pass: 't' })
    assert.equal(res.status, 400)
    assert.equal(res.text, '用户不存在')
  })
})

describe('登出[GET /logout]', () => {
  it('成功登出', async () => {
    const res = await request.get('/logout')
    assert.equal(res.headers['set-cookie'][0].split(';')[0].split('=')[1], '')
    assert.equal(res.headers['set-cookie'][1].split(';')[0].split('=')[1], '')
    assert.equal(res.status, 200)
  })
})
