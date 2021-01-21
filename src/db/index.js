const mongoose = require('mongoose')

const { Schema } = mongoose

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

UserSchema.method('updateActive', function updateActive() {
  this.lastActive = new Date()
  this.save()
})

const IdCount = mongoose.model('IdCount', IdCountSchema)
const User = mongoose.model('User', UserSchema)

module.exports = { IdCount, User }
