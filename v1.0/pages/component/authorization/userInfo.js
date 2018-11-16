const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value:'',
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
   
  },
  /**
   * 组件的方法列表
   */
  methods: {
    getUserInfo:function(e){
      var that = this;
      app.globalData.userInfo = e.detail.userInfo;
      //说明授权了
      if (e.detail.userInfo) {
        this.setData({
          userInfo: e.detail.userInfo,
          show: false
        });
        app.getUserOpenId(function () {
          that.triggerEvent('changeStatus');
        });
      }else{
        wx.setStorageSync('userInfo', null);
        wx.setStorageSync('uid', '');
      }
    },
    hideUser:function(e){
      var that = this;
      that.setData({
        show: false
      });
    },
    poptouchmove: function () {
      return false;
    }
  }
})
