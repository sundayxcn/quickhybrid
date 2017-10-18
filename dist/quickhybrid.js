/*!
 * quickhybrid v0.0.1
 * (c) 2017-2017 dailc
 * Released under the BSD-3-Clause License.
 * https://github.com/quickhybrid/quickhybrid
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.quick = factory());
}(this, (function () { 'use strict';

/**
 * 加入系统判断功能
 */
function osMixin(hybridJs) {
    var detect = function detect(ua) {
        this.os = {};

        var android = ua.match(/(Android);?[\s/]+([\d.]+)?/);

        if (android) {
            this.os.android = true;
            this.os.version = android[2];
            this.os.isBadAndroid = !/Chrome\/\d/.test(window.navigator.appVersion);
        }

        var iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);

        if (iphone) {
            this.os.ios = true;
            this.os.iphone = true;
            this.os.version = iphone[2].replace(/_/g, '.');
        }

        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);

        if (ipad) {
            this.os.ios = true;
            this.os.ipad = true;
            this.os.version = ipad[2].replace(/_/g, '.');
        }

        // quickhybrid的容器
        var quick = ua.match(/QuickHybrid/i);

        if (quick) {
            this.os.quick = true;
        }

        // epoint的容器
        var ejs = ua.match(/EpointEJS/i);

        if (ejs) {
            this.os.ejs = true;
        }

        var dd = ua.match(/DingTalk/i);

        if (dd) {
            this.os.dd = true;
        }

        // 如果ejs和钉钉以及quick都不是，则默认为h5
        if (!ejs && !dd && !quick) {
            this.os.h5 = true;
        }
    };

    detect.call(hybridJs, navigator.userAgent);
}

/**
 * 不用pollyfill，避免体积增大
 */
function promiseMixin(hybridJs) {
    var quick = hybridJs;

    quick.Promise = window.Promise;

    quick.getPromise = function () {
        return quick.Promise;
    };

    quick.setPromise = function (newPromise) {
        quick.Promise = newPromise;
    };
}

var globalError = {

    /**
     * 1001 api os错误
     */
    ERROR_TYPE_APIOS: {
        code: 1001,
        // 这个只是默认的提示，如果没有新的提示，就会采用默认的提示
        msg: '该API无法在当前OS下运行'
    },

    /**
     * 1002 api modify错误
     */
    ERROR_TYPE_APIMODIFY: {
        code: 1002,
        msg: '不允许更改JSSDK的API'
    },

    /**
     * 1003 module modify错误
     */
    ERROR_TYPE_MODULEMODIFY: {
        code: 1003,
        msg: '不允许更改JSSDK的模块'
    },

    /**
     * 1004 api 不存在
     */
    ERROR_TYPE_APINOTEXIST: {
        code: 1004,
        msg: '调用了不存在的api'
    },

    /**
     * 1005 组件api对应的proto不存在
     */
    ERROR_TYPE_PROTONOTEXIST: {
        code: 1005,
        msg: '调用错误，该组件api对应的proto不存在'
    },

    /**
     * 1006 非容器环境下无法调用自定义组件API
     */
    ERROR_TYPE_CUSTOMEAPINOTEXIST: {
        code: 1006,
        msg: '非容器下无法调用自定义组件API'
    },

    /**
     * 1007 对应的event事件在该环境下不存在
     */
    ERROR_TYPE_EVENTNOTEXIST: {
        code: 1007,
        msg: '对应的event事件在该环境下不存在'
    },

    /**
     * 1007 对应的event事件在该环境下不存在
     */
    ERROR_TYPE_INITVERSIONERROR: {
        code: 1008,
        msg: '初始化版本号错误，请检查容器api的实现情况'
    },

    /**
     * 2001 ready modify错误-ready回调正常只允许定义一个
     */
    ERROR_TYPE_READYMODIFY: {
        code: 2001,
        msg: 'ready回调不允许多次设置'
    },

    /**
     * 2002 config modify错误-正常一个页面只允许config一次
     */
    ERROR_TYPE_CONFIGMODIFY: {
        code: 2002,
        msg: 'config不允许多次调用'
    },

    /**
     * 2003 config 错误
     */
    ERROR_TYPE_CONFIGERROR: {
        code: 2003,
        msg: 'config校验错误'
    },

    /**
     * 2004 version not support
     */
    ERROR_TYPE_VERSIONNOTSUPPORT: {
        code: 2004,
        msg: '不支持当前容器版本，请确保容器与前端库版本匹配'
    },

    /**
     * 2004 version not support
     */
    ERROR_TYPE_VERSIONNEEDUPGRADE: {
        code: 2005,
        msg: '当前JSSDK库小于容器版本，请将前端库升级到最新版本'
    },

    /**
     * 3000 原生错误(非API错误)，原生捕获到的错误都会通知J5
     */
    ERROR_TYPE_NATIVE: {
        code: 3000,
        msg: '捕获到一处原生容器错误'
    },

    /**
     * 3001 原生调用h5错误  原生通过JSBridge调用h5错误，可能是参数不对
     */
    ERROR_TYPE_NATIVECALL: {
        code: 3001,
        msg: '原生调用H5时参数不对'
    },

    /**
     * 9999 其它未知错误
     */
    ERROR_TYPE_UNKNOWN: {
        code: 9999,
        msg: '未知错误'
    }
};

