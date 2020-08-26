// 工具类
let type = (o) => {
  // 判断对象类型的方法
  let s = Object.prototype.toString.call(o)
  return s.match(/\[object (.*?)\]/)[1].toLowerCase()
}

['Null',
  'Undefined',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Function',
  'RegExp'
].forEach(function (t) {
  type['is' + t] = function (o) {
    return type(o) === t.toLowerCase()
  }
})

const getExtension = (e = '') => {
  // 获取后缀名
  if (!type.isString(e)) {
    return ''
  }
  if (!e.includes('.')) {
    return ''
  }
  const arr = e.split('.')
  return arr[arr.length - 1]
}

const getFileName = (e = '') => {
  // 通过链接获取文件名
  if (!type.isString(e)) {
    return ''
  }
  const arr = e.split('/')
  return arr[arr.length - 1]
}

module.exports = {
  type,
  getExtension,
  getFileName
}