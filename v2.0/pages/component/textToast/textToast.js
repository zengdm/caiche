var textToast={
  showTextToast:function(that,text){
    that.setData({
      txtToast: {
        visible: 0,
        text: text
      }
    });
  },
  clearTextToast:function(that){
    that.setData({
      txtToast: {
        visible: !0,
        text: ''
      }
    });
  }
}

module.exports = {
  textToast: textToast
}