function warn(msg) {
    // 模板字符串
    console.error("[quick error]: " + msg);
}

function log(msg) {
    console.log("[quick log]: " + msg);
}

function errorMixin(hybridJs) {
    var quick = hybridJs;
    var errorFunc = void 0;

    /**
     * 提示全局错误
     * @param {Nunber} code 错误代码
     * @param {String} msg 错误提示
     */
    function showError() {
        var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var msg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '错误!';

        warn('code:' + code + ', msg:' + msg);
        errorFunc && errorFunc({
            code: code,
            message: msg
        });
    }

    quick.showError = showError;

    quick.globalError = globalError;

    /**
     * 当出现错误时，会通过这个函数回调给开发者，可以拿到里面的提示信息
     * @param {Function} callback 开发者设置的回调(每次会监听一个全局error函数)
     * 回调的参数好似
     * msg 错误信息
     * code 错误码
     */
    quick.error = function error(callback) {
        errorFunc = callback;
    };
}

/**
 * 依赖于quick的基础库
 * Promise
 */
function proxyMixin(hybridJs) {
    var quick = hybridJs;

    /**
     * 对所有的API进行统一参数预处理，promise逻辑支持等操作
     * @param {Object} api 对应的API
     * @param {Function} callback 回调
     * @constructor
     */
    function Proxy(api, callback) {
        this.api = api;
        this.callback = callback;
    }

    /**
     * 实际的代理操作
     */
    Proxy.prototype.walk = function walk() {
        var _this = this;

        // 实时获取promise
        var Promise = quick.getPromise();

        // 返回一个闭包函数
        return function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var rest = args;

            rest[0] = rest[0] || {};

            // 默认参数的处理
            if (_this.api.defaultParams && rest[0] instanceof Object) {
                Object.keys(_this.api.defaultParams).forEach(function (item) {
                    if (rest[0][item] === undefined) {
                        rest[0][item] = _this.api.defaultParams[item];
                    }
                });
            }

            // 决定是否使用Promise
            var finallyCallback = void 0;

            if (_this.callback) {
                // 将this指针修正为proxy内部，方便直接使用一些api关键参数
                finallyCallback = _this.callback;
            }

            if (Promise) {
                return finallyCallback && new Promise(function (resolve, reject) {
                    // 拓展 rest
                    rest = rest.concat([resolve, reject]);
                    finallyCallback.apply(_this, rest);
                });
            }

            return finallyCallback && finallyCallback.apply(_this, rest);
        };
    };

    /**
     * 析构函数
     */
    Proxy.prototype.dispose = function dispose() {
        this.api = null;
        this.callback = null;
    };

    quick.Proxy = Proxy;
}

