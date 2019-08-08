const nothrow = require('../common/nothrow');
const server = require('../../config/server');

// 创建新地址
module.exports = async function(client, req, callback) {
    let address, error;
    [error, address] = await nothrow(client.getNewAddress(server.paymentAccount));
    if (error != null) {
        error = {code: -32000, message: error.message};
        callback(error, undefined);
        return;
    }
    callback(undefined, address);
}
