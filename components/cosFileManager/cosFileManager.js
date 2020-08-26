// components/cosFileManager/cosFileManager.js
const fsm = require('./js/fsm')
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    isShow: false,
    allPrefix: '', // 整个组件所使用的文件前缀，用于控制文件管理器只在cos中的某文件夹下操作,以 / 结尾
    dir: [], // 文件目录路径
    dirList: [], // 当前目录下的文件夹列表
    fileList: [], // 当前目录下的文件列表
    showInputModal: false, // 是否显示 inputModal
    value: '', // inputModal 中 input 绑定的值
    inputTitle: '输入', // inputModal title
    inputText: '请输入内容：', // inputModal text
    inputConfirm: '', // 存储inputModal点击确定时需要触发的方法
    rename: '', // 存储重命名时需要重命名的文件名
    showBack: false, // 是否显示左上角返回上级菜单按钮,
    mode: 'default', // 显示状态， default 为默认 select 为选取状态
    multiple: true, // 是否支持多选，默认true
    selectedName: '', // 被选中的单项的名称
    sizeConfig: { // 根据系统高度计算出的高度
      modalHeight: '',
      listHeight: ''
    }
  },

  lifetimes: {
    attached () {
      this.setSize()
    },
    detached () {
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    show (e = {}) {
      let prefix = e.prefix || e.path || ''
      let multiple = e.multiple
      if (multiple == false) {
        this.setData({
          multiple: false
        })
      }
      let reg = /\/$/
      if (prefix && prefix != '/' && reg.test(prefix)) {
        prefix = prefix.substr(0, prefix.length - 1)
        let dir = prefix.split('/')
        this.setData({
          allPrefix: prefix,
          isShow: true,
          dir
        })
      } else {
        this.setData({
          allPrefix: '',
          isShow: true,
          dir: []
        })
      }
      this.dir()
    },
    hide () {
      this.setData({
        isShow: false
      })
    },
    dir () {
      let t = this
      let dir = this.data.dir
      let prefix = ''
      if (dir.length != 0) {
        prefix = dir.join('/')
        prefix = prefix + '/'
      } else {
        prefix = ''
      }
      fsm.dir({
        Prefix: prefix
      }).then((res) => {
        t.setData({
          dirList: res.dirList,
          fileList: res.fileList
        })
        t.changeBackButton()
      })
    },
    toggleMode () {
      let mode = this.data.mode
      if (mode == 'default') {
        mode = 'select'
      } else {
        mode = 'default'
      }
      this.setData({
        mode
      })
    },
    tapFile (e) {
      let name = e.currentTarget.dataset.name
      let mode = this.data.mode
      let fileList = this.data.fileList
      if (mode == 'select') {
        for (let i in fileList) {
          if (fileList[i].fileName == name) {
            fileList[i].selected = !fileList[i].selected
          }
        }
      }
      this.setData({
        fileList
      })
    },
    tapDir (e) {
      let name = e.currentTarget.dataset.name
      if (this.data.mode == 'select') {
        wx.showToast({
          title: '请先退出多选模式',
          icon: 'none'
        })
        return
      }
      this.openDir(name)
    },
    openDir (name = '') {
      let dir = this.data.dir
      dir.push(name)
      this.setData({
        dir
      })
      this.dir()
    },
    getFileInfo (key) {
      fsm.getFileInfo({
        key: key
      }).then((res) => {
        console.log(res)
      })
    },
    changeBackButton () {
      let dir = this.data.dir
      let allPrefix = this.data.allPrefix
      console.log(dir)
      console.log(allPrefix)
      if (dir.join('/') == allPrefix) {
        this.setData({
          showBack: false
        })
      } else {
        this.setData({
          showBack: true
        })
      }
    },
    back () {
      let dir = this.data.dir
      dir.pop()
      this.setData({
        dir,
        showBack: false
      })
      this.dir()
    },
    add () {
      let t = this
      wx.showActionSheet({
        itemList: ['新建文件夹', '上传图片', '上传视频', '从聊天中上传其他文件'], // 小程序端暂不支持选取音频
        success (res) {
          if (res.tapIndex == 0) {
            t.showInputModal({
              title: '新建文件夹',
              text: '新建文件夹名称：',
              value: '新建文件夹',
              inputConfirm: 'mkdir'
            })
          } else if (res.tapIndex == 1){
            t.chooseImg()
          } else if (res.tapIndex == 2){
            t.chooseVideo()
          } else {
            t.chooseFile()
          }
        }
      })
    },
    input (e) {
      let name = e.currentTarget.dataset.name
      let value = e.detail.value
      this.setData({
        [name]: value
      })
    },
    showInputModal (e) {
      if (e) {
        this.setData({
          showInputModal: true,
          inputTitle: e.title || '输入',
          inputText: e.text || '请输入内容：',
          value: e.value || '',
          inputConfirm: e.inputConfirm || '',
          rename: e.rename || ''
        })
      } else {
        this.setData({
          showInputModal: true
        })
      }
    },
    hideInputModal () {
      this.setData({
        showInputModal: false,
        inputTitle: '输入',
        inputText: '请输入内容：',
        value: '',
        inputConfirm: '',
        rename: ''
      })
    },
    confirmInputModal () {
      let inputConfirm = this.data.inputConfirm
      if (inputConfirm == 'mkdir') {
        this.mkdir()
      } else if (inputConfirm == 'renameFile') {
        this.renameFile()
      }
    },
    mkdir () {
      let t = this
      let dir = t.data.dir
      let dirList = t.data.dirList
      let path = ''
      let name = t.data.value
      for (let i in dirList) {
        if (dirList[i].fileName == name) {
          wx.showToast({
            title: '已存在同名文件夹',
            icon: 'none'
          })
          return
        }
      }
      this.hideInputModal()
      if (dir.length > 0) {
        path = dir.join('/')
        path = path + '/'
      }
      fsm.mkdir({
        path,
        name: name
      }).then((res) => {
        t.dir()
      })
    },
    renameFile () {
      let t = this
      let dir = t.data.dir
      let dirList = t.data.dirList
      let path = ''
      let name = t.data.value
      let rename = t.data.rename
      for (let i in dirList) {
        if (dirList[i].fileName == name) {
          wx.showToast({
            title: '已存在同名文件',
            icon: 'none'
          })
          return
        }
      }
      this.hideInputModal()
      if (dir.length > 0) {
        path = dir.join('/')
        path = path + '/'
      }
      fsm.renameFile({
        key: rename,
        newPath: path + name
      }).then((res) => {
        console.log(res)
        t.dir()
      }).catch((err) => {
        console.log(err)
      })
    },
    removeFile (keyList = []) {
      fsm.removeFile({
        keyList
      }).then((res) => {
        console.log(res)
        this.dir()
      })
    },
    longpress (e) {
      let t = this
      let type = e.currentTarget.dataset.type
      let name = e.currentTarget.dataset.name
      if (type == 'dir') {
        t.dirActionSheet(name)
      } else {
        t.fileActionSheet(name)
      }
    },
    dirActionSheet (name) {
      let t = this
      let dir = t.data.dir
      let path = ''
      if (dir.length > 0) {
        path = dir.join('/')
        path = path + '/'
      }
      path = path + name + '/'
      if (t.data.mode == 'select') {
        wx.showToast({
          title: '请先退出多选模式',
          icon: 'none'
        })
        return
      }
      wx.showActionSheet({
        itemList: ['打开', '删除'],
        success (res) {
          if (res.tapIndex == 0) {
            t.openDir(name)
          } else if (res.tapIndex == 1) {
            wx.showModal({
              title: '警告',
              content: `要删除文件夹 ${name} 吗？其中的子文件及文件夹也会一并删除`,
              showCancel: true,
              confirmColor: '#e64340',
              confirmText: '确认删除',
              success (res) {
                if (res.confirm) {
                  let list = []
                  list.push(path)
                  t.removeFile(list)
                }
              }
            })
          }
        }
      })
    },
    fileActionSheet (name) {
      let t = this
      let dir = t.data.dir
      let path = ''
      if (dir.length > 0) {
        path = dir.join('/')
        path = path + '/'
      }
      path = path + name
      wx.showActionSheet({
        itemList: ['选取', '重命名', '删除'],
        success (res) {
          if (res.tapIndex == 0) {
            t.setData({
              selectedName: name
            })
            t.confirmModal()
          } else if (res.tapIndex == 1) {
            t.showInputModal({
              title: '重命名',
              text: '文件新名称：',
              value: name,
              inputConfirm: 'renameFile',
              rename: path
            })
          } else if (res.tapIndex == 2) {
            wx.showModal({
              title: '警告',
              content: `要删除文件 ${name} 吗？`,
              showCancel: true,
              confirmColor: '#e64340',
              confirmText: '确认删除',
              success (res) {
                if (res.confirm) {
                  let list = []
                  list.push(path)
                  t.removeFile(list)
                }
              }
            })
          }
        }
      })
    },
    chooseImg () {
      let t = this
      wx.chooseImage({
        count: 9,
        success (res) {
          let fileList = res.tempFilePaths
          t.upload(fileList)
        }
      })
    },
    chooseVideo () {
      let t = this
      wx.chooseVideo({
        success (res) {
          let fileList = []
          fileList.push(res.tempFilePath)
          t.upload(fileList)
        }
      })
    },
    chooseFile () {
      let t = this
      wx.chooseMessageFile({
        count: 100,
        type: 'file',
        success (res) {
          let fileList = []
          for (let i in res.tempFiles) {
            fileList.push(res.tempFiles[i].path)
          }
          t.upload(fileList)
        }
      })
    },
    upload (fileList = []) {
      let t = this
      let dir = t.data.dir
      let path = ''
      if (dir.length > 0) {
        path = dir.join('/')
        path = path + '/'
      }
      fsm.uploadFile({
        fileList,
        path
      }).then((res) => {
        t.dir()
      })
    },
    cancelModal () {
      this.setData({
        isShow: false,
        showInputModal: false, // 是否显示 inputModal
        value: '', // inputModal 中 input 绑定的值
        inputTitle: '输入', // inputModal title
        inputText: '请输入内容：', // inputModal text
        inputConfirm: '', // 存储inputModal点击确定时需要触发的方法
        rename: '', // 存储重命名时需要重命名的文件名
        showBack: false, // 是否显示左上角返回上级菜单按钮,
        mode: 'default', // 显示状态， default 为默认 select 为选取状态
        multiple: true, // 是否支持多选，默认true
        selectedName: ''
      })
    },
    confirmModal () {
      let mode = this.data.mode
      let fileList = this.data.fileList
      let selectedName = this.data.selectedName
      let selectedList = []
      if (mode == 'select') {
        for (let i in fileList) {
          if (fileList[i].selected) {
            selectedList.push(fileList[i])
          }
        }
      } else {
        for (let i in fileList) {
          if (fileList[i].fileName == selectedName) {
            selectedList.push(fileList[i])
          }
        }
      }
      let myEventDetail = {
        selectedList
      }
      let myEventOption = {}
      console.log(myEventDetail)
      this.triggerEvent('selected', myEventDetail, myEventOption)
      this.cancelModal()
    },
    setSize () {
      let systemInfo = wx.getSystemInfoSync()
      console.log(systemInfo)
      let { windowHeight, windowWidth } = systemInfo
      let width = 750
      let height = 0
      height = windowHeight / (windowWidth / width)
      if (height) {
        let sizeConfig = {
          modalHeight: height * 0.8 + 'rpx',
          listHeight: (height * 0.8 - 200) + 'rpx'
        }
        this.setData({
          sizeConfig
        })
      }
    }
  }
})