function jsbridgeMixin(hybridJs) {
    var quick = hybridJs;
    // 定义一个JSBridge
    var JSBridge = {};

    // 声明依赖
    var showError = quick.showError;
    var globalError = quick.globalError;
    var os = quick.os;

    quick.JSBridge = JSBridge;

    // jsbridge协议定义的名称
    var CUSTOM_PROTOCOL_SCHEME = 'QuickHybridJSBridge';
    // 本地注册的方法集合,原生只能调用本地注册的方法,否则会提示错误
    var messageHandlers = {};
    // 短期回调函数集合
    // 在原生调用完对应的方法后,会执行对应的回调函数id，并删除
    var responseCallbacks = {};
    // 长期存在的回调，调用后不会删除
    var responseCallbacksLongTerm = {};

    // 唯一id,用来确保长期回调的唯一性，初始化为最大值
    var uniqueLongCallbackId = 2147483647;

    /**
     * 获取短期回调id，内部要避免和长期回调的冲突
     * @return {Number} 返回一个随机的短期回调id
     */
    function getCallbackId() {
        // 确保每次都不会和长期id相同
        return Math.floor(Math.random() * uniqueLongCallbackId);
    }

    /**
     * 将JSON参数转为字符串
     * @param {Object} data 对应的json对象
     * @return {String} 转为字符串后的结果
     */
    function getParam(data) {
        if (typeof data !== 'string') {
            return JSON.stringify(data);
        }

        return data;
    }

    /**
     * 获取最终的url scheme
     * @param {String} proto 协议头，一般不同模块会有不同的协议头
     * @param {Object} message 兼容android中的做法
     * android中由于原生不能获取JS函数的返回值,所以得通过协议传输
     * @return {String} 返回拼接后的uri
     */
    function getUri(proto, message) {
        var uri = CUSTOM_PROTOCOL_SCHEME + '://' + proto;

        // 回调id作为端口存在
        var callbackId = void 0;
        var method = void 0;
        var params = void 0;

        if (message.callbackId) {
            // 必须有回调id才能生成一个scheme
            // 这种情况是H5主动调用native时
            callbackId = message.callbackId;
            method = message.handlerName;
            params = message.data;
        }

        // 参数转为字符串
        params = encodeURIComponent(getParam(params));
        // uri 补充,需要编码，防止非法字符
        uri += ':' + callbackId + '/' + method + '?' + params;

        return uri;
    }

    /**
     * JS调用原生方法前,会先send到这里进行处理
     * @param {String} proto 这个属于协议头的一部分
     * @param {JSON} message 调用的方法详情,包括方法名,参数
     * @param {Object} responseCallback 调用完方法后的回调,或者长期回调的id
     */
    function doSend(proto, message, responseCallback) {
        var newMessage = message;

        if (typeof responseCallback === 'function') {
            // 如果传入的回调时函数，需要给它生成id
            // 取到一个唯一的callbackid
            var callbackId = getCallbackId();
            // 回调函数添加到短期集合中
            responseCallbacks[callbackId] = responseCallback;
            // 方法的详情添加回调函数的关键标识
            newMessage.callbackId = callbackId;
        } else {
            // 如果传入时已经是id，代表已经在回调池中了，直接使用即可
            newMessage.callbackId = responseCallback;
        }

        // 获取 触发方法的url scheme
        var uri = getUri(proto, newMessage);

        if (os.quick) {
            // 依赖于os判断
            if (os.ios) {
                // ios采用
                window.webkit.messageHandlers.WKWebViewJavascriptBridge.postMessage(uri);
            } else {
                window.top.prompt(uri, '');
            }
        } else {
            // 浏览器
            warn('\u6D4F\u89C8\u5668\u4E2Djsbridge\u65E0\u6548,\u5BF9\u5E94scheme:' + uri);
        }
    }

    /**
     * 注册本地JS方法通过JSBridge给原生调用
     * 我们规定,原生必须通过JSBridge来调用H5的方法
     * 注意,这里一般对本地函数有一些要求,要求第一个参数是data,第二个参数是callback
     * @param {String} handlerName 方法名
     * @param {Function} handler 对应的方法
     */
    JSBridge.registerHandler = function registerHandler(handlerName, handler) {
        messageHandlers[handlerName] = handler;
    };

    /**
     * 注册长期回调到本地
     * @param {String} callbackId 回调id
     * @param {Function} callback 对应回调函数
     */
    JSBridge.registerLongCallback = function registerLongCallback(callbackId, callback) {
        responseCallbacksLongTerm[callbackId] = callback;
    };

    /**
     * 获得本地的长期回调，每一次都是一个唯一的值
     * @retrurn 返回对应的回调id
     * @return {Number} 返回长期回调id
     */
    JSBridge.getLongCallbackId = function getLongCallbackId() {
        uniqueLongCallbackId -= 1;

        return uniqueLongCallbackId;
    };

    /**
     * 调用原生开放的方法
     * @param {String} proto 这个属于协议头的一部分
     * @param {String} handlerName 方法名
     * @param {JSON} data 参数
     * @param {Object} callback 回调函数或者是长期的回调id
     */
    JSBridge.callHandler = function callHandler(proto, handlerName, data, callback) {
        doSend(proto, {
            handlerName: handlerName,
            data: data
        }, callback);
    };

    /**
     * 原生调用H5页面注册的方法,或者调用回调方法
     * @param {String} messageJSON 对应的方法的详情,需要手动转为json
     */
    JSBridge._handleMessageFromNative = function _handleMessageFromNative(messageJSON) {
        /**
         * 处理原生过来的方法
         */
        function doDispatchMessageFromNative() {
            var message = void 0;

            try {
                if (typeof messageJSON === 'string') {
                    message = decodeURIComponent(messageJSON);
                    message = JSON.parse(message);
                } else {
                    message = messageJSON;
                }
            } catch (e) {
                showError(globalError.ERROR_TYPE_NATIVECALL.code, globalError.ERROR_TYPE_NATIVECALL.msg);

                return;
            }

            // 回调函数
            var responseId = message.responseId;
            var responseData = message.responseData;
            var responseCallback = void 0;

            if (responseId) {
                // 这里规定,原生执行方法完毕后准备通知h5执行回调时,回调函数id是responseId
                responseCallback = responseCallbacks[responseId];
                // 默认先短期再长期
                responseCallback = responseCallback || responseCallbacksLongTerm[responseId];
                // 执行本地的回调函数
                responseCallback && responseCallback(responseData);

                delete responseCallbacks[responseId];
            } else {
                /**
                 * 否则,代表原生主动执行h5本地的函数
                 * 从本地注册的函数中获取
                 */
                var handler = messageHandlers[message.handlerName];
                var data = message.data;

                // 执行本地函数,按照要求传入数据和回调
                handler && handler(data);
            }
        }

        // 使用异步
        setTimeout(doDispatchMessageFromNative);
    };
}

