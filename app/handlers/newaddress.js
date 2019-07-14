const nothrow = require('../common/nothrow');

module.exports = async function(client, req, callback) {
    let address, error;
    [error, address] = await nothrow(client.getNewAddress('payment'));
    if (error != null) {
        error = {code: -32000, message: error.message};
        callback(error, undefined);
        return;
    }
    callback(undefined, address);
}
