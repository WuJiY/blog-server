const { connectDb } = require('./index')
const { IdCount } = require('../db')

/**
 * 手动创建文档
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

create(IdCount, [{ _id: 'users' }, { _id: 'blogs' }, { _id: 'messages' }, { _id: 'friends' }])