var noop = function noop() {};

function extend(target) {
    var finalTarget = target;

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        rest[_key - 1] = arguments[_key];
    }

    rest.forEach(function (source) {
        Object.keys(source).forEach(function (key) {
            finalTarget[key] = source[key];
        });
    });

    return finalTarget;
}

/**
 * 如果version1大于version2，返回1，如果小于，返回-1，否则返回0。
 * @param {string} version1 版本1
 * @param {string} version2 版本2
 * @return {number} 返回版本1和版本2的关系
 */
function compareVersion(version1, version2) {
    if (typeof version1 !== 'string' || typeof version2 !== 'string') {
        throw new Error('version need to be string type');
    }

    var verArr1 = version1.split('.');
    var verArr2 = version2.split('.');
    var len = Math.max(verArr1.length, verArr2.length);

    // forin不推荐，foreach不能return与break
    for (var i = 0; i < len; i += 1) {
        var ver1 = verArr1[i] || 0;
        var ver2 = verArr2[i] || 0;

        // 隐式转化为数字
        ver1 -= 0;
        ver2 -= 0;

        if (ver1 > ver2) {
            return 1;
        } else if (ver1 < ver2) {
            return -1;
        }
    }

    return 0;
}

/**
 * 字符串超出截取
 * @param {string} str 目标字符串
 * @param {Number} count 字数，以英文为基数，如果是中文，会自动除2
 * @return {string} 返回截取后的字符串
 * 暂时不考虑只遍历一部分的性能问题，因为在应用场景内是微不足道的
 */


/**
 * 得到一个项目的根路径
 * h5模式下例如:http://id:端口/项目名/
 * @return {String} 项目的根路径
 */


/**
 * 将相对路径转为绝对路径 ./ ../ 开头的  为相对路径
 * 会基于对应调用js的html路径去计算
 * @param {String} path 需要转换的路径
 * @return {String} 返回转换后的路径
 */


/**
 * 得到一个全路径
 * @param {String} path 路径
 * @return {String} 返回最终的路径
 */


/**
 * 将json参数拼接到url中
 * @param {String} url url地址
 * @param {Object} data 需要添加的json数据
 * @return {String} 返回最终的url
 */

/**
 * 内部触发jsbridge的方式，作为一个工具类提供
 */
