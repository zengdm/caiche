//app.js
App({
  expireTime: 3600,
  onLaunch: function(res){
    //发布到线上及体验版本后要测试 何时会触发onLaunch， 目前测试onLaunch只会在冷启动的时候才会触发
    //开发版本时，一般只有初始化的时候才会触发一次，其余不再触发
    //开发版本目前测试为同一个手机每个微信号各自的storage相互独立，但是在真机调试时保留上一个账号的缓存，需要在线上和体验版本实测
    console.log('onLaunch');
    let that = this;
    let userInfo = wx.getStorageSync('userInfo');
    let uid = wx.getStorageSync('uid');
    let shareId = wx.getStorageSync('shareId'); //等同于uid 因为分享的时候有二维码太长的话不能生成，因为又专门写了个shareId;
    that.globalData.uid = uid;
    that.globalData.userInfo = userInfo;
    that.globalData.shareId = shareId;;
  },
  onShow: function(res){
    //场景值为1008 代表是从群消息卡片中进来的
    this.globalData.scene = res.scene;
  },
  //获取用户uid
  getUserOpenId: function (cb, textToastFn, page) {
    let that = this;
    if (that.globalData.uid && that.globalData.userInfo){
      typeof cb == "function" && cb(that.globalData.uid, that.globalData.userInfo);
    } else {
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
              data.inviter_uid = that.globalData.inviterMsg.inviter_uid;
              data.inviter_activity_id = that.globalData.inviterMsg.inviter_activity_id;
              //微信群消息卡片进入且分享类型为2表示为分享排行榜
              let inviter_type = that.globalData.inviterMsg.inviter_type;
              if (inviter_type){
                inviter_type = parseInt(inviter_type);
                if (inviter_type === 1 || (inviter_type === 2 && that.globalData.scene === 1008)){
                  data.inviter_type = inviter_type;
                }
              }
              console.log(data);
              that.globalData.userInfo = res.userInfo;
              wx.setStorageSync('userInfo', that.globalData.userInfo);
              wx.request({
                url: that.globalData.reqUrl + '/user/verifyWxUserInfo',
                data: data,
                method: 'POST',
                success: function (res) {
                  console.log('verifyWxUserInfo', res);
                  wx.hideLoading();
                  if(res.data.code==200){
                    let data = res.data.data;
                    let uid = data.uid;
                    let shareId = data.share_id;
                    let isGift = data.is_gift;
                    that.globalData.uid = uid;
                    that.globalData.shareId = shareId;
                    wx.setStorageSync('uid', uid);
                    wx.setStorageSync('shareId', shareId);
                    wx.setStorageSync('isGift', isGift);
                    typeof cb == "function" && cb(uid, that.globalData.userInfo, isGift);
                  } else {
                    let msg = res.data.message || '授权失败';
                    wx.showModal({
                      title: msg,
                      content: '点击确定按钮重新授权',
                      showCancel: false,
                      success: function (res) {
                        if (res.cancel) {
                        } else {
                          that.getUserOpenId(cb, textToastFn, page);
                        }
                      }
                    })
                  }
                }
              });
            }
          })
        }
      });
    }
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
    wxAuthorization: false, //微信授权状态，是否已授权
    //pageData: null,
    activity_id: '', //邀请别人的活动id
    inviterMsg: null, //若是别人邀请来的，这是邀请我的分享信息
    scene: '',  //场景值
    defaultUserImg: 'https://i2.dd-img.com/assets/image/1525764782-eec34b1f80e68382-512w-512h.png', //默认头像
    defaultShare: { //默认分享信息
      defaultImg: 'https://i2.dd-img.com/assets/image/1541490528-5188f472139cdcf2-405w-323h.jpg',
      defultTitle: '2018奇葩车祸现场，也只有女司机能做到了'
    },
    activity_id_changed: false
  }
})