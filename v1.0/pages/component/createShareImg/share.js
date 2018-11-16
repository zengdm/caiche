const app = getApp();
Component({
  // options:{ //组件自定义设置

  // },
  properties: { //对外属性，即如果外部的wxml文件传入数据时，会把数据设置成properties的属性
   'inviter_uid':{
     type: String || Number ,
     value: '',
     observer: function (newData, oldData, changedPath) {
       console.log();
      let scene = newData + ',' + app.globalData.pageData.activity_info.id;
      // scene = JSON.stringify(scene);
      wx.request({
        method: 'POST',
        url: app.globalData.reqUrl + '/user/pq_code?path=pages/index/index&width=280&scene=' + scene,
        success(res) {
          console.log(res);
        }
      })
    }
   },
    'inviter_activity_id': {
      type: String || Number,
      value: '',
      observer: function (newData, oldData, changedPath) {
        let scene = newData + ',' + app.globalData.pageData.activity_info.id;
        wx.request({
          method: 'POST',
          url: app.globalData.reqUrl + '/user/pq_code?path=pages/index/index&width=280&scene=' + scene,
          success(res) {
            console.log(res);
          }
        })
      }
    },
  },
  data: { //于页面中data一致。只是data只在组件内部使用
    imgPath: "", //分享的图片路径
    tempFilePath:'',
  },
  attached:function(){
    console.log(this.properties);
  },
  ready: function(){
    this.picture();
    
  },
  methods:{
    picture: function () {  //生成图片
      let that = this;
      
      let promise1 = new Promise(function (resolve, reject) {
        /* 获得要在画布上绘制的图片 */
        wx.getImageInfo({
          src: 'http://i2.dd-img.com/assets/image/1539761283-34f7c845598c6d82-227w-223h.png',
          success: function (res) {
            resolve(res);
          }
        })
      });
      let promise2 = new Promise(function (resolve, reject) {
        wx.getImageInfo({
          src: 'http://i2.dd-img.com/assets/image/1539758007-c9b8a7b2fa887bcc-750w-1334h.jpg',
          success: function (res) {
            resolve(res);
          }
        })
      });

      Promise.all(
        [promise1, promise2]
      ).then(res => {

        /* 创建 canvas 画布 */
        const ctx = wx.createCanvasContext('shareCanvas', this); 

        
        ctx.drawImage(res[1].path, 0, 0, 375, 667)
        ctx.drawImage(res[0].path, 34, 550, 114, 114)

        /* 绘制 */
        ctx.stroke()
        ctx.draw(false, that.drawPicture(this));//draw()的回调函数 
      
      })
    },
    drawPicture: function (e) { //生成图片
       var that = this;
      setTimeout(function(){
        wx.canvasToTempFilePath({ //把当前画布指定区域的内容导出生成指定大小的图片，并返回文件路径
          x: 0,
          y: 0,
          width: 375,
          height: 667,
          destWidth: 375,  //输出的图片的宽度
          destHeight: 667,
          canvasId: 'shareCanvas',
          success: function (res) {
            // console.log(res.tempFilePath);
            // that.draw_uploadFile(res);
            // that.saveImg(res.tempFilePath);
            that.data.tempFilePath = res.tempFilePath;
            that.triggerEvent('getShareImg', { "tempFilePath": that.data.tempFilePath });
          },
        }, e)
      },300)
    },
    save:function(){
      var that = this;
      wx.saveImageToPhotosAlbum({
        filePath: that.data.tempFilePath,
        success(res) {
          console.log(res);
        }
      })
    },
    //保存图片到相册
    saveImg:function(imgPath){
      // console.log(imgPath)
      wx.saveImageToPhotosAlbum({
        filePath: imgPath,
        success(res) {
         console.log(res);
        }
      })
    },
    draw_uploadFile: function (r) { //wx.uploadFile 将本地资源上传到开发者服务器
      let that = this;
      wx.uploadFile({
        url: app.globalData.uploadUrl+ '/globals/photo/upload', 
        filePath: r.tempFilePath,
        name: 'imgFile',
        success: function (res) {
          console.log(res);
          if(res.statusCode==200){
            res.data = JSON.parse(res.data);
            let imgsrc = res.data.data.src;
            console.log(imgsrc)
            that.setData({
              imgPath: imgsrc
            });
            that.triggerEvent('getShareImg', {imgsrc});
          }else{
            console.log('失败')
          }
        },
      })
    },
  }
  // _propertyChange: function (newVal, oldVal, changedPath){
  //   console.log('属性值改变')
  // }

})