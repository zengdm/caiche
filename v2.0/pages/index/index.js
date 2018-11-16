const app = getApp();
import { Timer } from '../../utils/timer.js';
import { Base64 } from '../../utils/base64.js';
const textToastFn = require('../component/textToast/textToast.js');
let dataReload = function () {
  return {
    data: null, //getdata请求回来的数据
    isLoad: false, //是否显示整个页面
    flag: true, // 稀释getdata请求开关
    chosedId: '', // 选中的option_id
    hbShow: false, //领取红包提示弹窗
    result: null, //选择答案之后的结果
    //底部提示框样式和文案
    txtToast: {
      visible: !0,
      text: ''
    },
    //倒计时
    timer: {
      time: 0,
      hour: '00',
      minute: '00',
      second: '00'
    },
    //授权弹窗
    userShow: false,
    formId: '',
    //分享弹窗是否隐藏
    shareShade: true,
    //生成分享卡片的缓存数据
    index_share_card: {},
    // 生成图片的临时路径
    tempFilePath: '',
    cardSrc: '', //生成的图片地址
    canvasPath: '',
    isHasCard: false,
    //首次点击选项的提示是否显示
    showSkipTip: false,
    //是否显示规则弹窗
    showRule: false,
    //是否显示授权弹窗或者收下10元新人红包弹窗
    authorizationShow: false,
    //是否领取过10元红包
    isGift: false,
    //领取成功之后的模态窗 两种情况公用一个样式 领取新人红包之后和猜对答案立即领奖之后
    showModal: false,
    modelSubTit: '',
    modleShareType: '',
    //跳转的车系id
    cxid: ''
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
    let clickOptionsShade = wx.getStorageSync('clickOptionsShade');
    //从小程序码进来
    let inviter_uid = 0, //邀请我来的人的uid
      inviter_activity_id = 0, //邀请我来的人的activity_id
      inviter_type = 0;
    if (options.scene) {
      let scene = decodeURIComponent(options.scene);
      let queryArr = scene.split(',');
      inviter_uid = queryArr[0] || 0;
      inviter_activity_id = queryArr[1] || 0;
    } else {
      inviter_uid = options.inviter_uid || 0;
      inviter_activity_id = options.inviter_activity_id || 0;
      inviter_type = options.inviter_type || 0;
    }
    console.log('options', options);
    app.globalData.inviterMsg = {
      inviter_uid: inviter_uid,
      inviter_activity_id: inviter_activity_id,
      inviter_type: inviter_type
    }
    console.log('onload', app.globalData.inviterMsg);
    that.setData({
      userInfo: app.globalData.userInfo ? app.globalData.userInfo : null,
      clickOptionsShade: clickOptionsShade
    });
    that.timeDown = null;
    wx.getSetting({
      success: (res) => {
        console.log(res);
        let authSetting = res.authSetting;
        if (authSetting['scope.userInfo']) {
          app.globalData.wxAuthorization = true;
          // if (!app.globalData.uid || !app.globalData.userInfo){
          //   that.setData({
          //     userShow: true
          //   });
          // }
        }
        this.getdata();
      }
    });
    that.fs = wx.getFileSystemManager();
    wx.getSavedFileList({
      success(res) {
        console.log('本地文件', res)
        // for (let item of res.fileList){
        //   that.fs.removeSavedFile({
        //     filePath: item.filePath,
        //     complete(res) {
        //       console.log('删除临时文件', res)
        //     }
        //   })
        // }
      }
    })
  },
  // onShow: function () {
  //   let that = this;
  //   setTimeout(function () {
  //     that.refresh();
  //   }, 100)
  // },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh(); //停止下拉刷新
    //this.refresh();
    this.reload();
    // 下拉刷新和切换应用不切换题目，如果已选择答案仍旧选择原来的答案
    
  },
  //是否刷新判断
  // refresh: function () {
  //   let that = this;
  //   that.reload()
  // },
  getdata: function (isGift) {
    var that = this;
    if (!that.data.flag) {
      return;
    }
    that.setData({
      flag: false
    });
    wx.request({
      method: 'POST',
      data: {
        uid: app.globalData.uid
      },
      url: app.globalData.reqUrl + '/activity/getCurrentActivity',
      success: function (res) {
        console.log('get-data', res);
        res = res.data;
        if (res.code == 200) {
          let data = res.data;
          //用个用户每次进入的题目是随机的，备选答案也是随机排序的；
          //用户分配好题目和答案后，在没有回答之前，每次进入都是相同的题目，需要本地记录题目和答案内容（除非删除小程序清空缓存）
          //把首页数据储存/更新 进全局数据中
          if (data && data instanceof Array && data.length === 0) {
            console.log('没有数据')
            //没有该活动
            that.setData({
              data: null,
              isLoad: true,
              flag: true
            });
            //pageData 
            //app.globalData.pageData = null;
            app.globalData.invite_id = '';
            return;
          }
          //如果存在数据
          if (data && Object.prototype.toString.call(data) == "[object Object]") {
            let preve_activity_id = wx.getStorageSync('activity_id');
            let activity_id = data.activity_info && data.activity_info.id ? data.activity_info.id : (data.question_activity_id ? data.question_activity_id : '');
            app.globalData.activity_id = activity_id;
            wx.setStorage({
              key: 'activity_id',
              data: activity_id,
            });
            console.log(preve_activity_id != activity_id)
            if (preve_activity_id != activity_id){
              app.globalData.activity_id_changed = true;
            }
            if(data.can_join){
              console.log('可以参加')
              let questionData = wx.getStorageSync('questionData');
              //如果未参与过且活动id相同，不刷新题
              if (questionData && Object.prototype.toString.call(questionData) == "[object Object]" && questionData.activity_info && questionData.activity_info.id === activity_id){
                //app.globalData.pageData = questionData;
                that.setData({
                  data: questionData,
                  flag: true,
                  isLoad: true,
                });
                return;
              } else {
                that.data.data = data;
                that.setData({
                  data: that.data.data
                })
              }
            }
            //app.globalData.pageData = data;
            //已经参加了本期活动，则会返回question和答案
            if (data.option) {
              let chosedId = '';
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
              let newData = {
                question: {
                  options: data.option,
                  question_id: data.question_id,
                  question_img: data.question_img,
                },
                'activity_info': data.activity_info,
                'can_join': data.can_join,
                'user_is_right': data.user_is_right,
              }
              if (data.need_take_prize){
                newData.need_take_prize = data.need_take_prize;
                newData.prize_amount = data.prize_amount
              }
              that.setData({
                flag: true,
                data: newData,
                chosedId: chosedId
              });
              if (!data.can_join && !data.need_take_prize) {
                let timeRange = data.activity_info.left_time;
                that.setData({
                  'timer.time': timeRange + 2
                });
                if (timeRange > 0) {
                  //使用倒计时
                  Timer.init(timeRange + 2, that);
                }
              }
              console.log(that.data.data);
            } else {
              //获取问题
              console.log('没有option')
              that.getQuestion();
            }
          }
          setTimeout(function(){
            that.setData({
              isLoad: true
            });
          }, 200)
        } 
      },
      complete: function (res) {
        if (typeof (res.statusCode) == 'undefined' || (res.statusCode != 200) || (res.errMsg && res.errMsg != "request:ok")) {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '网络繁忙，请稍后重试');
          that.setData({
            flag: true
          });
        }
        if (app.globalData.wxAuthorization){
          //不仅要授权也要
          //需要优化，同一个uid和活动时不需要重复生成 活动已结束时也不需要生成
          if (isGift === 0){
            //未领取, 已弹窗直接走领取接口
            that.getNewHb();
            if (that.data.data && !that.data.authorizationShow) {
              that.shareFn();
            }
          } else if (isGift === undefined){
            isGift = wx.getStorageSync('isGift');
            if (isGift === 0){
              that.getNewHb();
            } else if (!isGift) {//缓存中不存在
              that.isGetGift();
            }
          }
          if (isGift === 0 || isGift === 1){
            if (that.data.data && !that.data.authorizationShow) {
              that.shareFn();
            }
          }
          that.setData({
            isGift: isGift
          });
        }else{
          //没有授权 也要弹出新人10元红包作为授权的界面
          //要清除授权之前的本地缓存
          that.clearUserStorage();
          app.globalData.wxAuthorization = false;
          that.setData({
            authorizationShow: true
          });
        }
        wx.hideLoading();
      }
    })
  },
  //已授权的状态下需要判断是否需要弹出新人10元红包的弹窗 该接口为新人10元红包 is_gift为1未领取 为0已领取
  isGetGift: function (){
    let that = this;
    wx.request({
      url: app.globalData.reqUrl + '/user/checkGift',
      method: 'post',
      data: {
        uid: app.globalData.uid,
      },
      success: function(res){
        console.log('isGetGift', res);
        if(res.data.code===200){
          let isGift = res.data.data.is_gift;
          that.setData({
            isGift: isGift //初始化为false, 没领过为0，已领过为1
          });
          wx.setStorageSync('isGift', isGift);
          if(isGift===0){
            that.getNewHb();
          } else if (isGift === 1) {
            that.setData({
              authorizationShow: false
            });
          }
          //要优化
          if (that.data.data) {
            that.shareFn();
          }
        }else if(res.data.code === 501){
          //未授权，可能是账号已被清
          that.clearUserStorage();
          app.globalData.wxAuthorization = false;
          that.setData({
            authorizationShow: true
          });
        }
      }
    })
  },
  //点击收下了授权
  getUserInfo: function (e) {
    var that = this;
    app.globalData.userInfo = e.detail.userInfo;
    //说明授权了
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        authorizationShow: false
      });
      app.globalData.wxAuthorization = true;
      app.getUserOpenId(function (uid, userInfo, isGift) {
        that.setData({
          flag: true,
          userInfo: userInfo,
          isGift: isGift
        });
        if (isGift==1){
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '您已经领取过红包了');
        }
        console.log('isGift',isGift,typeof isGift );
        that.getdata(isGift);
        //that.getdata('getUserInfo');
      }, textToastFn, that);
    }
  },
  //获取新人10元红包
  getNewHb: function(){
    let that = this;
    wx.request({
      url: app.globalData.reqUrl + '/user/takeGift',
      method: 'post',
      data: {
        uid: app.globalData.uid,
        formId: that.data.formId
      },
      success: function(res){
        console.log('getNewHb', res);
        if(res.data.code === 200){
          that.setData({
            authorizationShow: false
          });
          wx.setStorageSync('isGift', 1);
          if (res.data.data.is_gift && res.data.data.is_gift === 1) {
            //说明已经领取过
            textToastFn.textToast.clearTextToast(that);
            textToastFn.textToast.showTextToast(that, '您已经领取过红包了');
            return;
          }
          that.setData({
            showModal: true,
            modal_share: true,
            modelSubTit: '红包已放入您的账户，再发10元红包给好友吧',
            modleShareType: 'new'
          });
        }
      },
      complete: function(res){
        if (typeof (res.statusCode) == 'undefined' || (res.statusCode != 200) || (res.errMsg && res.errMsg != "request:ok")) {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '领取失败，请稍后重试');
        }
      }
    })
  },
  //清除全部缓存
  // clearStorage: function(){
  //   let that = this;
  //   wx.clearStorage({
  //     success: function (res) {
  //       app.globalData.uid = '';
  //       app.globalData.shareId = '';
  //       app.globalData.userInfo = null;
  //       app.globalData.wxAuthorization = false;
  //       that.setData({
  //         authorizationShow: true
  //       });
  //     }
  //   })
  // },
  //只清除用户登录信息
  clearUserStorage: function(){
    if (app.globalData.uid || app.globalData.shareId){
      wx.removeStorageSync('uid');
      wx.removeStorageSync('shareId');
      wx.removeStorageSync('isGift');
      app.globalData.uid = '';
      app.globalData.shareId = '';
    }
  },
  userRecords: function (e) {
    if(!app.globalData.uid || !app.globalData.userInfo){
      that.setData({
        userShow: true
      })
      return;
    }
    wx.navigateTo({
      url: '/pages/bonus/bonus',
      success: function(){
      }
    })
  },
  choseCx: function (e) {
    let that = this;
    let dataset = e.target.dataset;
    let pserid = dataset.pserid;
    
    
    console.log(that.data.clickOptionsShade);
    if (!that.data.clickOptionsShade){
      that.setData({
        cxid: pserid
      });
      //设置已点过
      that.data.clickOptionsShade = true;
      wx.setStorageSync( "clickOptionsShade", true);
      that.setData({
        clickOptionsShade: that.data.clickOptionsShade,
        showSkipTip: true
      });
      return;
    }
    //跳转到电动邦小程序车系详情
    wx.navigateToMiniProgram({
      appId: 'wx08cd8cd9371fba0d', // 要跳转的小程序的appid
      path: '/pages/model/serie/serie?pserid=' + pserid, // 跳转的目标页面
      success(res) {
        // 打开成功
        if (that.data.data.can_join && !that.data.result) {
          that.setData({
            chosedId: dataset.id
          });
        }  
      }
    })
  },
  //选项提示弹窗中的确定
  confirmShade:function(e){
    this.setData({
      showSkipTip: false
    });
    wx.navigateToMiniProgram({
      appId: 'wx08cd8cd9371fba0d', // 要跳转的小程序的appid
      path: '/pages/model/serie/serie?pserid=' + this.data.cxid, // 跳转的目标页面
      success(res) {
        // 打开成功  
      }
    });
  },
  submitFn: function (e) {
    let that = this;
    textToastFn.textToast.clearTextToast(that);
    //如果已经结束，文本文案为随便逛一逛,点击跳转到电动邦小程序
    if (!that.data.data || (!that.data.data.can_join && !that.data.data.need_take_prize)) {
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
    if ( that.data.data.can_join && !(that.data.result && (that.data.result.is_right === 0 || that.data.result.is_right === 1))) {
      that.submitAnswer();
      return;
    }
    if (that.data.data.user_is_right === 0 || (that.data.result && that.data.result.is_right === 0)) { //已参加过该期，并且回答错误
      that.reload();
      return;
    }
    //点击立即领奖
    if ((that.data.result && that.data.result.is_right === 1 && that.data.result.money > 0) || that.data.data.need_take_prize ) {
      //弹出分享模态框，必须分享给新的好友，新好友授权过回答正确的钱才能发如个人账户
      that.setData({
        showModal: true,
        modal_share: true,
        modelSubTit: '分享给好友，好友得红包你得奖金',
        modleShareType: 'result_success'
      });
    }
  },
  submitAnswer: function () {
    var that = this;
    if (!that.data.chosedId) {
      textToastFn.textToast.clearTextToast(that);
      textToastFn.textToast.showTextToast(that, '请您选择一个答案');
      return;
    }
    that.setData({
      flag: false
    });
    let data = {
      uid: app.globalData.uid,
      activity_id: that.data.data.activity_info.id,
      question_id: that.data.data.question.question_id,
      option_choose_id: that.data.chosedId,
      option_str: JSON.stringify(that.data.data.question.options),
      formId: that.data.formId || ''
    };
    wx.request({
      url: app.globalData.reqUrl + '/activity/commitChoose',
      method: 'POST',
      data: data,
      success: function (res) {
        console.log('commitChoose', res);
        //code 500 请问重复提交
        if (res.data.code == 200) {
          let data = res.data.data;
          data.is_right = parseInt(data.is_right);
          if (data.money > 0) {
            data.money = parseFloat(data.money).toFixed(2);
          } else {
            data.money = 0;
          }
          that.data.result = data;
          that.setData({
            result: that.data.result
          });
        } else if (res.data.code == 501) {
          that.clearUserStorage();
          //没有登录
          that.setData({
            userShow: true
          });

        } else {
          var msg = res.data.message || '请求失败'
          if (res.data.code === 500 && Object.prototype.toString.call(res.data.data) == "[object Object]"){
            let data = res.data.data;
            if (data.need_invite){
              msg = '需要邀请' + data.need_invite +'名好友才能继续参加'
            }
          }
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, msg);
        }
      },
      error: function (res) {
        textToastFn.textToast.clearTextToast(that);
        textToastFn.textToast.showTextToast(that, '请求失败');
      },
      complete: function (res) {
        that.setData({
          flag: true
        });
      }
    })
  },
  closeBoxFn: function () {
    this.reload();
  },
  formSubmit: function (e) {
    let that = this;
    that.setData({
      formId: e.detail.formId
    });
  },
  reload: function () {
    pageData = dataReload();
    this.setData(pageData);
    this.getdata();
  },
  changeStatus: function () {
    this.setData({
      userInfo: app.globalData.userInfo ? app.globalData.userInfo : null,
    });
    this.reload();
  },
  //点击右上角分享计入邀请人数
    //点击新人红包成功之后再发10元红包给好友
    //title: 2018奇葩车祸现场，也只有女司机能做到了
    //img: https://i2.dd-img.com/assets/image/1541148378-ead80a36e2605fd7-408w-327h.jpg
    //除了回答正确分享不计邀请人之外其余的都记
  onShareAppMessage: function (res) {
    let that = this;
    let shareId = app.globalData.shareId || '';
    let activity_id = app.globalData.activity_id;
    let path = '/pages/index/index?inviter_uid=' + shareId + '&inviter_activity_id=' + activity_id;
    let title = app.globalData.defaultShare.defultTitle;
    let img = app.globalData.defaultShare.defaultImg;
    if (res.from === 'button') {
      let type = res.target.dataset.type;
      //新人10元领券成功后分享
      if(type === 'new'){
        if (that.data.showModal) {
          that.setData({
            showModal: false,
            modal_share: false,
            modelSubTit: '',
            modleShareType: ''
          });
        }
        title = '十块钱红包，白给还不要？';
        img = 'https://i2.dd-img.com/assets/image/1541148378-ead80a36e2605fd7-408w-327h.jpg';
      //向好友求助
      } else if (type === 'ask-help'){ 
        title ='江湖救急，帮忙看看这是什么车！';
        img = that.data.data.question.question_img;
      //猜中之后立即领奖需要邀请好友授权才能得到奖金
      } else if (type === 'result_success'){
        img = 'https://i2.dd-img.com/assets/image/1541484621-49961004253130a1-408w-328h.jpg';
        title = '又答对了，这么简单的题，是在撒钱吗~~';
        path += '&inviter_type=1';
        if (that.data.showModal) {
          that.setData({
            showModal: false,
            modal_share: false,
            modelSubTit: '',
            modleShareType: ''
          });
        }
      } else if (type === 'header_pop_share'){
        that.shareCancel();
      } 
    } 
    return {
      title: title,
      path: path,
      imageUrl: img
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
  },
  getQuestion: function () {
    let that = this;
    wx.request({
      url: app.globalData.asgUrl + '/miniprogram/caiche/ques_map.json',
      success: function (res) {
        if (res && res.data && res.data.total) {
          that.getQuestionNext(res.data.total);
        }
      },
      complete: function(res){
        if (typeof (res.statusCode) == 'undefined' || (res.statusCode != 200) || (res.errMsg && res.errMsg != "request:ok")) {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '数据返回失败，请稍后重试');
          that.setData({
            flag: true
          });
        }
      }
    })
  },
  getQuestionNext: function (num) {
    let that = this;
    wx.request({
      url: app.globalData.asgUrl + '/miniprogram/caiche/quest_' + Math.floor(Math.random() * num) + '.json',
      success: function (res) {
        if (res && res.data && res.data.option) {
          let data = res.data;
          let option = data.option;
          let currentId = Base64.decode(data.token) - 20181016 - data.question_id;
          let newOption = []; //随机生成的四个选项
          let currentOption = {};//正确选项1个
          data.option.map(function (item, index) {
            if (item.option_id == currentId) {
              currentOption = item;
              data.option.splice(index, 1);
              return;
            }
          });
          let errorOptionsIndexs = that.createRandom(3, 0, data.option.length);//三个错误答案
          for (let i = 0; i < errorOptionsIndexs.length; i++) {
            newOption.push(data.option[errorOptionsIndexs[i]]);
          }
          newOption = that.randomInsert(currentOption, newOption); //重新随机生成四个答案
          console.log('正确答案', currentOption);
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
          let question = {
            options: newOption,
            question_id: data.question_id,
            question_img: data.question_img,
            question_title: data.question_title
          };
          that.setData({
            "data.question": question
          });
          //app.globalData.pageData.question = question;
          //没有参加之前都是同一个问题
          if(that.data.data.can_join){
            wx.setStorageSync('questionData', that.data.data);
          }
          console.log(that.data.data);
        } else {
          let msg = res.data.msg || '数据返回失败，请稍后重试';
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, msg);
        }
      },
      complete: function (res) {
        if (typeof (res.statusCode) == 'undefined' || (res.statusCode != 200) || (res.errMsg && res.errMsg != "request:ok")) {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '数据返回失败，请稍后重试');
        }
        that.setData({
          flag: true
        });
      }
    })
  },
  //产生不重复的随机数
  createRandom: function (num, min, max) {
    let arr = [], obj = {};
    while (arr.length < num) {
      let newNum = Math.floor(Math.random() * max);
      if (!obj[newNum]) {
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
  //出现分享弹窗 上部分点击邀请好友按钮
  getShareShade: function (e) {
    var that = this;
    that.data.shareShade = false;
    that.setData({
      shareShade: that.data.shareShade
    })
  },
  //关闭分享弹窗 上部分点击邀请好友按钮
  shareCancel: function (e) {
    this.setData({
      shareShade: true
    });
  },
  saveImgAction:function(){
    var that = this;
    //是否授权
    wx.getSetting({
      success: function (res) {
        let writePhotosAlbum = res.authSetting["scope.writePhotosAlbum"];
        if (writePhotosAlbum) {
          //已授权
          that.saveImgFn();
        } else if (writePhotosAlbum != undefined && writePhotosAlbum != true) {
          //拒绝授权了
          that.setData({
            showModal: true,
            modal_share: false,
            modelSubTit: '您还未授权保存图片到相册，请确认授权'
          })
        } else {
          that.saveImgFn();
        }
      }
    })
  },
  //保存图片到相册
  saveImgFn: function () {
    var that = this;
    console.log('saveImg', that.data.cardSrc, that.data.tempFilePath);
    wx.saveImageToPhotosAlbum({
      filePath: that.data.cardSrc || that.data.tempFilePath,
      success(res) {
        wx.showModal({
          content: '海报已保存，请在相册中选择并分享到朋友圈',
          showCancel: false,
          confirmText: '确定',
          confirmColor: '#333',
          success: function (res) {
            console.log(res);
            if (res.confirm) {
              that.data.shareShade = true;
              that.setData({
                shareShade: that.data.shareShade,
                isHasCard: true
              })
            }
          }
        })
      },
      fail: function (res) {
        console.log('保存图片请求失败', res)
        if (res.errMsg === 'saveImageToPhotosAlbum:fail auth deny') {
          textToastFn.textToast.clearTextToast(that);
          textToastFn.textToast.showTextToast(that, '您拒绝了授权无法保存图片');
        } else if (res.errMsg === 'saveImageToPhotosAlbum:fail file not found') {
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
  //生成图片
  picture: function () {
    let that = this;
    console.log('要进入promise1了');
    let promise1 = new Promise(function (resolve, reject) {
      /* 获得要在画布上绘制的图片 */
      wx.getImageInfo({
        src: that.data.canvasPath,
        success: function (res) {
          let temporarypic = res.path;
          console.log('promise1请求成功了', res.path);
          resolve(res);
        }
      })
    });
    console.log('要进入promise2了');
    let promise2 = new Promise(function (resolve, reject) {
      //检查是否在临时缓存里
      let temporaryCardBg = that.data.index_share_card.temporaryCardBg;
      let isHasTemporaryCardBg = false;
      if (temporaryCardBg) {
        if (temporaryCardBg) {
          try {
            that.fs.accessSync(temporaryCardBg);
            console.log('carbg在本地临时文件缓存里有');
            isHasTemporaryCardBg = true;
            resolve(temporaryCardBg);
            return;
          } catch (e) {
            that.data.index_share_card.temporaryCardBg = '';
            wx.setStorageSync('index_share_card', that.data.index_share_card)
            that.setData({
              index_share_card: that.data.index_share_card
            });
          }
        }
      }
      if (isHasTemporaryCardBg) {
        return;
      }
      //还要检查carbg是否在缓存里
      let cardBg = that.data.index_share_card.cardBg;
      let isHasCardBg = false; 
      if (cardBg){
        try{
          that.fs.accessSync(cardBg);
          console.log('carbg在本地文件缓存里有');
          isHasCardBg = true;
          resolve(cardBg);
        } catch(e) {
          console.log('carbg在本地文件缓存里没有，重新请求');
          that.data.index_share_card.cardBg = '';
          wx.setStorageSync('index_share_card', that.data.index_share_card)
          that.setData({
            index_share_card: that.data.index_share_card
          });
        }
      }
      if (isHasCardBg){
        return;
      }
      console.log('carbg地址不在缓存里，重新请求');
      that.getCardBg(resolve);
    });
    Promise.all(
      [promise1, promise2]
    ).then(res => {
      const ctx = wx.createCanvasContext('shareCanvas');
      ctx.drawImage(res[1], 0, 0, 375, 667);
      ctx.drawImage(res[0].path, 49, 557, 100, 100);
      /* 绘制 */
      ctx.stroke();
      console.log("走完了promise,开始要走最后一步了");
      ctx.draw(false, that.drawPicture);
    })
  },
  getCardBg: function (resolve){
    console.log("进入了获取cardBg的方法里了");
    let that = this;
    wx.getImageInfo({
      src: 'https://i2.dd-img.com/assets/image/1539845766-2a338179c276aaaa-1500w-2668h.jpg',
      success: function (res) {
        console.log('cardBg获取成功，promise2要返回了', res.path);
        let temporarypic = res.path;
        that.data.index_share_card.temporaryCardBg = temporarypic;
        wx.setStorageSync('index_share_card', that.data.index_share_card);
        //如果之前本地文件存储的有要删除之前存储的图片
        let oldCardBg = that.data.index_share_card ? that.data.index_share_card.cardBg : '';
        if (oldCardBg){
          that.removeFile(oldCardBg, 'saveCardBg', temporarypic);
        } else {
          that.saveCardBg(temporarypic, resolve);
        }
      }
    })
  },
  saveCardBg: function (temporarypic, resolve){
    let that = this;
    that.fs.saveFile({
      tempFilePath: temporarypic,
      success: function (res) {
        let cardBg = res.savedFilePath;
        resolve(cardBg);
        that.data.index_share_card.cardBg = cardBg;
        wx.setStorageSync('index_share_card', that.data.index_share_card);
        that.setData({
          index_share_card: that.data.index_share_card
        })
        console.log("cardBg获取成功，并且保存在缓存和本地文件里了", cardBg);
      },
      fail: function () {
        resolve(temporarypic);
      }
    })
  },
  drawPicture: function () { //生成图片
    console.log('开始最后一步生成图片了')
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
        that.data.index_share_card.temporaryCardSrc = temporarypic;
        that.setData({
          index_share_card: that.data.index_share_card
        });
        wx.setStorageSync('index_share_card', that.data.index_share_card);
        console.log("最后一步成功，并且把生成的temporarypic保存在缓存和本地文件里了", temporarypic);
        //目前因为超过10M，保存不成功
        let oldcardSrc = that.data.index_share_card ? that.data.index_share_card.cardSrc : '';
        if (oldcardSrc) {
          that.removeFile(oldcardSrc, 'saveCardSrc', temporarypic);
        }else{
          that.saveCardSrc(temporarypic);
        }
      },
      fail: function(res){
        console.log('生成失败drawPicture', res)
      },
      complete: function(res){
        console.log('最后一步完成', res)
      }
    })

  },
  saveCardSrc: function (temporarypic){
    let that = this;
    that.fs.saveFile({
      tempFilePath: temporarypic,
      success: function (res) {
        let cardSrc = res.savedFilePath;
        that.data.index_share_card.cardSrc = cardSrc;
        that.setData({
          index_share_card: that.data.index_share_card,
          cardSrc: cardSrc
        })
        wx.setStorageSync('index_share_card', that.data.index_share_card);
      },
      fail: function (res) {
        console.log('最后一步将图片放入缓存中失败', res);
      },
      complete: function (res) {
        console.log('最后一步将图片放入缓存中', res)
      }
    })
  },
  shareFn: function () {
    let that = this;
    let shareId = app.globalData.shareId || '',
      activity_id = app.globalData.activity_id || '';
    let index_share_card = wx.getStorageSync('index_share_card');
    that.setData({
      index_share_card: index_share_card || {}
    });
    if (activity_id && !app.globalData.activity_id_changed){ //说明活动id相同，不需要重复生成,但是因为最后的活动图片不能保存还得优化
      //如果不能存储，则在活动id相同时判断临时文件是否存在，存在直接返回临时文件
      if (index_share_card && index_share_card.cardSrc){
        
        try {
          console.log('缓存中存在分享图片直接返回cardSrc');
          that.fs.accessSync(index_share_card.cardSrc);
          that.setData({
            cardSrc: index_share_card.cardSrc
          })
          return;
        } catch (e) {
          index_share_card.cardSrc = '';
          wx.setStorageSync('index_share_card', index_share_card);
          that.setData({
            index_share_card: index_share_card
          })
          //console.log('shareFn', 'index_share_card.cardSrc不存在重新生成');
          //that.getQRCode(shareId, activity_id);
        }
        console.log('cardSrc不存在往下走');
      }
      //判断临时存储
      if (index_share_card && index_share_card.temporaryCardSrc){
        try {
          that.fs.accessSync(index_share_card.temporaryCardSrc);
          console.log('shareFn 直接返回temporaryCardSrc');
          that.setData({
            tempFilePath: index_share_card.temporaryCardSrc
          })
        } catch (e) {
          console.log('shareFn', 'temporaryCardSrc不存在重新生成');
          index_share_card.temporaryCardSrc = '';
          wx.setStorageSync('index_share_card', index_share_card);
          that.setData({
            index_share_card: index_share_card
          })
          that.getQRCode(shareId, activity_id);
          return;
        }
      }else{
        that.getQRCode(shareId, activity_id);
      }
    } else {
      that.getQRCode(shareId, activity_id);
    }
  },
  getQRCode: function (shareId, activity_id){
    let that = this;
    let scene = shareId + ',' + activity_id;
    wx.request({
      method: 'POST',
      url: app.globalData.reqUrl + '/user/pq_code?path=pages/index/index&width=280&scene=' + scene,
      success(res) {
        that.data.canvasPath = app.globalData.asgUrl + '/miniprogram/caiche/qr/' + res.data.data.filename;
        that.setData({
          canvasPath: that.data.canvasPath
        });
        that.picture();
      }
    })
  },
  removeFile: function (path, callback, temporarypic){
    let that = this;
    wx.getSavedFileList({
      success(res) {
        if (res.fileList.length > 0) {
          wx.removeSavedFile({
            filePath: path,
            complete(res) {
              if (callback){
                that[callback](temporarypic);
              }
            }
          })
        }else{
          if (callback) {
            that[callback](temporarypic);
          }
        }
      }
    })
  },
  showRuleBox: function(){
    this.setData({
      showRule: true
    });
  },
  closeRuleBox: function(){
    this.setData({
      showRule: false
    });
  },
  toRankPage: function(){
    wx.navigateTo({
      url: '/pages/rangklist/rangklist',
    })
  },
  //10元红包领取成功后弹窗分享点击取消
  btnCancel: function (e) {
    this.setData({
      showModal: false,
      modal_share: false,
      modelSubTit: '',
      modleShareType: ''
    });
  },
  //针对用户保存图片的时候可能会拒绝授权，再次点击时需要调起授权窗口
  openSetting: function () {
    let that = this;
    //调起授权弹窗
    wx.openSetting({
      success(res) {
        console.log(res);
        //同意授权
        that.setData({
          showModal: false,
          modal_share: false,
          modelSubTit: ''
        });
        if (res.authSetting["scope.writePhotosAlbum"]) {
          that.saveImgFn();
        }
        if (res.authSetting["scope.userInfo"] != undefined && res.authSetting["scope.userInfo"] != true) {
          app.globalData.wxAuthorization = false;
          that.setData({
            userShow: true
          });
          wx.clearStorageSync();

        }
      }
    });
  },
})
