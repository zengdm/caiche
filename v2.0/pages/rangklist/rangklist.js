// pages/rangklist/rangklist.js
const textToastFn = require('../component/textToast/textToast.js');
let app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    defaultImg: app.globalData.defaultUserImg,
    //底部提示框样式和文案
    txtToast: {
      visible: !0,
      text: ''
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '努力加载中...',
    });
    this.loadData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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
  loadData: function(){
    let that = this;
    wx.request({
      url: app.globalData.asgUrl + '/miniprogram/caiche/test_rank/rank.json',
      success: function(res){
        that.setData({
          list: res.data
        });
      },
      complete: function(res){
        if (typeof (res.statusCode) == 'undefined' || (res.statusCode != 200) || (res.errMsg && res.errMsg != "request:ok")) {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '数据返回失败，请稍后重试');
        }
        wx.hideLoading();
      }
    })

  },
  onShareAppMessage: function (e) {
    console.log(e)
    let title = app.globalData.defaultShare.defultTitle;
    let img = app.globalData.defaultShare.defaultImg;
    let path = '/pages/index/index?inviter_uid=' + app.globalData.shareId + '&inviter_activity_id=' + app.globalData.activity_id;;
    //右上角转发 计算在邀请人数中 //inviter_uid 邀请人的uid即我的uid, inviter_activity_id邀请时候的活动id ,inviter_type 邀请的类型
    //按钮转发 不计算在邀请人数中 要点分享按钮才有可能发一元钱 必须是从群里点击进入小程序的且授权了分享者才能获得这一元钱
    if(e.from==='button'){
      title = '老司机排位赛开始了，敢不敢跟我PK';
      path += '&inviter_type=' + 2;
      img = 'https://i2.dd-img.com/assets/image/1541143945-fc25ca2dd9d3990a-408w-328h.jpg';
    }
    return {
      title: title,
      path: path,
      imageUrl: img //转发显示图片的链接
    }
  }
})