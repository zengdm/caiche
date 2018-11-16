//app.js
App({
  onLaunch: function(res){
    // console.log('onLaunch', res, this.globalData);
    // if (res.scene === 1007 || res.scene === 1008 || res.scene === 1012 || res.scene === 1013 || res.scene === 1014 || res.scene === 1047 || res.scene === 1047 || res.scene === 1047) {
    //   this.globalData.authorizationShow = true;
    // }
  },
  onShow: function(res){
    //console.log('appshow', res, this.globalData);
    //通过分享卡片，长按图片识别二维码，手机相册选取二维码，小程序模板消息弹出活动规则弹窗授权
    //1011文档说为扫描二维码，经测试分享的时候回来场景值也为1011
    this.globalData.uid = this.globalData.uid || wx.getStorageSync('uid');
    this.globalData.shareId = this.globalData.shareId || wx.getStorageSync('shareId');
    this.globalData.userInfo = this.globalData.userInfo || wx.getStorageSync('userInfo');
  },
  //获取用户uid
  getUserOpenId: function (cb, textToastFn, page, formId) {
    let that = this;
      wx.showLoading({
        title: '努力加载中...',
        mask: true
      });
      wx.login({
        success: function (res) {
          var code = res.code;
          var data = {
            code: code
          };
          wx.getUserInfo({
            success: function (res) {
              data.userData = res.encryptedData;
              data.iv = res.iv;
              data.signature = res.signature;
              data.inviter_uid = that.globalData.inviter_uid
              data.inviter_activity_id = that.globalData.inviter_activity_id
              that.globalData.userInfo = res.userInfo;
              wx.setStorageSync('userInfo', that.globalData.userInfo);
              if (formId){
                data.formId = formId
              }
              wx.request({
                url: that.globalData.reqUrl + '/user/verifyWxUserInfo',
                data: data,
                method: 'POST',
                success: function (res) {
                  if(res.data.code==200){
                    let uid = res.data.data.uid;
                    let shareId = res.data.data.share_id;
                    that.globalData.uid = uid;
                    that.globalData.shareId = shareId;
                    wx.setStorageSync('uid', uid);
                    wx.setStorageSync('shareId', shareId);
                    typeof cb == "function" && cb(that.globalData.uid, that.globalData.userInfo);
                  } else {
                    let msg = res.data.message || '授权失败';
                    wx.showModal({
                      title: msg,
                      content: '点击确定按钮重新授权',
                      showCancel: false,
                      success: function (res) {
                        if (res.cancel) {
                        } else {
                          that.getUserOpenId(cb, textToastFn, page, formId);
                        }
                      }
                    })
                  }
                },
                complete: function(){
                  wx.hideLoading();
                }
              });
            }
          })
        }
      });
    //}
  },
  //系统信息
  getSystemInfo: function (cb) {
    var that = this;
    if (that.globalData.systemMsg) {
      typeof cb == "function" && cb(this.globalData.systemMsg);
    } else {
      //调用登录接口
      wx.getSystemInfo({
        success: function (res) {
          var systemMsg = {};
          systemMsg.width = res.windowWidth;
          systemMsg.height = res.windowHeight;
          that.globalData.systemMsg = systemMsg;
          typeof cb == "function" && cb(that.globalData.systemMsg);
        }
      })
    }

  },
  globalData: {
    userInfo: null, //用户信息
    uid: '', //用户uid
    shareId: '',//分享id
    reqUrl:"http://test.miniapi.diandong.com",//测试环境地址
    //reqUrl: "https://miniapi.diandong.com", //线上环境地址
    asgUrl: "https://asg.diandong.com",
    systemMsg: null, //系统信息
    authorizationShow: true, //是否显示活动规则
    inviter_uid: '',
    inviter_activity_id: '',
    pageData: null
  }
})