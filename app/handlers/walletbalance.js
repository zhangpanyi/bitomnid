const BigNumber = require('bignumber.js');

const utils = require('./utils/utils.js');

const nothrow = require('../common/nothrow');
const tokens = require("../../config/tokens");

// 获取BTC余额
async function asyncGetBalance(client) {
    let balance = new BigNumber('0');
    let listunspent = await client.listUnspent(1, 999999999);
    for (let idx = 0; idx < listunspent.length; idx++) {
        const unspent = listunspent[idx];
        balance = balance.plus(new BigNumber(unspent.amount));
    }
    return balance.toString(10);
}

// 获取USDT余额
async function asyncGetOmniBalance(client) {
    let balance = new BigNumber('0');
    const balances = await utils.asyncGetOmniWalletBalances(client, tokens.propertyid);
    for (let [_, amount] of balances) {
        balance = balance.plus(new BigNumber(amount));
    }
    return balance.toString(10);
}

module.exports = async function(client, req, callback) {
    const rule = [
        {
            name: 'symbol',
            value: null,
            is_valid: function(symbol) {
                symbol = symbol.toUpperCase();
                if (symbol == 'BTC' || symbol == 'USDT') {
                    this.value = symbol;
                    return true;
                }
                return false;
            }
        }
    ];
    if (!utils.validationParams(req, rule, callback)) {
        return;
    }

    let error, balance;
    if (rule[0].value == 'BTC') {
        [error, balance] = await nothrow(asyncGetBalance(client));
    } else if (rule[0].value== 'USDT') {  
        [error, balance] = await nothrow(asyncGetOmniBalance(client));
    }
    
    if (error == null) {
       callback(undefined, balance);
    } else {
       callback({code: -32000, message: error.message}, undefined);
    }
 }
 