function generateJSBridgeTrigger(JSBridge) {
    /**
     * 有三大类型，短期回调，延时回调，长期回调，其中长期回调中又有一个event比较特殊
     * @param {JSON} options 配置参数，包括
     * handlerName 方法名
     * data 额外参数
     * isLongCb 是否是长期回调，如果是，则会生成一个长期回调id，以长期回调的形式存在
     * proto 对应方法的模块名
     * 其它 代表相应的头部
     * @param {Function} resolve promise中成功回调函数
     * @param {Function} reject promise中失败回调函数
     */
    return function callJsBridge(options, resolve, reject) {
        var success = options.success;
        var error = options.error;
        var dataFilter = options.dataFilter;
        var proto = options.proto;
        var handlerName = options.handlerName;
        var isLongCb = options.isLongCb;
        var isEvent = options.isEvent;
        var data = options.data;

        // 统一的回调处理
        var cbFunc = function cbFunc(res) {
            if (res.code === 0) {
                error && error(res);
                // 长期回调不走promise
                !isLongCb && reject && reject(res);
            } else {
                var finalRes = res;

                if (dataFilter) {
                    finalRes = dataFilter(finalRes);
                }
                // 提取出result
                success && success(finalRes.result);
                !isLongCb && resolve && resolve(finalRes.result);
            }
        };

        if (isLongCb) {
            /**
             * 长期回调的做法，需要注册一个长期回调id,每一个方法都有一个固定的长期回调id
             * 短期回调的做法(短期回调执行一次后会自动销毁)
             * 但长期回调不会销毁，因此可以持续触发，例如下拉刷新
             * 长期回调id通过函数自动生成，每次会获取一个唯一的id
             */
            var longCbId = JSBridge.getLongCallbackId();

            if (isEvent) {
                // 如果是event，data里需要增加一个参数
                data.port = longCbId;
            }
            JSBridge.registerLongCallback(longCbId, cbFunc);
            // 传入的是id
            JSBridge.callHandler(proto, handlerName, data, longCbId);
            // 长期回调默认就成功了，这是兼容的情况，防止有人误用
            resolve && resolve();
        } else {
            // 短期回调直接使用方法
            JSBridge.callHandler(proto, handlerName, data, cbFunc);
        }
    };
}

function callinnerMixin(hybridJs) {
    var quick = hybridJs;
    var os = quick.os;
    var JSBridge = quick.JSBridge;
    var callJsBridge = generateJSBridgeTrigger(JSBridge);

    /**
     * 专门供API内部调用的，this指针被指向了proxy对象，方便处理
     * @param {Object} options 配置参数
     * @param {Function} resolve promise的成功回调
     * @param {Function} reject promise的失败回调
     */
    function callInner(options, resolve, reject) {
        var data = extend({}, options);

        // 纯数据不需要回调
        data.success = undefined;
        data.error = undefined;
        data.dataFilter = undefined;

        if (os.quick) {
            // 默认quick环境才触发jsbridge
            callJsBridge({
                handlerName: this.api.namespace,
                data: data,
                proto: this.api.moduleName,
                success: options.success,
                error: options.error,
                dataFilter: options.dataFilter,
                isLongCb: this.api.isLongCb,
                isEvent: this.api.isEvent
            }, resolve, reject);
        }
    }

    quick.callInner = callInner;
}

