const mongoose = require('mongoose')

const { Schema } = mongoose

const option = { toJSON: { versionKey: false }, timestamps: true }

const UserSchema = new Schema(
  {
    mail: { type: String, required: true },
    name: { type: String, required: true },
    salt: { type: String, required: true },
    pass: { type: String, required: true },
    role: { type: String, default: 'normal' },
    // 头像链接
    avatar: { type: String, default: '' },
    // 最近活动时间
    lastActiveAt: { type: Date, default: Date.now },
  },
  option
)

const MessageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    // 点赞用户列表
    thumbsUpUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // 用户回复列表
    replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
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
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    // 是否回复某个用户
    to: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  option
)

const FriendSchema = new Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    desc: { type: String, required: true },
    link: { type: String, required: true },
  },
  option
)

const BookSchema = new Schema(
  {
    isbn: String,
    title: String,
    abstract: String,
    coverUrl: String,
    url: String,
    isRead: Boolean,
  },
  option
)

const User = mongoose.model('User', UserSchema)
const Message = mongoose.model('Message', MessageSchema)
const Reply = mongoose.model('Reply', ReplySchema)
const Friend = mongoose.model('Friend', FriendSchema)
const Book = mongoose.model('Book', BookSchema)

module.exports = { User, Message, Reply, Friend, Book }
