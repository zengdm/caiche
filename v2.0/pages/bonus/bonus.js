const textToastFn = require('../component/textToast/textToast.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 生成图片的临时路径
    tempFilePath: '',
    canvasPath: '',
    hbShow: false,
    userData: {},
    my_share_card: {},
    headerImg: '',
    isAvatarChange: false, //头像是否改变
    //底部提示框样式和文案
    txtToast: {
      visible: !0,
      text: ''
    },
    isCreating: true,
    showModal: false,
    modelSubTit: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '努力加载中...',
      marsk: true
    });
    this.fs = wx.getFileSystemManager();
    this.getData();
   
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },
  shareFn: function(){
    //生成海报应进一步优化，针对相同的shareId和activity_id只生成一次即可，下次可从缓存中拿到
    var that = this;
    let shareId = app.globalData.shareId || '',
        activity_id = app.globalData.activity_id || '',
        old_prize_data = wx.getStorageSync('my_prize_data'),
        my_share_card = wx.getStorageSync('my_share_card'),
        userData = that.data.userData,
        user_header_img = app.globalData.userInfo.avatarUrl || 'https://i2.dd-img.com/assets/image/1525764782-eec34b1f80e68382-512w-512h.png';
    //数据如果相等则不必请求
    let isEqual = !old_prize_data || old_prize_data.join_times != userData.join_times || old_prize_data.right_times != userData.right_times || old_prize_data.total_balance != userData.total_balance || old_prize_data.total_rank != userData.total_rank || old_prize_data.wrong_times != userData.wrong_times || my_share_card.avatarUrl !== user_header_img;
    wx.setStorageSync('my_prize_data', userData);
    console.log(my_share_card.avatarUrl, user_header_img, my_share_card.avatarUrl === user_header_img);
    if (!my_share_card ||  my_share_card.avatarUrl !== user_header_img) {
      if (!my_share_card) {
        my_share_card = {};
      }
      my_share_card.avatarUrl = user_header_img;
      wx.setStorageSync('my_share_card', my_share_card);//更新头像
      that.setData({
        isAvatarChange: true
      })
    }
    that.setData({
      my_share_card: my_share_card
    });
    
    //数据相同不需重新生成图片且存在prev_activity_id
    if (activity_id && !app.globalData.activity_id_changed && !isEqual){
      //判断文件系统中临时存储的图片是否存在，如果存在直接返回图片
      if (my_share_card && my_share_card.temporaryCardSrc) {
        try {
          that.fs.accessSync(my_share_card.temporaryCardSrc);
          console.log('shareFn 直接返回temporaryCardSrc');
          that.setData({
            tempFilePath: my_share_card.temporaryCardSrc
          })
          wx.hideLoading();
        } catch (e) {
          console.log('shareFn', 'temporaryCardSrc不存在重新生成');
          my_share_card.temporaryCardSrc = '';
          wx.setStorageSync('my_share_card', my_share_card);
          that.setData({
            my_share_card: my_share_card
          })
          that.getQRCode(shareId, activity_id);
        }
        return;
      }
      //本地文件中不存在要重新请求
      that.getQRCode(shareId, activity_id);
    }else{
      console.log('数据不相等需要重新生成');
      my_share_card.temporaryCardSrc = '';
      wx.setStorageSync('my_share_card', my_share_card);
      that.setData({
        my_share_card: my_share_card
      })
      that.getQRCode(shareId, activity_id);
    }
  },
  getQRCode: function(shareId, activity_id){
    let that = this;
    let scene = shareId + ',' + activity_id;
    wx.request({
      method: 'POST',
      url: app.globalData.reqUrl + '/user/pq_code?path=pages/index/index&width=280&scene=' + scene,
      success(res) {
        that.data.canvasPath = app.globalData.asgUrl + '/miniprogram/caiche/qr/' + res.data.data.filename
        that.picture();
      },
      complete: function(res){
        if (typeof (res.statusCode) == 'undefined' || (res.statusCode != 200) || (res.errMsg && res.errMsg != "request:ok")) {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '网络繁忙，请稍后重试');
          wx.hideLoading();
        }
      } 
    });
  },
  //生成图片
  picture: function () {
    let that = this;
    let promise1 = new Promise(function (resolve, reject) {
      /* 获得要在画布上绘制的图片 */
      wx.getImageInfo({
        src: that.data.canvasPath,
        success: function (res) {
          console.log('promise1请求成功了', res.path);
          resolve(res);
        }
      })
    });
    let promise2 = new Promise(function (resolve, reject) {
      let cardBg = that.data.my_share_card.cardBg;
      if (cardBg) {
        console.log('carbg地址在缓存里');
        //还要检查carbg是否在缓存里
        try {
          that.fs.accessSync(cardBg);
          console.log('carbg在本地文件缓存里有', cardBg );
          resolve(cardBg);
        } catch (e) {
          console.log('carbg在本地文件缓存里没有，重新请求');
          that.data.my_share_card.cardBg = '';
          wx.setStorageSync('my_share_card', that.data.my_share_card);
          that.setData({
            my_share_card: that.data.my_share_card
          })
          that.getCardBg(resolve);
        }
      } else {
        console.log('carbg地址不在缓存里，重新请求');
        that.getCardBg(resolve);
      }
    });
    // 头像 
    let head = new Promise(function (resolve, reject) {
      //头像改变需要重绘
      if (that.data.isAvatarChange){
        console.log('头像改变需要重绘');
        that.getHeader(resolve);
      //没有改变
      } else {
        let avatarSrc = that.data.my_share_card.avatarSrc;
        if (avatarSrc){
          try {
            that.fs.accessSync(avatarSrc);
            console.log('header在本地文件缓存里有');
            resolve(avatarSrc);
          } catch (e) {
            console.log('header在本地文件缓存里没有，重新请求');
            that.data.my_share_card.avatarSrc = '';
            wx.setStorageSync('my_share_card', that.data.my_share_card);
            that.setData({
              my_share_card: that.data.my_share_card
            })
            that.getHeader(resolve);
          }
        } else {
          console.log('header缓存中不存在要重绘');
          that.data.my_share_card.avatarSrc = '';
          wx.setStorageSync('my_share_card', that.data.my_share_card);
          that.setData({
            my_share_card: that.data.my_share_card
          })
          that.getHeader(resolve);
        }
      }
    });
    let headborder = new Promise(function (resolve, reject) {
      let avatarBg = that.data.my_share_card.avatarBg;
      if (avatarBg) {
        try {
          that.fs.accessSync(avatarBg);
          console.log('headerbg在本地文件缓存里有', avatarBg );
          resolve(avatarBg);
        } catch (e) {
          console.log('headerbg在本地文件缓存里没有，重新请求');
          that.data.my_share_card.avatarBg = '';
          wx.setStorageSync('my_share_card', that.data.my_share_card);
          that.setData({
            my_share_card: that.data.my_share_card
          })
          that.getHeaderBg(resolve);
        }
      } else {
        console.log('头像背景改变需要重绘');
        that.getHeaderBg(resolve);
      }
    });

    Promise.all(
      [promise1, promise2, head, headborder]
    ).then(res => {
      const ctx = wx.createCanvasContext('shareCanvas');

      console.log('resolve', res[1], res[0], res[2], res[3]);
      ctx.drawImage(res[1], 0, 0, 375, 667)
      ctx.drawImage(res[0].path, 49, 557, 100, 100)
      ctx.drawImage(res[2], 162, 348, 48, 48)
      ctx.drawImage(res[3],148, 333, 78, 78)

      
      ctx.setFillStyle('#fff001')                       
      ctx.setFontSize(50) 
      ctx.setTextAlign('center');
      // 分别是上右左下的顺序
      ctx.fillText(that.data.userData.join_times, 187.5, 310)  
      ctx.fillText(that.data.userData.wrong_times, 287, 396) 
      ctx.fillText(that.data.userData.right_times, 92, 396) 
      ctx.fillText(that.data.userData.total_rank, 187.5, 496) 

      ctx.setFillStyle('#e40600')
      ctx.font = 'bold 10px normal'; 
      ctx.setFontSize(70)
      ctx.rotate(-11 * Math.PI / 180)
      // 战绩
      ctx.fillText(that.data.userData.total_balance, 118, 194)
      ctx.setFontSize(24)        
      ctx.fillText('元', 240, 194)        
      /* 绘制 */
      ctx.stroke()
      console.log('要走drawPicture了哦')
      ctx.draw(false, that.drawPicture);
    })
  },
  getCardBg: function (resolve) {
    console.log("进入了获取cardBg的方法里了");
    let that = this;
    wx.getImageInfo({
      src: 'https://i2.dd-img.com/assets/image/1540457121-c45e531d9f87b889-750w-1334h.jpg',
      success: function (res) {
        console.log('cardBg获取成功，promise2要返回了', res.path);
        let temporarypic = res.path;
        that.fs.saveFile({
          tempFilePath: temporarypic,
          success: function (res) {
            let cardBg = res.savedFilePath;
            resolve(cardBg);
            that.data.my_share_card.cardBg = cardBg;
            that.setData({
              my_share_card: that.data.my_share_card
            })
            wx.setStorageSync('my_share_card', that.data.my_share_card);
            console.log("cardBg获取成功，并且保存在缓存和本地文件里了", cardBg);
          },
          fail: function(){
            resolve(temporarypic);
          }
        })
      },
      fail: function(res){
        console.log('getCardBg请求失败', res)
        wx.hideLoading();
      }
    })
  },
  getHeader: function (resolve){
    console.log("进入了获取getHeader的方法里了");
    let that = this;
    let src = that.data.my_share_card.avatarUrl;
    console.log('getHeader', that.data.my_share_card, src);
    wx.getImageInfo({
      src: src,
      success: function (res) {
        let temporarypic = res.path;
        that.fs.saveFile({
          tempFilePath: temporarypic,
          success: function (res) {
            let avatarSrc = res.savedFilePath;
            resolve(avatarSrc);
            that.data.my_share_card.avatarSrc = avatarSrc;
            that.setData({
              my_share_card: that.data.my_share_card
            })
            wx.setStorageSync('my_share_card', that.data.my_share_card);
            console.log("getHeader获取成功，并且保存在缓存和本地文件里了", avatarSrc);
          },
          fail: function(){
            resolve(temporarypic);
          }
        })
      },
      fail: function (res) {
        console.log('getHeader请求失败', res)
        wx.hideLoading();
      }
    })
  },
  getHeaderBg: function (resolve){
    console.log("进入了获取getHeaderBg的方法里了");
    let that=this;
    wx.getImageInfo({
      src: "https://i2.dd-img.com/assets/image/1540460969-48f7ee2bb5a152dd-156w-156h.png",
      success: function (res) {
        let temporarypic = res.path;
        that.fs.saveFile({
          tempFilePath: temporarypic,
          success: function (res) {
            let avatarBg = res.savedFilePath;
            resolve(avatarBg);
            that.data.my_share_card.avatarBg = avatarBg;
            wx.setStorageSync('my_share_card', that.data.my_share_card);
            that.setData({
              my_share_card: that.data.my_share_card
            })
            console.log("getHeaderBg获取成功，并且保存在缓存和本地文件里了", avatarBg);
          },
          fail: function(){
            resolve(temporarypic);
          }
        })
      },
      fail: function (res) {
        console.log('getHeaderBg请求失败', res)
        wx.hideLoading();
      }
    })
  },
  drawPicture: function () { //生成图片
    console.log('进入到最后一步的方法里了')
    var that = this;
    wx.canvasToTempFilePath({ //把当前画布指定区域的内容导出生成指定大小的图片，并返回文件路径
      x: 0,
      y: 0,
      width: 375,
      height: 667,
      destWidth: 750,  //输出的图片的宽度
      destHeight: 1334,
      canvasId: 'shareCanvas',
      success: function (res) {
        let temporarypic = res.tempFilePath;
        console.log('最后一步请求成功，生成了临时图片路径，可以直接显示图片了', temporarypic);
        that.setData({
          tempFilePath: temporarypic
        });
        that.data.my_share_card.temporaryCardSrc = temporarypic;
        that.setData({
          my_share_card: that.data.my_share_card
        });
        wx.setStorageSync('my_share_card', that.data.my_share_card);
        console.log("最后一步成功，并且把生成的temporarypic保存在缓存和本地文件里了", temporarypic);
      },
      fail: function (res) {
        console.log('最后一步drawPicture请求失败', res)
      },
      complete: function(){
        wx.hideLoading();
      }
    })

  },

  //保存图片到相册
  saveImgAction: function () {
    var that = this;
    //是否授权
    wx.getSetting({
      success: function (res) {
        let writePhotosAlbum = res.authSetting["scope.writePhotosAlbum"];
        if (writePhotosAlbum) {
          //已授权
          that.saveImgFn();
        } else if (writePhotosAlbum != undefined && writePhotosAlbum != true){
          //拒绝授权了
          that.setData({
            showModal: true,
            modelSubTit: '您还未授权保存图片到相册，请确认授权'
          })
        } else {
          that.saveImgFn();
        }
      }
    })
  },
  saveImgFn: function(){
    let that = this;
    if (!that.data.tempFilePath){
      console.log(that.data.tempFilePath)
      // that.shareFn();
      // textToastFn.textToast.clearTextToast(that);
      // textToastFn.textToast.showTextToast(that, '图片正在生成中，请稍后');
      // return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: that.data.tempFilePath,
      success(res) {
        wx.showModal({
          content: '海报已保存，请在相册中选择并分享到朋友圈',
          showCancel: false,
          confirmText: '确定',
          confirmColor: '#333',
          success: function (res) {

          }
        })
      },
      fail: function (res) {
        console.log('保存图片请求失败', res)
        wx.hideLoading();
        if (res.errMsg ==='saveImageToPhotosAlbum:fail auth deny'){
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '您拒绝了授权无法保存图片');
        } else if (res.errMsg === 'saveImageToPhotosAlbum:fail file not found'){
          that.shareFn();
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '图片生成失败，请稍后再试');
        } else {
          //saveImageToPhotosAlbum:fail cancel 可能是取消保存了
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '保存失败');
        }
      }
    })
  },
  getData: function(){
    let that = this;
    wx.request({
      url: app.globalData.reqUrl + '/user/userData',
      data:{
        uid: app.globalData.uid,
      },
      method: 'POST',
      success: function(res){
        if(res.data.code === 200){
          let data = res.data.data;
          data.total_balance = parseFloat(data.total_balance).toFixed(2);
          let headerImg = app.globalData.userInfo.avatarUrl || 'https://i2.dd-img.com/assets/image/1525764782-eec34b1f80e68382-512w-512h.png';
          that.setData({
            userData: data,
            headerImg: headerImg
          });
          that.shareFn();
        } else if(res.data.code === 501){
          //没有登录
          that.clearUserStorage();
          that.setData({
            userShow: true
          });
        }
      },
      complete:function(res){
        if (typeof (res.statusCode) == 'undefined' || (res.statusCode != 200 && res.statusCode != 501) || (res.errMsg && res.errMsg != "request:ok")) {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '数据返回失败，请稍后重试');
          wx.hideLoading();
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  //只清除用户登录信息
  clearUserStorage: function () {
    if (app.globalData.uid || app.globalData.shareId) {
      wx.removeStorageSync('uid');
      wx.removeStorageSync('shareId');
      wx.removeStorageSync('isGift');
      app.globalData.uid = '';
      app.globalData.shareId = '';
    }
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let that = this;
    let shareId = app.globalData.shareId || '';
    let activity_id = app.globalData.activity_id;
    let path = '/pages/index/index?inviter_uid=' + shareId + '&inviter_activity_id=' + activity_id;
    let title = app.globalData.defaultShare.defultTitle;
    let img = app.globalData.defaultShare.defaultImg;
    return {
      title: title,
      path: path,
      imageUrl: img
    }
  },
  submitFn: function(){
    this.setData({
      hbShow: true
    });
  },
  closeBoxFn: function () {
    this.setData({
      hbShow: false
    });
  },
  poptouchmove: function () {
    return false;
  },
  changeStatus: function () {
    this.reload();
  },
  reload: function(){
    let that = this;
    that.setData({
      tempFilePath: '',
      canvasPath: '',
      hbShow: false,
      userData: {},
      my_share_imgs: {}
    });
    that.getData();
  },
  //针对用户保存图片的时候可能会拒绝授权，再次点击时需要调起授权窗口
  openSetting: function(){
    let that = this;
    //调起授权弹窗
    wx.openSetting({
      success(res) {
        console.log(res);
        //同意授权
        that.setData({
          showModal: false,
          modelSubTit: ''
        });
        if (res.authSetting["scope.writePhotosAlbum"]) {
          that.saveImgFn();
        }
        if (res.authSetting["scope.userInfo"] != undefined && res.authSetting["scope.userInfo"]!= true ){
          app.globalData.wxAuthorization = false;
          that.setData({
            userShow: true
          });
          wx.clearStorageSync();
        }
      }
    });
  },
  btnCancel: function(){
    this.setData({
      showModal: false,
      modelSubTit: ''
    })
  }
})