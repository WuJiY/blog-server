const mongoose = require('mongoose')

const { Schema } = mongoose

// 对应collection已用id计数表
const IdCountSchema = new Schema({
  _id: String,
  value: { type: Number, default: 0 },
})

IdCountSchema.method('incr', function incr() {
  this.value += 1
  this.save()
})

const UserSchema = new Schema({
  _id: Number,
  mail: { type: String, required: true },
  name: { type: String, required: true },
  salt: { type: String, required: true },
  pass: { type: String, required: true },
  // 头像链接 todo:头像上传功能
  avatar: { type: String, default: '' },
  // 注册时间
  registerDate: { type: Date, default: new Date() },
  // 最近活动时间
  lastActive: { type: Date, default: new Date() },
  // 密码最近修改时间
  passModified: { type: Date, default: new Date() },
})

// 更新用户最近活动时间
UserSchema.method('updateActive', function updateActive() {
  this.lastActive = new Date()
  this.save()
})

const MessageSchema = new Schema({
  _id: Number,
  user: { type: Number, ref: 'User' },
  content: { type: String, required: true },
  date: { type: Date, default: new Date() },
  // 点赞用户id数组
  thumbsUpUserList: [Number],
  // 回复数
  replies: { type: Number, default: 0 },
})

MessageSchema.method('updateThumbsUp', function updateThumbsUp(userId) {
  const index = this.thumbsUpUserList.indexOf(userId)
  if (index === -1) {
    this.thumbsUpUserList.push(userId)
  } else {
    this.thumbsUpUserList.splice(index, 1)
  }
  this.save()
})

MessageSchema.method('repliesIncr', function repliesIncr() {
  this.replies += 1
  this.save()
})

const IdCount = mongoose.model('IdCount', IdCountSchema)
const User = mongoose.model('User', UserSchema)
const Message = mongoose.model('Message', MessageSchema)

module.exports = { IdCount, User, Message }
