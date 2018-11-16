const app = getApp();
import { Timer } from '../../utils/timer.js';
import { Base64 } from '../../utils/base64.js';
const textToastFn = require('../component/textToast/textToast.js');
let dataReload = function(){
  return {
    data: null,
    isLoad: false,
    hasUserInfo: false,
    chosedId: '',
    activity_info: null,//奖品有关信息
    can_join: '',//是否可以参加
    has_prize: '',//是否还有奖品
    question: null,
    user_is_right: '',// 传uid的话，回答过就有固定问题传uid的话，回答过就有固定问题，有问题就会出现这个字段，0 为回答错误，1为回答正确
    authorizationShow: app.globalData.authorizationShow,

    showResult: false,
    showCorrectResult: false,
    hbShow: false,
    result: null,
    txtToast: {
      visible: !0,
      text: ''
    },
    timer: {
      time: 0,
      hour: '00',
      minute: '00',
      second: '00'
    },
    userShow: false,
    inviter_uid: 0, //邀请者uid 默认为0
    inviter_activity_id: 0, //邀请者分享活动时带的活动id 默认为0
    formId: '',
    shareImgPath: 'http://i2.dd-img.com/assets/image/1539160658-cd52631fe233e8cb-750w-600h.png',
    //分享弹窗是否隐藏
    shareShade:true,
    // 生成图片的临时路径
    tempFilePath:'',
    canvasPath:''
  }
}

