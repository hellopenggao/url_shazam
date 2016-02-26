//正则表达式列表
var regexpTable = []
chrome.storage.sync.get({'regexp_data': null}, function (result) {
    var data = result.regexp_data
    if (data == null)
        return
    regexpTable = data
});

var optionTabId = undefined
//打开设置页
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.create({'url': chrome.runtime.getURL('option.html')}, function (tab) {
        optionTabId = tab.id
    })
})

//重定向非地址栏
chrome.webRequest.onBeforeRequest.addListener(
    function (info) {
        if (info.url == chrome.runtime.getURL('option.html'))
            return {'cancel': false}
        for (var i = 0; i < regexpTable.length; i++) {
            if (regexpTable[i] == undefined)
                continue
            if (regexpTable[i][3] == "checked") {
                var patt = new RegExp(regexpTable[i][1])
                if (regexpTable[i][1] == info.url || patt.test(info.url)) {
                    var decode_url = decodeURIComponent(patt.exec(info.url))
                    if (regexpTable[i][2] == info.url)
                        return {'cancel': false}
                    else if (regexpTable[i][2] == "shazam") {
                        if (decode_url == info.url)
                            return {'cancel': false}
                        else
                            return {redirectUrl: decode_url}
                    }
                    else
                        return {redirectUrl: regexpTable[i][2]}
                }
            }
        }
        return {'cancel': false}
    },
    {
        urls: ["<all_urls>"]
    },
    ["blocking"]);

//重定向地址栏
chrome.webNavigation.onBeforeNavigate.addListener(function (data) {
    if (data.url == chrome.runtime.getURL('option.html'))
        return
    //console.log('berfore is:' + data.url)
    for (var i = 0; i < regexpTable.length; i++) {
        if (regexpTable[i] == undefined)
            continue
        if (regexpTable[i][3] == "checked") {
            var patt = new RegExp(regexpTable[i][1])
            if (regexpTable[i][1] == data.url || patt.test(data.url)) {
                var decode_url = decodeURIComponent(patt.exec(data.url))
                console.log(decode_url)
                if (regexpTable[i][2] == data.url)
                    return
                else if (regexpTable[i][2] == "shazam") {
                    if (decode_url == data.url)
                        return
                    else
                        chrome.tabs.update(null, {url: decode_url}, function () {
                        })
                }
                else
                    chrome.tabs.update(null, {url: regexpTable[i][2]}, function () {
                    })
            }
        }
    }
})

//监听数据变化
chrome.storage.onChanged.addListener(function (changes, sync) {
    for (key in changes) {
        var storageChange = changes[key];
        if (key == 'regexp_data')
            regexpTable = storageChange.newValue
    }
})

//当设置页面关闭时，整理数组，丢掉空白数据
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (tabId == optionTabId) {
        spliceTable(regexpTable)
        chrome.storage.sync.set({'regexp_data': regexpTable}, function () {

        })
    }
    console.log(regexpTable)
})

//递归删除undefined元素
function spliceTable(table) {
    for (var i = 0; i < regexpTable.length; i++) {
        if (regexpTable[i] == undefined) {
            regexpTable.splice(i, 1)
            return spliceTable(table)
        }
    }
}