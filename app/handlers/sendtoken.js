const validator = require('validator');
const BigNumber = require('bignumber.js');

const utils = require('./utils/utils.js');
const feeutils = require('./utils/fee.js');

const logger = require('../common/logger');
const nothrow = require('../common/nothrow');

const tokens = require("../../config/tokens");

// 发送比特币
async function asyncSendBTC(client, to, amount) {
    // 获取基本信息
    const hot = await utils.asyncGetHotAddress(client);
    let listunspent = await utils.asyncGetPaymentAccountUnspent(client);
    listunspent = await utils.asyncGetUnspentWithNoOmniBalance(client, listunspent, tokens.propertyid);

    // 创建输入和输出
    let inputs = [];
    let sum = new BigNumber(0);
    amount = new BigNumber(amount);
    for (let idx in listunspent) {
        const unspent = listunspent[idx];
        sum = sum.plus(new BigNumber(unspent.amount));
        inputs.push({txid: unspent.txid, vout: unspent.vout});
        if (sum.comparedTo(amount) >= 0) {
            break
        }
    }
    if (sum.comparedTo(amount) == -1) {
        listunspent = await utils.asyncGetHotAccountUnspent(client);
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
    while (true) {
        let rawtx = await client.createRawTransaction(inputs, output);
        let txsigned = await client.signRawTransaction(rawtx);
        const bytes = parseInt((txsigned.hex.length + 100) / 2);
        const fee = feeutils.calculateFee(bytes, feeRate);
        if (sum.minus(amount).comparedTo(fee) < 0) {
            let count = 0;
            let addamount;
            [listunspent, inputs, addamount, count] = utils.fillTransactionInputs(listunspent, inputs, 1);
            if (count == 0) {
                throw new Error('Insufficient funds');
            }
            sum = sum.plus(new BigNumber(addamount));
            continue;
        }

        rawtx = await client.fundRawTransaction(rawtx, {changeAddress: hot, feeRate: feeRate});
        txsigned = await client.signRawTransaction(rawtx.hex);
        return await client.sendRawTransaction(txsigned.hex);
    }
}

// 发送泰达币
async function asyncSendUSDT(client, to, amount) {
    // 获取交易载体
    const hot = await utils.asyncGetHotAddress(client);
    let listunspent = await utils.asyncGetHotAccountUnspent(client);
    if (listunspent.length == 0) {
        throw new Error('Insufficient funds');
    }
    let sum = new BigNumber(listunspent[0].amount);
    let inputs = [{txid: listunspent[0].txid, vout: listunspent[0].vout}];
    listunspent[0] = listunspent[listunspent.length-1];
    listunspent.length = listunspent.length-1;

    // 获取未消费输出
    let listunspent2 = await utils.asyncGetPaymentAccountUnspent(client);
    listunspent2 = await utils.asyncGetUnspentWithNoOmniBalance(client, listunspent2, tokens.propertyid);
    listunspent = listunspent.concat(listunspent2);

    // 获取手续费率
    const feeRate = await feeutils.asyncGetFeeRate(client);

    // 计算并发送泰达币
    while (true) {
        if (listunspent.length == 0) {
            throw new Error('Insufficient funds');
        }
    
        let addamount;
        let count = 0;
        [listunspent, inputs, addamount, count] = utils.fillTransactionInputs(listunspent, inputs, 1);
        if (count == 0) {
            throw new Error('Insufficient funds');
        }
        sum = sum.plus(new BigNumber(addamount));

        let rawtx = await client.createRawTransaction(inputs, {});
        let payload = await client.omni_createpayload_simplesend(tokens.propertyid, amount.toString());
        rawtx = await client.omni_createrawtx_opreturn(rawtx, payload);
        rawtx = await client.omni_createrawtx_reference(rawtx, to);
        let txsigned = await client.signRawTransaction(rawtx);
        const bytes = parseInt((txsigned.hex.length + 100) / 2);
        const fee = feeutils.calculateFee(bytes, feeRate);
        if (sum.comparedTo(fee) < 0) {
            continue;
        }

        rawtx = await client.fundRawTransaction(rawtx, {changeAddress: hot, feeRate: feeRate});
        txsigned = await client.signRawTransaction(rawtx.hex);
        const txid = await client.sendRawTransaction(txsigned.hex);
        return txid;
    }
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
                if (symbol == 'BTC' || symbol == 'USDT') {
                    this.value = symbol;
                    return true;
                }
                return false;
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
    if (rule[1].value == 'BTC') {
        [error, txid] = await nothrow(asyncSendBTC(client, rule[0].value, rule[2].value));
    } else if (rule[1].value == 'USDT') {
        [error, txid] = await nothrow(asyncSendUSDT(client, rule[0].value, rule[2].value));
    }

    if (error == null) {
        callback(undefined, txid);
        logger.error('Send token success, symbol: %s, to: %s, amount: %s, txid: %s',
            rule[1].value, rule[0].value, rule[2].value, txid);
    } else {
        callback({code: -32000, message: error.message}, undefined);
        logger.error('Failed to send token, symbol: %s, to: %s, amount: %s, reason: %s',
            rule[1].value, rule[0].value, rule[2].value, error.message);
    }
}