let pageData = dataReload();
Page({
  data: pageData,
  onLoad: function (options) {
    wx.showLoading({
        title: '努力加载中...',
        mask: true
    });
    var that = this;
    //从小程序码进来
    let inviter_uid = 0,
        inviter_activity_id = 0;
    if (options.scene){
      let scene = decodeURIComponent(options.scene);
      let queryArr = scene.split(',');
      inviter_uid = queryArr[0] || 0;
      inviter_activity_id = queryArr[1] || 0;
    }else{
      inviter_uid = options.inviter_uid || 0;
      inviter_activity_id = options.inviter_activity_id || 0;
    }
    app.globalData.inviter_uid = inviter_uid;
    app.globalData.inviter_activity_id = inviter_activity_id;
    that.setData({
      inviter_uid: inviter_uid,
      inviter_activity_id: inviter_activity_id,
      authorizationShow: app.globalData.authorizationShow,
      userInfo: app.globalData.userInfo ? app.globalData.userInfo : null,
      flag: true
    });
    that.timeDown = null;
    this.getdata();
  },
  onShow: function(){
    let that = this;
    setTimeout(function(){
      that.refresh();
    }, 100)
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.refresh();
    // 下拉刷新和切换应用不切换题目，如果已选择答案仍旧选择原来的答案
    wx.stopPullDownRefresh(); //停止下拉刷新
  },
  //是否刷新判断
  refresh: function () {
    //如果有规则弹窗说明未授权不必刷新
    this.setData({
      authorizationShow: app.globalData.authorizationShow
    });
    if (app.globalData.authorizationShow && this.data.data){
      return;
    }
    //不带参数为onload,带参数说明是onshow
    this.getdata(1);
  },
  getdata:function(isshow){
    var that = this;
    if (!that.data.flag){
      return;
    }
    that.setData({
      flag: false
    });
    var data = {
      uid: app.globalData.uid,
      inviter_uid: that.data.inviter_uid,
      inviter_activity_id: that.data.inviter_activity_id
    }
    wx.request({
      method: 'POST',
      data:{
        uid: app.globalData.uid,
        inviter_uid: that.data.inviter_uid,
        inviter_activity_id: that.data.inviter_activity_id
      },
      url: app.globalData.reqUrl + '/activity/getCurrentActivity',
      success: function(res){
        res = res.data;
        if(res.code==200){
          let data = res.data;
          //控制是否刷新
          if (isshow && isshow ==1){
            //活动id不相同肯定要刷新
            let idChanged = data.activity_info && data.activity_info.id && app.globalData.pageData && app.globalData.pageData.activity_info && app.globalData.pageData.activity_info.id == data.activity_info.id;

            //活动id不同或者是固定的问题 刷新
            if (!data.random_ques || !idChanged){
              pageData = dataReload();
              that.setData(pageData);
              that.shareFn();
            } else {
              //不刷新但是要改变按钮的状态
              let show_data = {
                can_join: data.can_join || '',
                has_prize: data.has_prize || '',
                result: data.result || null,
                has_join_before: data.has_join_before || '',
                user_is_right: data.user_is_right || '',
                flag: true,
                isLoad: true
              }
              if (!that.data.data && app.globalData.pageData.data) {
                show_data.question = app.globalData.pageData.question
                show_data.activity_info = app.globalData.pageData.activity_info
                that.setData({
                  data: app.globalData.pageData
                });
              }
              if (data.user_is_right) { //代表参加过本次活动
                show_data.user_is_right = parseInt(data.user_is_right);
              }        
              that.setData(show_data);
              return;
            }
          }
          //把首页数据储存/更新 进全局数据中
          if (data && data instanceof Array && data.length===0){
            //没有该活动
            that.setData({
              data: null,
              isLoad: true,
              flag: true
            });
            app.globalData.pageData = null;
            return;
          }
          app.globalData.pageData = data;
          let chosedId = '';
          if (data && Object.prototype.toString.call({}) == "[object Object]") {
            if(data.option){
              for (let i = 0; i < data.option.length; i++) {
                let item = data.option[i];
                item.option_content = item.option_content.trim();
                if (item.is_choose == 1) {
                  chosedId = item.option_id;
                }
                if (i === 0) {
                  item.option_name = 'A'
                } else if (i === 1) {
                  item.option_name = 'B'
                } else if (i === 2) {
                  item.option_name = 'C'
                } else if (i === 3) {
                  item.option_name = 'D'
                }
              }
              that.setData({
                flag: true,
                question: {
                  options: data.option,
                  question_id: data.question_id,
                  question_img: data.question_img,
                },
                chosedId: chosedId
              });
            }else{
              //获取问题
              that.getQuestion();
            }
            if (!(data.has_prize && data.can_join)){
              let timeRange = data.activity_info.left_time;
              that.setData({
                'timer.time': timeRange+2
              });
              if (timeRange > 0) {
                //使用倒计时
                Timer.init(timeRange+2, that);
              }
            }
            let newData = {
              data: data,
              activity_info: data.activity_info,
              can_join: data.can_join || '',
              has_prize: data.has_prize || '',
              has_join_before: data.has_join_before || '',
              activity_id: data.activity_info && data.activity_info.id
            }
            if (!(data.user_is_right == undefined)){
              newData.user_is_right = parseInt(data.user_is_right);
            }else{
              newData.user_is_right ='';
            }
            that.setData(newData);
            if (!data.has_prize){ //奖金已瓜分完毕或者活动已结束
              that.setData({
                showResult: true
              });
            }
            if(!isshow){
              that.shareFn();
            }
          }
          that.setData({
            isLoad: true
          });
        } else {
          let msg = res.data.msg || '数据返回失败，请稍后重试';
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, msg);
          that.setData({
            flag: true
          });
        }
      },
      error: function(res){
        textToastFn.textToast.clearTextToast(that);
        textToastFn.textToast.showTextToast(that, '数据请求失败，请稍后重试');
        that.setData({
          flag: true
        });
      },
      complete:function(res){
        if (res.errMsg && res.errMsg!="request:ok"){
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '网络繁忙，请稍后重试');
        }
        wx.hideLoading();
      }
    })
  },
  //点击猜猜看授权
  getUserInfo: function(e) {
    var that = this;
    app.globalData.userInfo = e.detail.userInfo;
    //说明授权了
    if (e.detail.userInfo){
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true,
        authorizationShow: false
      });
      app.globalData.authorizationShow = false;
      app.getUserOpenId(function () {
        that.setData({
          flag: true
        })
        that.getdata();
      }, textToastFn, that, that.data.formId);
    }
  },
  userRecords: function(e){
    wx.navigateTo({
      url: '/pages/join/join',
    })
  },
  choseCx: function(e){
    let that = this;
    let dataset = e.target.dataset;
    let pserid = dataset.pserid || '773';
    if (that.data.has_prize && that.data.can_join && !that.data.result){ //奖金已瓜分完毕或者活动已结束
      that.setData({
        chosedId: dataset.id
      });
    }
    //跳转到电动邦小程序车系详情
    wx.navigateToMiniProgram({
      appId: 'wx08cd8cd9371fba0d', // 要跳转的小程序的appid
      path: '/pages/model/serie/serie?pserid=' + pserid, // 跳转的目标页面
      success(res) {
        // 打开成功  
      }
    }) 
  },
  submitFn: function(e){
    let that = this;
    textToastFn.textToast.clearTextToast(that);
    //如果已经结束，文本文案为随便逛一逛,点击跳转到电动邦小程序
    if (!that.data.data || (that.data.user_is_right !== '' && !that.data.can_join) || !that.data.has_prize){
      wx.navigateToMiniProgram({
        appId: 'wx08cd8cd9371fba0d', // 要跳转的小程序的appid
        path: '/tabBar/forum/forum', // 跳转的目标页面
        success(res) {
          // 打开成功  
        }
      });
      return;
    }
    //立即参与
    if (that.data.has_prize && that.data.can_join && !(that.data.result && (that.data.result.is_right === 0 || that.data.result.is_right === 1))){
      that.submitAnswer();
      return;
    }
    if (that.data.user_is_right === 0 || (that.data.result && that.data.result.is_right === 0)){ //已参加过该期，并且回答错误
      that.reload();
      return;
    }
    //点击立即领奖
    if (that.data.result && that.data.result.is_right === 1 && that.data.result.money>0){
      that.setData({
        hbShow: true
      });
    }
  },
  submitAnswer: function(){
    var that = this;
    if (!that.data.chosedId) {
      textToastFn.textToast.clearTextToast(that);
      textToastFn.textToast.showTextToast(that, '请您选择一个答案');
      return;
    }
    wx.showLoading({
      title: '努力加载中...',
      mask: true
    });
    let data ={
      uid: app.globalData.uid,
      activity_id: that.data.activity_info.id,
      question_id: that.data.question.question_id,
      option_choose_id: that.data.chosedId,
      option_str: JSON.stringify(that.data.question.options),
      formId: that.data.formId || ''
    };
    wx.request({
      url: app.globalData.reqUrl+ '/activity/commitChoose',
      method: 'POST',
      data: data,
      success: function(res){
        //code 500 请问重复提交
        if(res.data.code==200){
          let data = res.data.data;
          data.is_right = parseInt(data.is_right);
          if (data.money>0){
            data.money = parseFloat(data.money).toFixed(2);
          }else{
            data.money = 0;
          }
          that.data.result = data;
          that.setData({
            result: that.data.result
          });
        } else if (res.data.code == 501){
          //没有登录
          that.setData({
            userShow: true
          });
        } else {
          var msg = res.data.message || '请求失败'
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, msg);
        }
      },
      error:function(res){
        textToastFn.textToast.clearTextToast(that);
        textToastFn.textToast.showTextToast(that, '请求失败');
      },
      complete: function(res){
        wx.hideLoading();
      }
    })
  },
  closeBoxFn: function(){
    this.reload();
  },
  formSubmit: function(e){
    let that = this;
    that.setData({
      formId: e.detail.formId
    });
  },
  reload: function(){
    pageData = dataReload();
    this.setData(pageData);
    this.getdata();
  },
  changeStatus: function(){
    this.reload();
  },
  onShareAppMessage: function(res){
    let that = this;
    let path = '/pages/index/index';
    if(res.from === 'button'){
      app.globalData.shareId = app.globalData.shareId || wx.getStorageSync('shareId');
      if (app.globalData.shareId && that.data.activity_info && that.data.activity_info.id) {
        path += '?inviter_uid=' + app.globalData.shareId + '&inviter_activity_id=' + that.data.activity_info.id;
      }
    }else{
      console.log('顶部转发')
    }
    return{
      title: '猜中这是什么车，你就把车和我一起带走吧',
      path: path,
      imageUrl: that.data.shareImgPath,
      success:function(res){
        that.data.shareShade = true;
        that.setData({
          shareShade: that.data.shareShade
        })
      }
    }
  },
  //获取自定义组件的参数
  // getShareImg: function(e){
  //   let that = this;
  //   that.data.tempFilePath = e.detail.tempFilePath
  // },

  poptouchmove: function(){
    return false;
  },
  previewImage: function(e){
    var current = e.target.dataset.src;
    if (current){
       wx.previewImage({
        current: current,
        urls: [current]
      })
    }
  },
  getQuestion: function(){
    let that =  this;
    wx.request({
      url: app.globalData.asgUrl + '/miniprogram/caiche/ques_map.json',
      success: function(res){
        if (res && res.data && res.data.total){
          that.getQuestionNext(res.data.total);
        }else{
          let msg = res.data.msg || '数据返回失败，请稍后重试';
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, msg);
          that.setData({
            flag: true
          });
        }
      },
      error: function(){
        let msg = res.data.msg || '数据返回失败，请稍后重试';
        textToastFn.textToast.clearTextToast(that);
        textToastFn.textToast.showTextToast(that, msg);
        that.setData({
          flag: true
        });
      }
    })
  },
  getQuestionNext: function(num){
    let that = this;
    wx.request({
      url: app.globalData.asgUrl + '/miniprogram/caiche/quest_' +  Math.floor(Math.random()*num)+ '.json',
      success: function (res) {
        if (res && res.data && res.data.option) {
          let data = res.data;
          let option = data.option;
          let currentId = Base64.decode(data.token) - 20181016 - data.question_id;
          let newOption= []; //随机生成的四个选项
          let currentOption = {}; 
          data.option.map(function(item, index){
            if (item.option_id == currentId){
              currentOption = item;
              data.option.splice(index, 1); 
              return;
            }
          });
          let errorOptionsIndexs = that.createRandom(3, 0, data.option.length);
          for (let i = 0; i < errorOptionsIndexs.length;i++){
            newOption.push(data.option[errorOptionsIndexs[i]]);
          }
          newOption = that.randomInsert(currentOption, newOption );
          for (let i = 0; i < newOption.length; i++) {
            let item = newOption[i];
            item.option_content = item.option_content.trim();
            if (item.is_choose == 1) {
              chosedId = item.option_id;
            }
            if (i === 0) {
              item.option_name = 'A'
            } else if (i === 1) {
              item.option_name = 'B'
            } else if (i === 2) {
              item.option_name = 'C'
            } else if (i === 3) {
              item.option_name = 'D'
            }
          }
          if (!that.data.question){
            that.data.question = {};
          }
          that.data.question.options = newOption;
          that.data.question.question_id = data.question_id;
          that.data.question.question_img = data.question_img;
          that.data.question.question_title = data.question_title;
          that.setData({
            question: that.data.question
          });
          app.globalData.pageData.question = that.data.question;
        } else {
          let msg = res.data.msg || '数据返回失败，请稍后重试';
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, msg);
        }
      },
      error: function () {
        let msg = res.data.msg || '数据返回失败，请稍后重试';
        textToastFn.textToast.clearTextToast(that);
        textToastFn.textToast.showTextToast(that, msg);
      },
      complete: function(){
        that.setData({
          flag: true
        });
      }
    })
  },
  //产生不重复的随机数
  createRandom: function(num, min, max){
    let arr = [], obj = {};
    while (arr.length < num) {
      let newNum = Math.floor(Math.random() * max);
      if (!obj[newNum]){
        arr.push(newNum);
        obj[newNum] = 1;
      } 
    }
    return arr;
  },
  //把也个元素随机插入到一个数组中
  randomInsert: function (item, arr) {
    arr.splice(Math.random() * arr.length, 0, item);
    return arr;
  },
  //出现分享弹窗
  getShareShade:function(e){
    var that = this;
    that.data.shareShade = false;
    that.setData({
      shareShade: that.data.shareShade
    })
  },
  //关闭分享弹窗
  shareCancel: function (e) {
    var that = this;
    that.data.shareShade = true;
    that.setData({
      shareShade: that.data.shareShade
    })
  },

  //保存图片到相册
  saveImg: function () {
    var that = this;
    wx.saveImageToPhotosAlbum({
      filePath: that.data.tempFilePath,
      success(res) {
        wx.showModal({
          content: '海报已保存，请在相册中选择并分享到朋友圈',
          showCancel: false,
          confirmText: '确定',
          confirmColor: '#333',
          success: function (res) {
            if (res.confirm) {
              that.data.shareShade = true;
              that.setData({
                shareShade: that.data.shareShade
              })
            }
          }
        })
      },
      complete:function(res){
      }
    })
  },
  //生成图片
  picture: function () {  
    let that = this;
    let promise1 = new Promise(function (resolve, reject) {
      /* 获得要在画布上绘制的图片 */
      wx.getImageInfo({
        src: that.data.canvasPath,
        success: function (res) {
          resolve(res);
        }
      })
    });
    let promise2 = new Promise(function (resolve, reject) {
      wx.getImageInfo({
        src: 'http://i2.dd-img.com/assets/image/1539845766-2a338179c276aaaa-1500w-2668h.jpg',
        success: function (res) {
          resolve(res);
        }
      })
    });

    Promise.all(
      [promise1, promise2]
    ).then(res => {
      const ctx = wx.createCanvasContext('shareCanvas');
      ctx.drawImage(res[1].path, 0, 0, 375, 667)
      ctx.drawImage(res[0].path, 49, 557, 100, 100)
      /* 绘制 */
      ctx.stroke()
      ctx.draw(false, that.drawPicture);
    })
  },
  drawPicture: function () { //生成图片
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
          that.data.tempFilePath = res.tempFilePath;
        },
      })
    
  },
  shareFn: function(){
    let that = this;
    if (that.data.authorizationShow) {
      return;
    }
    let shareId = app.globalData.shareId || '',
      activity_id = that.data && that.data.activity_info && that.data.activity_info.id ? that.data.activity_info.id : '';
    let scene = shareId + ',' + activity_id;
    wx.request({
      method: 'POST',
      url: app.globalData.reqUrl + '/user/pq_code?path=pages/index/index&width=280&scene=' + scene,
      success(res) {
        that.data.canvasPath = app.globalData.asgUrl + '/miniprogram/caiche/qr/' + res.data.data.filename
        that.picture();
      }
    })
  }
})