function defineapiMixin(hybridJs) {
    var quick = hybridJs;
    var Proxy = quick.Proxy;
    var globalError = quick.globalError;
    var showError = quick.showError;
    var os = quick.os;
    var callInner = quick.callInner;

    /**
     * 存放所有的代理 api对象
     * 每一个命名空间下的每一个os都可以执行
     * proxyapi[namespace][os]
     */
    var proxysApis = {};

    /**
     * 存放所有的代理 module对象
     */
    var proxysModules = {};

    var supportOsArray = ['quick', 'dd', 'h5'];

    function getCurrProxyApiOs(currOs) {
        for (var i = 0, len = supportOsArray.length; i < len; i += 1) {
            if (currOs[supportOsArray[i]]) {
                return supportOsArray[i];
            }
        }

        // 默认是h5
        return 'h5';
    }

    function getModuleApiParentByNameSpace(module, namespace) {
        var apiParent = module;
        // 只取命名空间的父级,如果仅仅是xxx，是没有父级的
        var parentNamespaceArray = /[.]/.test(namespace) ? namespace.replace(/[.][^.]+$/, '').split('.') : [];

        parentNamespaceArray.forEach(function (item) {
            apiParent[item] = apiParent[item] || {};
            apiParent = apiParent[item];
        });

        return apiParent;
    }

    function proxyApiNamespace(apiParent, apiName, finalNameSpace, api) {
        // 代理API，将apiParent里的apiName代理到Proxy执行
        Object.defineProperty(apiParent, apiName, {
            configurable: true,
            enumerable: true,
            get: function proxyGetter() {
                // 确保get得到的函数一定是能执行的
                var nameSpaceApi = proxysApis[finalNameSpace];
                // 得到当前是哪一个环境，获得对应环境下的代理对象
                var proxyObj = nameSpaceApi[getCurrProxyApiOs(os)];

                if (proxyObj) {
                    /**
                     * 返回代理对象，所以所有的api都会通过这个代理函数
                     * 注意引用问题，如果直接返回原型链式的函数对象，由于是在getter中，里面的this会被改写
                     * 所以需要通过walk后主动返回
                     */
                    return proxyObj.walk();
                }

                // 正常情况下走不到，除非预编译的时候在walk里手动抛出
                var osErrorTips = api.os ? api.os.join('或') : '"非法"';
                var msg = api.namespace + '\u8981\u6C42\u7684os\u73AF\u5883\u4E3A:' + osErrorTips;

                showError(globalError.ERROR_TYPE_APIOS.code, msg);

                return noop;
            },
            set: function proxySetter() {
                showError(globalError.ERROR_TYPE_APIMODIFY.code, globalError.ERROR_TYPE_APIMODIFY.msg);
            }
        });
    }

    /**
     * 监听模块，防止被篡改
     * @param {String} moduleName 模块名
     */
    function observeModule(moduleName) {
        Object.defineProperty(quick, moduleName, {
            configurable: true,
            enumerable: true,
            get: function proxyGetter() {
                if (!proxysModules[moduleName]) {
                    proxysModules[moduleName] = {};
                }

                return proxysModules[moduleName];
            },
            set: function proxySetter() {
                showError(globalError.ERROR_TYPE_MODULEMODIFY.code, globalError.ERROR_TYPE_MODULEMODIFY.msg);
            }
        });
    }

    /**
     * 在某一个模块下拓展一个API
     * @param {String} moduleName 模块名
     * @param {String} apiParam api对象,包含
     * namespace 命名空间
     * os 支持的环境
     * defaultParams 默认参数
     */
    function extendApi(moduleName, apiParam) {
        if (!apiParam || !apiParam.namespace) {
            return;
        }
        if (!quick[moduleName]) {
            // 如果没有定义模块，监听整个模块，用代理取值，防止重定义
            // 这样，模块只允许初次定义以及之后的赋值，其它操作都会被内部拒绝
            observeModule(moduleName);
        }

        var api = apiParam;
        var modlue = quick[moduleName];
        var apiNamespace = api.namespace;

        // api加上module关键字，方便内部处理
        api.moduleName = moduleName;

        var apiParent = getModuleApiParentByNameSpace(modlue, apiNamespace);

        // 最终的命名空间是包含模块的
        var finalNameSpace = moduleName + '.' + api.namespace;
        // 如果仅仅是xxx，直接取xxx，如果aa.bb，取bb
        var apiName = /[.]/.test(apiNamespace) ? api.namespace.match(/[.][^.]+$/)[0].substr(1) : apiNamespace;

        // 这里防止触发代理，就不用apiParent[apiName]了，而是用proxysApis[finalNameSpace]
        if (!proxysApis[finalNameSpace]) {
            // 如果还没有代理这个API的命名空间，代理之，只需要设置一次代理即可
            proxyApiNamespace(apiParent, apiName, finalNameSpace, api);
        }

        // 一个新的API代理，会替换以前API命名空间中对应的内容
        var apiRuncode = api.runCode;

        if (!apiRuncode && callInner) {
            // 如果没有runcode，默认使用quick的callInner
            apiRuncode = callInner;
        }

        var newApiProxy = new Proxy(api, apiRuncode);
        var oldProxyNamespace = proxysApis[finalNameSpace] || {};
        var oldProxyOsNotUse = {};

        proxysApis[finalNameSpace] = {};

        supportOsArray.forEach(function (osTmp) {
            if (api.os && api.os.indexOf(osTmp) !== -1) {
                // 如果存在这个os，并且合法，重新定义
                proxysApis[finalNameSpace][osTmp] = newApiProxy;
                oldProxyOsNotUse[osTmp] = true;
            } else {
                // 否则仍然使用老版本的代理
                proxysApis[finalNameSpace][osTmp] = oldProxyNamespace[osTmp];
                // api本身的os要添加这个环境，便于提示
                api.os && api.os.push(osTmp);
            }
        });

        Object.keys(oldProxyOsNotUse).forEach(function (notUseOs) {
            // 析构不用的代理
            oldProxyNamespace[notUseOs] && oldProxyNamespace[notUseOs].dispose();
        });
    }

    /**
     * 拓展整个对象的模块
     * @param {String} moduleName 模块名
     * @param {Array} apis 对应的api数组
     */
    function extendModule(moduleName, apis) {
        if (!apis || !Array.isArray(apis)) {
            return;
        }
        if (!quick[moduleName]) {
            // 如果没有定义模块，监听整个模块，用代理取值，防止重定义
            // 这样，模块只允许初次定义以及之后的赋值，其它操作都会被内部拒绝
            observeModule(moduleName);
        }
        for (var i = 0, len = apis.length; i < len; i += 1) {
            extendApi(moduleName, apis[i]);
        }
    }

    quick.extendModule = extendModule;
    quick.extendApi = extendApi;
}

