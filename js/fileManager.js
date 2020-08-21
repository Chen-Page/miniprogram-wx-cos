const Cos = require('./cos-wx-sdk-v5')
const fileType = require('./fileFormats')

let config = {
  Bucket: '',
  Region: ''
}

const getAuthorization = (options, callback) => {
  setTimeout(() => {
    // 模拟从服务器获取到Authorization
    // 服务器需要使用 appId、secretId、secretKey和时间戳 等生成 Authorization
    // 测试可使用腾讯云cos后台签名生成工具
    let Authorization = 'bW3ttKlq0K+hRcGBgT4QaAQuDM1hPTEyNTgzMzIzMTImYj1zdG9yYWdlJms9QUtJRE1BdmtLdTZmczY1bmJCd2ViSTNaWkxFd1FvMHdnVHM5JmU9MTU5OTAwMTczNyZ0PTE1OTgwMDE3Nzcmcj0xMjMmZj0='
    callback({
      Authorization
    })
  }, 500)
}

let cos = new Cos({
  getAuthorization
})

const getBucketConfig = () => {
  // 模拟从服务器获取到需要使用的存储桶信息
  return new Promise((resolve) => {
    if (config.Bucket && config.Region) {
      resolve(config)
    } else {
      setTimeout(() => {
        let res = {
          Bucket: 'storage-1258332312',
          Region: 'ap-chengdu'
        }
        resolve(res)
      }, 500)
    }
  })
}

const getBucket = (options) => {
  // 获取存储桶内的数据
  return new Promise((resolve, reject) => {
    cos.getBucket(options, function(err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data.Contents)
      }
    })
  })
}

const getInfo = async (Key) => {
  // 通过 key 获取信息
  let reg = /\/$/
  let bucketConfig = await getBucketConfig()
  let {Bucket, Region} = bucketConfig
  let prefix = 'https://' + Bucket + '.cos.' + Region + '.myqcloud.com/'
  let resData = {
    path: prefix + Key
  }
  let extension = getExtension(Key)
  if (fileType.img.includes(extension)) {
    resData.type = 'img'
  } else if (fileType.video.includes(extension)) {
    resData.type = 'video'
  } else if (fileType.audio.includes(extension)) {
    resData.type = 'audio'
  } else {
    resData.type = 'other'
  }
  if (reg.test(Key)) {
    resData.type = 'dir'
    resData.fileName = ''
  } else {
    resData.extension = extension
    resData.fileName = getFileName(Key)
  }

  return new Promise((resolve) => {
    resolve(resData)
  })
}

const dir = async (options = {}) => {
  // 获取文件夹内的内容
  // options参数：Prefix（文件夹）
  let bucketConfig = await getBucketConfig()
  let {Bucket, Region} = bucketConfig
  return new Promise ((resolve, reject) => {
    getBucket({
      Bucket,
      Region,
      Prefix: options.Prefix || '',
      Delimiter: options.Delimiter || ''
    }).then((res) => {
      let promiseList = []
      for (let i in res) {
        promiseList.push(getInfo(res[i].Key))
      }
      Promise.all(promiseList).then((infoList) => {
        for (let i in res) {
          res[i].info = infoList.shift()
        }
        resolve(res)
      }).catch((err) => {
        reject(err)
      })
    }).catch((err) => {
      reject(err)
    })
  })
}

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
  // 获取文件名
  if (!type.isString(e)) {
    return ''
  }
  const arr = e.split('/')
  return arr[arr.length - 1]
}

module.exports = {
  dir
}