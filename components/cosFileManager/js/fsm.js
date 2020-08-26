// cos文件操作
const Cos = require('../../../js/cos-wx-sdk-v5')
const fileType = require('./fileFormats')
const util = require('./util')

let config = {
  Bucket: '',
  Region: ''
}

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
        config = res
        resolve(res)
      }, 500)
    }
  })
}

const getAuthorization = (options, callback) => {
  setTimeout(() => {
    // 模拟从服务器获取到Authorization
    // 服务器需要使用 appId、secretId、secretKey和时间戳 等生成 Authorization
    // 测试可使用腾讯云cos后台签名生成工具
    let Authorization = 'q-sign-algorithm=sha1&q-ak=AKIDMAvkKu6fs65nbBwebI3ZZLEwQo0wgTs9&q-sign-time=1598436371;1598439971&q-key-time=1598436371;1598439971&q-header-list=&q-url-param-list=&q-signature=f407f7b0eaaa3fd3065b8d9c88a27b0ae461ff19'
    callback({
      Authorization
    })
  }, 500)
}

const cos = new Cos({
  getAuthorization
})

const getBucket = (options = {}, obj = {},callback) => {
  // 获取存储桶内的数据,如果存在分隔则继续请求直至请求完成全部内容
  if (!obj.dirList) {
    obj.dirList = []
  }
  if (!obj.fileList) {
    obj.fileList = []
  }
  cos.getBucket(options, function (err, data) {
    if (err) {
      callback(obj)
    } else {
      obj.dirList = [...obj.dirList, ...data.CommonPrefixes]
      obj.fileList = [...obj.fileList, ...data.Contents]
      if (!data.IsTruncated) {
        options.Marker = data.NextMarker
        getBucket(options, obj, callback)
      } else {
        callback(obj)
      }
    }
  })
}

const getInfo = async (Key = '') => {
  // 通过 key 获取目录信息、文件名、文件类型
  let reg = /\/$/
  let bucketConfig = await getBucketConfig()
  let {
    Bucket,
    Region
  } = bucketConfig
  let prefix = 'https://' + Bucket + '.cos.' + Region + '.myqcloud.com/'
  let resData = {
    path: prefix + Key
  }
  let extension = util.getExtension(Key)
  if (fileType.img.includes(extension)) {
    resData.type = 'img'
  } else if (fileType.video.includes(extension)) {
    resData.type = 'video'
  } else if (fileType.audio.includes(extension)) {
    resData.type = 'audio'
  } else {
    resData.type = 'file'
  }
  if (reg.test(Key)) {
    resData.type = 'dir'
    let dirKey = Key.substr(0, Key.length - 1)
    resData.fileName = util.getFileName(dirKey)
  } else {
    resData.fileName = util.getFileName(Key)
    resData.extension = extension
  }

  return new Promise((resolve) => {
    resolve(resData)
  })
}

const getListInfo = async (list = []) => {
  let promiseList = []
  for (let i in list) {
    let Key = list[i].Key
    let Prefix = list[i].Prefix
    promiseList.push(getInfo(Key || Prefix))
  }
  return new Promise((resolve, reject) => {
    if (promiseList.length > 0) {
      Promise.all(promiseList).then((res) => {
        resolve(res)
      }).catch((err) => {
        reject(err)
      })
    } else {
      resolve([])
    }
  })
}

const dir = async (options = {}) => {
  // 获取文件夹内的内容
  // options参数：Prefix（文件夹）
  let bucketConfig = await getBucketConfig()
  let {
    Bucket,
    Region
  } = bucketConfig
  return new Promise((resolve, reject) => {
    getBucket({
      Bucket,
      Region,
      Prefix: options.Prefix || '',
      Delimiter: '/'
    }, {}, function (res) {
      let dirPromise = getListInfo(res.dirList)
      let filePromise = getListInfo(res.fileList)
      Promise.all([dirPromise, filePromise]).then((data) => {
        resolve({
          dirList: data[0],
          fileList: data[1]
        })
      }).catch((err) => {
        reject(err)
      })
    })
  })
}

