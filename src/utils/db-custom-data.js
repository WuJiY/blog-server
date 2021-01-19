const { connectDb } = require('./index')
const { Id } = require('../db')

/**
 * 手动增加一些数据
 * @param model mongoose.Model
 * @param {object | [object]} data
 */
async function create(model, data) {
  try {
    await connectDb()
    await model.create(data)
    console.log('success')
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  }
  process.exit()
}

create(Id, [
  { _id: 'users', value: 0 },
  { _id: 'blogs', value: 0 },
  { _id: 'messages', value: 0 },
  { _id: 'friends', value: 0 },
])
