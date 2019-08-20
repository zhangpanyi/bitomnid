const request = require('request');
const logger = require('./common/logger');
 
function Notify() {
    let symbol      = '';   // 代币符号
    let address     = null; // 接收地址
    let hash        = null; // 交易ID
    let vout        = null; // 输出位置
    let amount      = '0';  // 转账金额

    // 投递通知
    this.post = function(urls) {
        if (!urls) {
            return;
        }
        if (!urls instanceof Array) {
            urls = [urls];
        }

        this.type = 'transaction';
        let data = JSON.stringify(this);
        for (let idx = 0; idx < urls.length; idx++) {
            let options = {
                url:    urls[idx],
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data
            };
            request.post(options, function (error, response, body) {
                if (error != null) {
                    logger.error('Failed to post notify: %s, %s', error.message, options.json);
                }
            });
        }
    }
};

module.exports = Notify;