const postObject = async (options) => {
  // 上传单个文件
  let bucketConfig = await getBucketConfig()
  return new Promise((resolve, reject) => {
    cos.postObject({
      Bucket: bucketConfig.Bucket,
      Region: bucketConfig.Region,
      Key: options.name,
      FilePath: options.filePath,
      TaskReady: function (taskId) {
        console.log(taskId)
      },
      onProgress: function (info) {
        console.log(JSON.stringify(info))
      }
    }, function () {
      resolve({
        status: 'success',
        FilePath: options.name
      })
    })
  })
}

const uploadFile = (options) => {
  let fileList = options.fileList
  let promiseList = []
  let path = options.path
  for (let i in fileList) {
    let filePath = fileList[i]
    let fileName = getRandFileName(filePath)
    promiseList.push(postObject({
      name: path + fileName,
      filePath: filePath
    }))
  }
  return new Promise((resolve, reject) => {
    Promise.all(promiseList).then((res) => {
      resolve(res)
    }).catch((err) => {
      reject(err)
    })
  })
}

const mkdir = async (options) => {
  // 创建文件夹
  let bucketConfig = await getBucketConfig()
  let path = options.path || ''
  let name = options.name || 'new folder'
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: bucketConfig.Bucket,
      Region: bucketConfig.Region,
      Key: path + name + '/',
      Body: '',
    }, function(err, data) {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
    })
  })
}

const removeFile = async (options) => {
  let bucketConfig = await getBucketConfig()
  let keyList = options.keyList || []
  let Objects = []
  for (let i in keyList) {
    Objects.push({
      Key: keyList[i]
    })
  }
  return new Promise((resolve, reject) => {
    cos.deleteMultipleObject({
      Bucket: bucketConfig.Bucket,
      Region: bucketConfig.Region,
      Objects: Objects
  }, function(err, data) {
      if (err) {
        reject(err)
      } else {
        console.log(data)
        resolve(data)
      }
  })
  })
}

const renameFile = async (options) => {
  let bucketConfig = await getBucketConfig()
  let {
    Bucket,
    Region
  } = bucketConfig
  let prefix = Bucket + '.cos.' + Region + '.myqcloud.com/'
  let key = options.key
  let newPath = options.newPath || ''
  console.log('源文件', prefix + key)
  console.log('新路径', newPath)
  return new Promise((resolve, reject) => {
    if (!key || !newPath) {
      reject(new Error('缺少参数'))
    }
    copyFile({
      from: prefix + key,
      to: newPath
    }).then((res) => {
      console.log(res)
      let keyList = []
      keyList.push(key)
      removeFile({
        keyList
      }).then((res) => {
        console.log(res)
        resolve('重命名成功')
      }).catch((err) => {
        console.log('remove error', err)
        reject(err)
      })
    }).catch((err) => {
      console.log('copy error', err)
      reject(err)
    })
  })
}

const copyFile = async (options) => {
  let bucketConfig = await getBucketConfig()
  let from = options.from || ''
  let to = options.to || ''
  from = encodeURI(from) // 转码路径 防止中文路径等复制时报错
  return new Promise((resolve, reject) => {
    cos.putObjectCopy({
      Bucket: bucketConfig.Bucket,
      Region: bucketConfig.Region,
      Key: to,
      CopySource: from
    }, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const getFileInfo = async (options) => {
  let bucketConfig = await getBucketConfig()
  let key = options.key || ''
  return new Promise((resolve, reject) => {
    cos.headObject({
      Bucket: bucketConfig.Bucket,
      Region: bucketConfig.Region,
      Key: key
    }, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const getRandFileName =  (filePath) => {
  var extIndex = filePath.lastIndexOf('.');
  var extName = extIndex === -1 ? '' : filePath.substr(extIndex);
  return parseInt('' + Date.now() + Math.floor(Math.random() * 900 + 100), 10).toString(36) + extName;
}

module.exports = {
  dir,
  uploadFile,
  mkdir,
  removeFile,
  getFileInfo,
  copyFile,
  renameFile
}