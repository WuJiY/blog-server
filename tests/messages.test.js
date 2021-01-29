const assert = require('assert').strict
const app = require('../src/app')
const request = require('supertest')(app)
const { Message, Reply, User } = require('../src/db')
const { signToken } = require('../src/utils')

describe('获取留言及其回复[GET /messages]', () => {
  let users
  let reply1
  let reply2

  before(async () => {
    users = await User.create([
      { mail: 't1', name: 't1', salt: 't1', pass: 't1' },
      { mail: 't2', name: 't2', salt: 't2', pass: 't2' },
    ])
    reply1 = await Reply.create({ user: users[0]._id, content: 't1' })
    reply2 = await Reply.create({ user: users[1]._id, content: 't2', to: users[0]._id })
    await Message.create([
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
      { user: users[0]._id, content: 't1', replies: [reply1._id, reply2._id] },
    ])
    await Message.create({
      user: users[1]._id,
      content: 't2',
      replies: [reply1._id, reply2._id],
    })
  })

  afterEach(async () => {
    await Promise.all([
      User.deleteMany({}).exec(),
      Reply.deleteMany({}).exec(),
      Message.deleteMany({}).exec(),
    ])
  })

  it('应该获取到已排序且分页的留言且带回复', async () => {
    const res = await request.get('/messages?sort=createdAt&page=1')
    assert.equal(res.status, 200)
    // 总数
    assert.equal(res.body.length, 11)
    // 分页
    assert.equal(res.body.messages.length, 10)
    assert.equal(res.body.messages[0].replies.length, 1)
    assert.equal(res.body.messages[0].replies[0].length, 2)
    // 排序
    assert.equal(res.body.messages[0].user._id, users[1].id)
    assert.equal(res.body.messages[0].replies[0][0]._id, reply2.id)
    assert.equal(res.body.messages[0].replies[0][1]._id, reply1.id)
    // 内容
    assert.equal(res.body.messages[0].content, 't2')
    assert.equal(res.body.messages[0].replies[0][0].user._id, users[1].id)
    assert.equal(res.body.messages[0].replies[0][0].content, 't2')
    assert.equal(res.body.messages[0].replies[0][0].to._id, users[0].id)
    assert.equal(res.body.messages[0].replies[0][1].user._id, users[0].id)
    assert.equal(res.body.messages[0].replies[0][1].content, 't1')
  })

  it('没有留言，应该得到空数组', async () => {
    const res = await request.get('/messages?sort=createdAt&page=1')
    assert.equal(res.status, 200)
    assert.equal(res.body.length, 0)
    assert.equal(res.body.messages.length, 0)
  })
})

describe('发送留言;点赞;回复', () => {
  let cookie
  let messageId
  let userId

  before(async () => {
    const user = await User.create({ mail: 't', name: 't', salt: 't', pass: 't' })
    userId = user.id
    const token = signToken({ id: user.id, role: user.role })
    cookie = `user_token=${token}`
  })

  after(async () => {
    await Promise.all([
      User.deleteMany({}).exec(),
      Message.deleteMany({}).exec(),
      Reply.deleteMany({}).exec(),
    ])
  })

  it('留言发送成功[POST /messages]', async () => {
    const res = await request.post('/messages').set('Cookie', cookie).send({ content: 't' })
    const message = await Message.findOne({ user: userId, content: 't' }).lean().exec()
    messageId = message._id.toString()
    assert.equal(res.status, 200)
    assert.equal(message.user.toString(), userId)
    assert.equal(message.content, 't')
  })

  it('点赞成功[PATCH /messages/:messageId/thumbsUp]', async () => {
    const res = await request.patch(`/messages/${messageId}/thumbsUp`).set('Cookie', cookie)
    const message = await Message.findById(messageId).lean().exec()
    assert.equal(res.status, 200)
    assert.equal(message.thumbsUpUsers.length, 1)
    assert.equal(message.thumbsUpUsers[0].toString(), userId)
  })

  it('回复成功[POST /messages/:messageId/replies]', async () => {
    const res = await request
      .post(`/messages/${messageId}/replies`)
      .set('Cookie', cookie)
      .send({ content: 't', to: userId })
    const message = await Message.findById(messageId).lean().populate('replies').exec()
    assert.equal(res.status, 200)
    assert.equal(message.replies.length, 1)
    assert.equal(message.replies[0].content, 't')
    assert.equal(message.replies[0].user.toString(), userId)
    assert.equal(message.replies[0].to.toString(), userId)
  })
})
