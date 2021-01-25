const mongoose = require('mongoose')

const { Schema } = mongoose

const option = { toJSON: { versionKey: false } }

// 对应collection已用id计数表
const IdCountSchema = new Schema(
  {
    _id: String,
    value: { type: Number, default: 0 },
  },
  option
)

const UserSchema = new Schema(
  {
    _id: Number,
    mail: { type: String, required: true },
    name: { type: String, required: true },
    salt: { type: String, required: true },
    pass: { type: String, required: true },
    // 头像链接 todo:头像上传功能
    avatar: { type: String, default: '' },
    // 注册时间
    registeredAt: { type: Date, default: Date.now },
    // 最近活动时间
    lastActiveAt: { type: Date, default: Date.now },
  },
  option
)

const MessageSchema = new Schema(
  {
    _id: Number,
    user: { type: Number, ref: 'User' },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    // 点赞用户列表
    thumbsUpUsers: [{ type: Number, ref: 'User' }],
    // 用户回复列表
    replies: [{ type: Number, ref: 'Reply' }],
    // 回复数
    repliesLength: { type: Number, default: 0 },
  },
  option
)

MessageSchema.methods.updateThumbsUp = function updateThumbsUp(userId) {
  const index = this.thumbsUpUsers.indexOf(userId)
  if (index === -1) {
    this.thumbsUpUsers.push(userId)
  } else {
    this.thumbsUpUsers.splice(index, 1)
  }
  return this.save()
}

MessageSchema.methods.pushReplies = function pushReplies(replyId) {
  this.replies.push(replyId)
  return this.save()
}

const ReplySchema = new Schema(
  {
    _id: Number,
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    // 发送者
    user: { type: Number, ref: 'User' },
    // 是否回复某个用户
    to: { type: Number, ref: 'User' },
  },
  option
)

const IdCount = mongoose.model('IdCount', IdCountSchema)
const User = mongoose.model('User', UserSchema)
const Message = mongoose.model('Message', MessageSchema)
const Reply = mongoose.model('Reply', ReplySchema)

module.exports = { IdCount, User, Message, Reply }
