const assert = require('assert').strict
const app = require('../src/app')
const request = require('supertest')(app)
const { User } = require('../src/db')
const { signToken, hashPassword } = require('../src/utils')

describe('注册[POST /register]', () => {
  after(async () => {
    await User.deleteMany({}).exec()
  })

  it('成功注册', async () => {
    const res = await request.post('/register').send({ mail: 't', name: 't', pass: 't' })
    const user = await User.findOne({ mail: 't' }).exec()
    assert.notEqual(user.salt, 't')
    assert.notEqual(user.pass, 't')
    assert.equal(res.headers['set-cookie'][0].split(';')[0].split('=')[0], 'user_token')
    assert.equal(res.headers['set-cookie'][1].split(';')[0].split('=')[0], 'user_exp')
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { message: '注册成功' })
  })

  it('用户已存在', async () => {
    const res = await request.post('/register').send({ mail: 't' })
    assert.equal(res.status, 400)
    assert.equal(res.text, '用户已存在')
  })
})

describe('token续期[GET /login]', () => {
  let cookie

  before(async () => {
    const user = await User.create({ mail: 't', name: 't', salt: 't', pass: 't' })
    const token = signToken({ id: user.id, role: user.role })
    cookie = `user_token=${token}`
  })

  after(async () => {
    await User.deleteMany({}).exec()
  })

  it('合法token', async () => {
    const res = await request.get('/login').set('Cookie', cookie)
    assert.equal(res.headers['set-cookie'][0].split(';')[0].split('=')[0], 'user_token')
    assert.equal(res.headers['set-cookie'][1].split(';')[0].split('=')[0], 'user_exp')
    assert.equal(res.status, 200)
  })

  it('非法token', async () => {
    const res = await request.get('/login').set('Cookie', 'user_token=t&user_exp=t')
    assert.equal(res.status, 401)
    assert.equal(res.text, '用户认证失败，请重新登录')
  })
})

describe('登录[POST /login]', () => {
  before(async () => {
    const hashed = await hashPassword('t')
    await User.create({ mail: 't', name: 't', salt: hashed.salt, pass: hashed.pass })
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
