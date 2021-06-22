import { Schema, model } from 'mongoose'
import type { ObjectId, Document, Model } from 'mongoose'

interface User extends Document<ObjectId> {
  mail: string
  name: string
  pass: string
  role: 'normal' | 'admin'
  avatar: string
  createdAt: string
  lastActiveAt: string
}

const UserSchema = new Schema<User, Model<User>>({
  mail: String,
  name: String,
  pass: String,
  role: { type: String, default: 'normal' },
  avatar: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  lastActiveAt: { type: String, default: () => new Date().toISOString() },
})

interface Comment extends Document<ObjectId> {
  user: ObjectId
  content: string
  likes: ObjectId[]
  replies: ObjectId[]
  createdAt: string
}

const CommentSchema = new Schema<Comment, Model<Comment>>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  content: String,
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
  createdAt: { type: String, default: () => new Date().toISOString() },
})

CommentSchema.method('updateLikes', function updateLikes(userId: ObjectId) {
  const index = this.likes.indexOf(userId)
  if (index === -1) {
    this.likes.push(userId)
  } else {
    this.likes.splice(index, 1)
  }
  return this.save()
})

CommentSchema.method('pushReply', function pushReply(replyId: ObjectId) {
  this.replies.push(replyId)
  return this.save()
})

interface Reply extends Document<ObjectId> {
  user: ObjectId
  content: string
  to: ObjectId
  createdAt: string
}

const ReplySchema = new Schema<Reply, Model<Reply>>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  content: String,
  // 是否回复某个用户
  to: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: String, default: () => new Date().toISOString() },
})

interface Book extends Document<ObjectId> {
  isbn: string
  title: string
  abstract: string
  coverUrl: string
  url: string
  isReaded: boolean
}

const BookSchema = new Schema<Book, Model<Book>>({
  isbn: String,
  title: String,
  abstract: String,
  coverUrl: String,
  url: String,
  isReaded: String,
})

interface Article extends Document<ObjectId> {
  title: string
  content: string
  comments: ObjectId[]
  coverUrl: string
  path: string
  createdAt: string
  updatedAt: string
}

const ArticleSchema = new Schema<Article, Model<Article>>({
  title: String,
  content: String,
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  coverUrl: String,
  // 分类路径，例如：'dirA/dirB'
  path: String,
  createdAt: String,
  updatedAt: String,
})

interface Tweet extends Document<ObjectId> {
  content: string
  comments: ObjectId[]
  createdAt: string
}

const TweetSchema = new Schema<Tweet, Model<Tweet>>({
  content: String,
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: String, default: () => new Date().toISOString() },
})

interface Stats extends Document<ObjectId> {
  device: string
  browser: string
  activeTime: number
}

const StatsSchema = new Schema<Stats, Model<Stats>>({
  device: String,
  browser: String,
  activeTime: Number,
})

export const User = model('User', UserSchema)

export const Comment = model('Comment', CommentSchema)

export const Reply = model('Reply', ReplySchema)

export const Book = model('Book', BookSchema)

export const Article = model('Article', ArticleSchema)

export const Tweet = model('Tweet', TweetSchema)

export const Stats = model('Stats', StatsSchema)
