const app = getApp();
const textToastFn = require('../component/textToast/textToast.js');
let dataReload = function(){
  return {
    options: null,
    is_right: '',
    img: '',
    hbShow: false,
    txtToast: {
      visible: !0,
        text: ''
      },
    userShow: false
  }
}
let pageData = dataReload();
Page({
  data: pageData,
  onLoad: function (options) {
    var that = this;
    //从列表页进来
    if(options && options.data){
      let data = JSON.parse(options.data);
      that.setData({
        img: data.img,
        is_right: data.is_right,
        total_prize: data.total_prize,
        prize_amount: data.prize_amount,
        options: data.option
      });
    }
    //首页
    if(!app.globalData.userInfo || !app.globalData.uid){
      wx.getSetting({
        success(res) {
          if (res.authSetting['scope.userInfo']) {
            app.getUserOpenId(function () {
            }, textToastFn, that);
          } else {
            that.setData({
              userShow: true
            })
          }
        }
      })
    }
  },
  choseCx: function(e){
    let that = this;
    let dataset = e.target.dataset;
    let pserid = dataset.pserid;
    //跳转到电动邦小程序车系详情
    wx.navigateToMiniProgram({
      appId: 'wx08cd8cd9371fba0d', // 要跳转的小程序的appid
      path: '/pages/model/serie/serie?pserid=' + pserid, // 跳转的目标页面
      success(res) {
        // 打开成功  
      }
    }) 
  },
  closeBoxFn: function(){
    this.setData({
      hbShow: false
    });
  },
  submitFn: function (e) {
    let that = this;
    textToastFn.textToast.clearTextToast(that);
    if (that.data.is_right === 0 ) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
      return;
    }
    //点击立即领奖
    if (that.data.is_right === 1 && that.data.prize_amount > 0) {
      that.setData({
        hbShow: true
      });
      return;
    }
  },
  /**
* 用户点击右上角分享
*/
  onShareAppMessage: function () {
    return {
      title: '猜中这是什么车，你就把车和我一起带走吧',
      // desc: '自定义分享描述',
      path: '/pages/index/index',
      imageUrl: 'https://i2.dd-img.com/assets/image/1539160658-cd52631fe233e8cb-750w-600h.png' //转发显示图片的链接
    }
  },
  poptouchmove: function () {
    return false;
  },
  previewImage: function (e) {
    var current = e.target.dataset.src;
    if (current) {
      wx.previewImage({
        current: current,
        urls: [current]
      })
    }
  }
})