function callnativeapiMixin(hybridJs) {
    var quick = hybridJs;
    var JSBridge = quick.JSBridge;
    var callJsBridge = generateJSBridgeTrigger(JSBridge);

    /**
     * 调用自定义API
     * @param {Object} options 配置参数
     * @return {Object} 返回一个Promise对象，如果没有Promise环境，直接返回运行结果
     */
    function callApi(options) {
        // 实时获取promise
        var Promise = quick.getPromise();
        var finalOptions = options || {};

        var callback = function callback(resolve, reject) {
            callJsBridge({
                handlerName: finalOptions.name,
                proto: finalOptions.mudule,
                data: finalOptions.data || {},
                success: finalOptions.success,
                error: finalOptions.error,
                isLongCb: finalOptions.isLongCb,
                isEvent: finalOptions.isEvent
            }, resolve, reject);
        };

        return Promise && new Promise(callback) || callback();
    }

    quick.callApi = callApi;
    quick.callNativeApi = callApi;
}

/**
 * 初始化给配置全局函数
 */
function initMixin(hybridJs) {
    var quick = hybridJs;
    var globalError = quick.globalError;
    var showError = quick.showError;
    var JSBridge = quick.JSBridge;

    /**
     * 几个全局变量 用来控制全局的config与ready逻辑
     * 默认ready是false的
     */
    var readyFunc = void 0;
    var isAllowReady = false;
    var isConfig = false;

    /**
     * 检查环境是否合法，包括
     * 检测是否有检测版本号，如果不是，给出错误提示
     * 是否版本号小于容器版本号，如果小于，给予升级提示
     */
    function checkEnvAndPrompt() {
        if (!quick.runtime || !quick.runtime.getQuickVersion) {
            showError(globalError.ERROR_TYPE_VERSIONNOTSUPPORT.code, globalError.ERROR_TYPE_VERSIONNOTSUPPORT.msg);
        } else {
            quick.runtime.getQuickVersion({
                success: function success(result) {
                    var version = result.version;

                    if (compareVersion(quick.version, version) < 0) {
                        showError(globalError.ERROR_TYPE_VERSIONNEEDUPGRADE.code, globalError.ERROR_TYPE_VERSIONNEEDUPGRADE.msg);
                    }
                },
                error: function error() {
                    showError(globalError.ERROR_TYPE_INITVERSIONERROR.code, globalError.ERROR_TYPE_INITVERSIONERROR.msg);
                }
            });
        }
    }

    /**
     * 页面初始化时必须要这个config函数
     * 必须先声明ready，然后再config
     * @param {Object} params
     * config的jsApiList主要是同来通知给原生进行注册的
     * 所以这个接口到时候需要向原生容器请求的
     */
    quick.config = function config(params) {
        if (isConfig) {
            showError(globalError.ERROR_TYPE_CONFIGMODIFY.code, globalError.ERROR_TYPE_CONFIGMODIFY.msg);
        } else {
            isConfig = true;

            var _success = function _success() {
                // 如果这时候有ready回调
                if (readyFunc) {
                    log('ready!');
                    readyFunc();
                } else {
                    // 允许ready直接执行
                    isAllowReady = true;
                }
            };

            if (quick.os.quick) {
                // 暂时检查环境默认就进行，因为框架默认注册了基本api的，并且这样2.也可以给予相应提示
                checkEnvAndPrompt();

                quick.auth.config(extend({
                    success: function success() {
                        _success();
                    },
                    error: function error(_error) {
                        var tips = JSON.stringify(_error);

                        showError(globalError.ERROR_TYPE_CONFIGERROR.code, tips);
                    }
                }, params));
            } else {
                _success();
            }
        }
    };

    /**
     * 初始化完毕，并且config验证完毕后会触发这个回调
     * 注意，只有config了，才会触发ready，否则无法触发
     * ready只会触发一次，所以如果同时设置两个，第二个ready回调会无效
     * @param {Function} callback 回调函数
     */
    quick.ready = function ready(callback) {
        if (!readyFunc) {
            readyFunc = callback;
            // 如果config先进行，然后才进行ready,这时候恰好又isAllowReady，代表ready可以直接自动执行
            if (isAllowReady) {
                log('ready!');
                isAllowReady = false;
                readyFunc();
            }
        } else {
            showError(globalError.ERROR_TYPE_READYMODIFY.code, globalError.ERROR_TYPE_READYMODIFY.msg);
        }
    };

    /**
     * 注册接收原生的错误信息
     */
    JSBridge.registerHandler('handleError', function (data) {
        showError(globalError.ERROR_TYPE_NATIVE.code, JSON.stringify(data));
    });
}

