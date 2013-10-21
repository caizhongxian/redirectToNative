/**
 * @fileoverview 
 * @author miaojing <miaojing@taobao.com>
 * @module redirectToNative 移动页面或中间跳转页面使用 不依赖任何kissy模块 这里只依赖Event
 **/
KISSY.add(function (S, Event) {
    /**
     * @class RedirectToNative
     * @constructor 
     */
    function RedirectToNative(el) {
        var self = this;
        self.el = el;
        self.init();
    }
        
    S.augment(RedirectToNative, {
        init: function() {
            var self = this;
                self.platform = self._UA();
            // pc下 什么都不处理  pc访问下可能href可以链接去其他地址
            if(!self.platform || navigator.standalone) return;

            // kissy1.3 click在mobile下对应tap
            Event.on(self.el, 'click', function(e) {
                e.preventDefault();
                var tar = e.currentTarget;

                if (self.platform == 'ios') {
                    self.installUrl = tar.getAttribute('data-ios-install-url');
                    self.nativeUrl = tar.getAttribute('data-ios-native-url'); 
                    self.laterTime = tar.getAttribute('data-ios-open-time') || 1000;
                } else {
                    self.installUrl = tar.getAttribute('data-android-install-url');
                    self.nativeUrl = tar.getAttribute('data-android-native-url');
                    self.laterTime = tar.getAttribute('data-android-open-time') || 3000;
                    self.package = tar.getAttribute('data-package') || 'com.taobao.etao';
                }
                //只有android下的chrome要用intent协议唤起native
                if (self.platform != 'ios' && !!navigator.userAgent.match(/Chrome/i)) {
                    self._hackChrome();
                } else {
                    self._gotoNative();
                }
            });
        },
        /**
         * _hackChrome 只有android下的chrome要用intent协议唤起native
         * @return {[type]} 
         */
        _hackChrome: function() {
          var self = this;
          var startTime = Date.now();
          var paramUrlarr = self.nativeUrl.split('://'),
              scheme = paramUrlarr[0],
              schemeUrl = paramUrlarr[1];
          window.location = 'intent://' + schemeUrl + '#Intent;scheme=' + scheme + ';package=' + self.package + ';end';
          setTimeout(function() {
              self._gotoDownload(startTime);
          }, self.laterTime);
        },
        /**
         * [_gotoNative 跳转至native，native超时打不开就去下载]
         * @return 
         */
        _gotoNative: function() {
            var self = this;
            var startTime = Date.now(),
                doc = document,
                body = doc.body,
                iframe = doc.createElement('iframe');
                iframe.id = 'J_redirectNativeFrame';
                iframe.style.display = 'none';
                iframe.src = self.nativeUrl;

            //运行在head中
            if(!body) {
                setTimeout(function(){
                    doc.body.appendChild(iframe);
                }, 0);
            } else {
                body.appendChild(iframe);
            }
            
            setTimeout(function() {
                doc.body.removeChild(iframe);
                self._gotoDownload(startTime);
                /**
                 * 测试时间设置小于800ms时，在android下的UC浏览器会打开native app时并下载apk，
                 * 测试android+UC下打开native的时间最好大于800ms;
                 */
            }, self.laterTime);
        },
        /**
         * [_gotoInstall 去下载]
         * @param  {[type]} startTime [开始时间]
         * @return 
         */
        _gotoDownload: function(startTime) {
            var self = this;
            var endTime = Date.now();
            if (endTime - startTime < self.laterTime + 500) {
                window.location = self.installUrl;
            }
        },
        /**
         * [_UA 检测平台]
         * @return string [ios|android| ]
         */
        _UA: function() {
            var ua = navigator.userAgent;
            // ios
            if (!!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
                return 'ios';
            } else if (!!ua.match(/Android/i)) {
                return 'android';
            } else {
                return '';
            }
        }

    });
    return RedirectToNative;
},{
    requires:['event']
});



