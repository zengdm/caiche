class Timer{
  static count(){
    let me = this;
    this.handler = setInterval(function () {
      me.t--;
      if (me.t <= 0) {
        me.page.setData({
          'timer.time': me.t,
          'timer.hour': '00',
          'timer.minute': '00',
          'timer.second': '00'
        })
        clearInterval(me.handler);
        //首页需要倒计时结束时刷新页面，其它情况自行添加判断
        setTimeout(function(){
          me.page.reload();
        },1000);
        return;
      }
      me.page.setData({
        'timer.time': me.t
      });
      var arr = me.cal();
      if (arr[0] < 10) {
        arr[0] = '0' + arr[0]
      }
      if (arr[1] < 10) {
        arr[1] = '0' + arr[1]
      }
      if (arr[2] < 10) {
        arr[2] = '0' + arr[2]
      }
      me.page.setData({
        'timer.hour': arr[0],
        'timer.minute': arr[1],
        'timer.second': arr[2]
      })
    }, 1000)
  }
  static cal(){
    if (this.t <= 0) {
      return;
    }
    var arr = [];
    var hour, minute, second, mtemp;
    hour = Math.floor(this.t / 3600);
    minute = Math.floor(this.t % 3600 / 60);
    second = this.t % 3600 % 60;
    arr[0] = hour;
    arr[1] = minute;
    arr[2] = second;
    return arr;
  }
  static clear(){
    if(this.handler){
      clearInterval(this.handler);
    }
  }
  static init(t, page){
    this.t = parseInt(t);
    this.page = page;
    this.clear();
    this.count();
  }

}
module.exports.Timer = Timer;
