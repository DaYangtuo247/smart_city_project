// 处理业务逻辑中间件，读取某个json文件的数据

const path = require('path')
const fileUtils = require('../utils/file_utils')

module.exports = async (ctx, next) => {
  // 拿到请求的url  /api/test
  const url = ctx.request.url
  // 处理掉 /api 
  let filePath = url.replace('/api', '')
  // 拼接文件路径
  filePath = `../data${filePath}.json`
  // filePath = `../data${filePath}`

  // 拼接为绝对路径
  filePath = path.join(__dirname, filePath)
  console.log('filePath: ', filePath);

  // 调用工具函数读取文件内容
  try {
    const result = await fileUtils.getFileJsonData(filePath)
    // console.log('请求成功：',JSON.parse(result));
    // 设置响应体
    ctx.response.body = result
  } catch (error) {
    const errorMsg = {
      message: '读取文件内容失败,资源不存在',
      status: '404'
    }
    console.log('请求失败：',errorMsg);
    ctx.response.body = JSON.stringify(errorMsg)
  }



  await next()
}