function authMixin(hybridJs) {
    var quick = hybridJs;

    quick.extendModule('auth', [{
        namespace: 'getToken',
        os: ['quick']
    }, {
        namespace: 'refreshToken',
        os: ['quick']
    }, {
        namespace: 'getUserInfo',
        os: ['quick']
    }, {
        namespace: 'config',
        os: ['quick'],
        defaultParams: {
            // 一个数组，不要传null，否则可能在iOS中会有问题
            jsApiList: []
        }
    }]);
}

function runtimeMixin(hybridJs) {
    var quick = hybridJs;

    quick.extendModule('runtime', [{
        namespace: 'getAppVersion',
        os: ['quick']
    }, {
        namespace: 'getQuickVersion',
        os: ['quick']
    }]);
}

function uiMixin(hybridJs) {
    var quick = hybridJs;

    quick.extendModule('ui', [{
        namespace: 'alert',
        os: ['quick'],
        defaultParams: {
            title: '',
            message: '',
            buttonName: '确定'
        }
    }]);
}

function apinativeMixin(hybridJs) {
    authMixin(hybridJs);
    runtimeMixin(hybridJs);
    uiMixin(hybridJs);
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

function uiMixin$1(hybridJs) {
    var quick = hybridJs;

    quick.extendModule('ui', [{
        namespace: 'alert',
        os: ['h5'],
        defaultParams: {
            title: '',
            message: '',
            buttonName: '确定'
        },
        runCode: function runCode() {
            var options = arguments.length <= 0 ? undefined : arguments[0];
            var resolve = arguments.length <= 1 ? undefined : arguments[1];
            var reject = arguments.length <= 2 ? undefined : arguments[2];

            // 支持简单的调用，alert(msg, title, btn)              
            if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
                options = {
                    message: arguments.length <= 0 ? undefined : arguments[0],
                    title: '',
                    buttonName: '确定'
                };
                // 处理快速调用时的 resolve 与参数关系
                if (typeof (arguments.length <= 1 ? undefined : arguments[1]) === 'string') {
                    options.title = arguments.length <= 1 ? undefined : arguments[1];
                    if (typeof (arguments.length <= 2 ? undefined : arguments[2]) === 'string') {
                        options.buttonName = arguments.length <= 2 ? undefined : arguments[2];
                        resolve = arguments.length <= 3 ? undefined : arguments[3];
                        reject = arguments.length <= 4 ? undefined : arguments[4];
                    } else {
                        resolve = arguments.length <= 2 ? undefined : arguments[2];
                        reject = arguments.length <= 3 ? undefined : arguments[3];
                    }
                }
            }

            if (window.alert) {
                // 可以使用自己的alert,并在回调中成功
                window.alert(options.message, options.title, options.buttonName, function () {
                    options.success && options.success({});
                    resolve && resolve({});
                });

                // 这里由于是window的alert，所以直接成功
                options.success && options.success({});
                resolve && resolve({});
            } else {
                options.error && options.error({});
                reject && reject({});
            }
        }
    }]);
}

function apih5Mixin(hybridJs) {
    uiMixin$1(hybridJs);
}

function apiMixin(hybridJs) {
    apinativeMixin(hybridJs);
    apih5Mixin(hybridJs);
}

function mixin(hybridJs) {
    var quick = hybridJs;

    osMixin(quick);
    promiseMixin(quick);
    errorMixin(quick);
    // 不依赖于promise，但是是否有Promise决定返回promise对象还是普通函数
    proxyMixin(quick);
    // 依赖于showError，globalError，os
    jsbridgeMixin(quick);
    // api没有runcode时的默认实现，依赖于jsbridge与os
    callinnerMixin(quick);
    // 依赖于os，Proxy，globalError，showError，以及callInner
    defineapiMixin(quick);
    // 依赖于JSBridge，Promise,sbridge
    callnativeapiMixin(quick);
    // init依赖与基础库以及部分原生的API
    initMixin(quick);
    // api添加，这才是实际调用的api
    apiMixin(quick);
}

var quick = {};

mixin(quick);

quick.Version = '1.0.0';

return quick;

})));
