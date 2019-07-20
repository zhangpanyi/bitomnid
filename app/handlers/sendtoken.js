const BigNumber = require('bignumber.js');
const utils = require('./utils/utils.js');
const nothrow = require('../common/nothrow');
const tokens = require("../../config/tokens");
const feeutils = require('./utils/feeutils.js');

// 发送比特币
async function asyncSendBTC(client, to, amount) {
    // 获取基本信息
    const hot = await utils.asyncGetHotAddress(client);
    const addresses = await utils.asyncGetPaymentAddresses(client);
    let listunspent = await utils.asyncGetUnspentByAddresses(client, addresses);
    listunspent = await utils.filterUnspentWithOmniBalacne(client, listunspent, tokens.propertyid);

    // 创建输入和输出
    let inputs = [];
    let sum = new BigNumber(0);
    amount = new BigNumber(amount);
    for (let idx in listunspent) {
        const unspent = listunspent[idx];
        inputs.push({txid: unspent.txid, vout: unspent.vout});
        sum = sum.plus(new BigNumber(unspent.amount));
        if (sum.comparedTo(amount) >= 0) {
            break
        }
    }
    if (sum.comparedTo(amount) == -1) {
        listunspent = await utils.asyncGetUnspentByAddresses(client, [hot]);
        for (let idx in listunspent) {
            const unspent = listunspent[idx];
            inputs.push({txid: unspent.txid, vout: unspent.vout});
            sum = sum.plus(new BigNumber(unspent.amount));
            if (sum.comparedTo(amount) >= 0) {
                break
            }
        }
    }

    const output = {};
    output[to] = amount.toString(10);

    // 获取手续费率
    const feeRate = await feeutils.asyncGetFeeRate(client);

    // 创建原始交易
    let hex;
    while (true) {
        let rawtx = await client.createRawTransaction(inputs, output);
        rawtx = await client.fundRawTransaction(rawtx, {changeAddress: hot, feeRate: feeRate});
        const txsigned = await client.signRawTransaction(rawtx.hex);
        const fee = feeutils.calculateFee(txsigned.hex.length, feeRate);
        if (sum.minus(amount).comparedTo(fee) >= 0) {
            hex = txsigned.hex;
            break;
        }

        let count = 0;
        [listunspent, inputs, count] = fillTransactionInputs(listunspent, inputs, 1);
        if (count == 0) {
            throw new Error('Insufficient funds');
        }
    }

    // 发送原始交易
    const txid = await client.sendRawTransaction(hex);
    return txid;
}

// 发送泰达币
async function asyncSendUSDT(client, to, amount) {
    const address = await utils.asyncGetHotAddress(client);
    const txid = await utils.omni_send(address, to, tokens.propertyid, amount);
    return txid;
}

module.exports = async function(client, req, callback) {
   const rule = [
        {
            name: 'to',
            value: null,
            is_valid: function(address) {
                this.value = address;
                return true;
            }
        },
        {
            name: 'symbol',
            value: null,
            is_valid: function(symbol) {
                symbol = symbol.toUpperCase();
                if (symbol != 'BTC' || symbol != 'USDT') {
                    return false;
                }
                this.value = symbol;
                return true;
            }
        },
        {
            name: 'amount',
            value: null,
            is_valid: function(amount) {
                if (!validator.isFloat(amount)) {
                    return false;
                }
                this.value = amount;
                return true;
            }
        }
    ];
    if (!utils.validationParams(req, rule, callback)) {
        return;
    }

    let error, txid;
    if (rule[1] == 'BTC') {
        [error, txid] = await nothrow(asyncSendBTC(client, rule[0], rule[2]));
    } else if (rule['symbol'] == 'USDT') {
        [error, txid] = await nothrow(asyncSendUSDT(client, rule[0], rule[2]));
    }

    if (error == null) {
        callback(undefined, txid);
    } else {
        callback({code: -32000, message: error.message}, undefined);
    }
}
