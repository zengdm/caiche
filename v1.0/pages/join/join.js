// pages/join/join.js
const app = getApp();
const textToastFn = require('../component/textToast/textToast.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    scrollH:0,
    isLoad: false,//页面是否加载完毕
    isHideLoadMore:true, //底部正在加载的显示
    pager:0,
    totalPage: 0,
    size: 10,
    listdata:[],
    nowData:'', //获取当前时间
    imgPath: "http://i2.dd-img.com/assets/image/1539160658-cd52631fe233e8cb-750w-600h.png", //分享的图片路径
    userShow: false,
    bonus:'0.00', //奖金
    hbShow: false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    app.getSystemInfo(function (systemMsg) {
      that.setData({
        scrollH: systemMsg.height + 'px'
      })
    });
    if (!app.globalData.userInfo || !app.globalData.uid){
      wx.getSetting({
        success(res) {
          if (res.authSetting['scope.userInfo']) {
            app.getUserOpenId(function () {
              that.getdata();
            }, textToastFn, that);
          }else {
            that.setData({
              userShow: true
            })
          }
        }
      })
    } else {
      that.getdata();
    }
    let nowTime = new Date();   
    that.setData({
      nowData: Math.floor(nowTime.getTime())
    })    
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  //join.json -- "enablePullDownRefresh": true   // 启动下拉刷新
  onPullDownRefresh: function () {
    let that = this;
    that.setData({
      isLoad: false,
      pager: 0,
      totalPage: 0,
      size: 10,
      userShow: false,
      listdata: [],
    })
    if (!app.globalData.userInfo || !app.globalData.uid) {
      wx.getSetting({
        success(res) {
          if (res.authSetting['scope.userInfo']) {
            app.getUserOpenId(function () {
              that.getdata();
            }, textToastFn, that);
          }
        }
      })
    } else {
      setTimeout(function(){
        that.getdata();
     },200);
      
    }
    wx.stopPullDownRefresh(); //停止下拉刷新
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.getdata();
  },
  getdata: function () {
    let that = this;
    if (!that.data.isHideLoadMore || (that.data.pager!==0 && that.data.totalPage<=that.data.pager)) {
      return;
    }
    if (that.data.pager !== 0){
      that.setData({
        isHideLoadMore: false
      });
    }
    that.data.pager ++;
    wx.showLoading({
      title: '努力加载中...',
      mask: true //是否显示透明蒙层防止触摸穿透
    });
    let data = {
      uid: app.globalData.uid,
      page: that.data.pager,
      size: that.data.size
    }
    wx.request({
      method: 'POST',
      data: { 
        uid: app.globalData.uid,
        page: that.data.pager,    
        size: that.data.size
      },
      url: app.globalData.reqUrl + '/user/userActivityJoinList',
      success: function (res) {
        res = res.data;   
        if(res.code == 200){       
          for (let i in res.data.list){
            let list = res.data.list[i]; 
            if (list.start_time){
              list.start_time = list.start_time.replace(/-/g, '/');
              let startTime = new Date(list.start_time).getTime();
              list.start = startTime;
            }  
            if (list.end_time){
              list.end_time = list.end_time.replace(/-/g, '/');
              let endTime = new Date(list.end_time).getTime();
              list.end = endTime;
            }                   
          } 
        
          if (that.data.pager===1){
            that.setData({
              isLoad: true,
              totalPage: res.data.total_page
            });
          }
          let list = that.data.listdata.concat(res.data.list);
          let balance = parseFloat(res.data.account_info.balance).toFixed(2);       
          that.setData({
            pager: that.data.pager,
            listdata: list,
            bonus: balance
          })
        } else if (res.code == 501){ //没有登录
          that.setData({
            userShow: true
          })
        } else {
          let msg = res && res.data && res.data.msg ? res.data.msg : '数据返回失败，请稍后重试';
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, msg);
        }
       
      },
      error: function (res) {
        console.log(res)
      },
      complete: function () { //请求完成后执行的函数
        wx.hideLoading();
        that.setData({
          isHideLoadMore: true
        });
      }
    })
  },
  jump: function(e){
    let data = JSON.stringify(e.currentTarget.dataset.data);
    wx.navigateTo({
      url: '../detail/index?data='+data,
    })
  },
  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function () {
    return {
      title: '猜中这是什么车，你就把车和我一起带走吧',
      // desc: '自定义分享描述',
      path: '/pages/index/index',
      imageUrl: this.data.imgPath //转发显示图片的链接
    }
  },
  changeStatus: function(){
    this.setData({
      isLoad: false,
      pager: 0,
      totalPage: 0,
      size: 10,
      listdata: []
    });
    this.getdata();
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
  }
})