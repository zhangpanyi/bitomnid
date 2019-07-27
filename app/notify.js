const request = require('request');
const logger = require('./common/logger');
 
function Notify() {
    let symbol      = '';   // 代币符号
    let address     = null; // 接收地址
    let hash        = null; // 交易ID
    let vout        = null; // 输出位置
    let amount      = '0';  // 转账金额

    // 投递通知
    this.post = function(url) {
        if (!url) {
            return;
        }
        this.type = 'transaction';
        let data = JSON.stringify(this);
        let options = {
            url: url,
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
};

module.exports = Notify;
