const fs = require('fs').promises
const { join } = require('path')
const marked = require('marked')
const hljs = require('highlight.js')

marked.setOptions({
  highlight(code, lang) {
    const validLang = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(validLang, code).value
  },
})

/**
 * 读取博客帖子并转换为对象
 * @param {string} dirPath 文件夹相对路径
 */
async function parsePosts(dirPath) {
  const posts = []
  const files = await fs.readdir(join(__dirname, dirPath), { withFileTypes: true })
  const promises = []
  for (let i = 0; i < files.length; i++) {
    if (files[i].isFile()) {
      const post = {
        title: files[i].name.slice(0, files[i].name.length - 3),
        date: 0,
        content: '',
      }
      posts.push(post)
      const filePath = join(__dirname, dirPath, files[i].name)
      promises.push(fs.stat(filePath), fs.readFile(filePath, { encoding: 'utf8' }))
    }
  }
  const result = await Promise.allSettled(promises)
  for (let i = 0, j = 0; i < result.length; i += 2, j++) {
    if (result[i].status === 'fulfilled' && result[i + 1].status === 'fulfilled') {
      posts[j].date = result[i].value.ctimeMs
      posts[j].content = marked(result[i + 1].value)
    }
  }
  return posts
}

module.exports = parsePosts
