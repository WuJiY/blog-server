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
  // 注册时间
  registerDate: { type: Date, default: new Date() },
  // 上次在线时间
  lastActive: { type: Date, default: new Date() },
  // 头像链接 todo:头像上传功能
  avatar: String,
})

const IdCount = mongoose.model('IdCount', IdCountSchema)
const User = mongoose.model('User', UserSchema)

module.exports = { IdCount, User }
