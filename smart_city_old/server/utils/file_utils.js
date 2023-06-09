// 读取文件的工具方法
const fs = require('fs')

module.exports.getFileJsonData = (filePath) => {
  // 根据文件路径读取文件内容
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      // 读取文件失败
      if (err) reject(err)

      // 读取成功
      resolve(data)
    })
  })
}