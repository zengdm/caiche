
微信小程序

caiche: 猜车赢红包
	v1.0
		index: 首页
		join: 我参与的
		detail: 竞猜结果详情
		组件 component目录下：
			authorization: 授权弹窗
						使用方法：示例：
								页面json中： "usingComponents": {
											    "authorization-btn": "/pages/component/authorization/userInfo"
											 }
								页面wxml中引入：<authorization-btn show="{{userShow}}" bindchangeStatus="changeStatus"></authorization-btn>
								js: userShow: false //控制userShow达到控制显示隐藏授权弹窗
									changeStatus: function(){} //授权之后触发页面的js

			textToat:   自定义提示框
						使用方法：页面js内引入 const textToastFn = require('../component/textToast/textToast.js');
											data中设置 txtToast: {
													      visible: !0,
													      text: ''
													    }
								页面wxml中引入<import src ="../component/textToast/textToast.wxml" />
											<template is="toast" data="{{...txtToast}}"/>
								wxss中引入 @import "/pages/component/textToast/textToast.wxss";
								因为直接在page.wxss中引入，本小程序中所有页面不必在单独引入textToast.wxss
						清除提示：textToastFn.textToast.clearTextToast(that);
						显示提示：textToastFn.textToast.showTextToast(that, '请正确填写搜索关键词');
		工具 utilst目录下:
			timer: 倒计时工具类js
					使用方法： 页面js引入 import { Timer } from '../../utils/timer.js';
							使用：Timer.init(timeRange+2, that); //that为当前page
			base64: 本程序中主要用来解加密
					使用方法： 页面js引入 import { Base64 } from '../../utils/base64.js';
							使用： Base64.decode()
		Tips: 以上路径根据自己页面调整

	<------------------------------------------------------------------------------------------------------------>

	v2.0
		index 首页
		rangklist 排行榜
		bonus: 我的奖金
		组件 component目录下：
			authorization: 授权弹窗
						使用方法：示例：
								页面json中： "usingComponents": {
											    "authorization-btn": "/pages/component/authorization/userInfo"
											 }
								页面wxml中引入：<authorization-btn show="{{userShow}}" bindchangeStatus="changeStatus"></authorization-btn>
								js: userShow: false //控制userShow达到控制显示隐藏授权弹窗
									changeStatus: function(){} //授权之后触发页面的js


			textToat:   自定义提示框
						使用方法：页面js内引入 const textToastFn = require('../component/textToast/textToast.js');
											data中设置 txtToast: {
													      visible: !0,
													      text: ''
													    }
								页面wxml中引入<import src ="../component/textToast/textToast.wxml" />
											<template is="toast" data="{{...txtToast}}"/>
								wxss中引入 @import "/pages/component/textToast/textToast.wxss";
								因为直接在page.wxss中引入，本小程序中所有页面不必在单独引入textToast.wxss
						清除提示：textToastFn.textToast.clearTextToast(that);
						显示提示：textToastFn.textToast.showTextToast(that, '请正确填写搜索关键词');
		工具 utilst目录下:
			timer: 倒计时工具类js
					使用方法： 页面js引入 import { Timer } from '../../utils/timer.js';
							使用：Timer.init(timeRange+2, that); //that为当前page
			base64: 本程序中主要用来解加密
					使用方法： 页面js引入 import { Base64 } from '../../utils/base64.js';
							使用： Base64.decode()
		Tips: 以上路径根据自己页面调整
