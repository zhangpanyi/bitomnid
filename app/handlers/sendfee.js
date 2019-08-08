const validator = require('validator');
const BigNumber = require('bignumber.js');

const utils = require('./utils/utils.js');
const feeutils = require('./utils/fee.js');

const logger = require('../common/logger');
const nothrow = require('../common/nothrow');

const tokens = require("../../config/tokens");

// 发送手续费
async function asyncSendFee(client, minAmount) {
    // 获取USDT余额
    minAmount = new BigNumber(minAmount);
    const hot = await utils.asyncGetHotAddress(client);
    const balances = await utils.asyncGetOmniWalletBalances(client, tokens.propertyid);
    for (let [key, _] of balances) {
        let amount = new BigNumber(balances.get(key));
        if (amount.comparedTo(minAmount) == -1) {
            balances.delete(key);
        }
    }
    balances.delete(hot);
    if (balances.size == 0) {
        return [];
    }
    
    // 获取未消费输出
    let listunspent = await utils.asyncGetPaymentAccountUnspent(client);
    listunspent = await utils.asyncGetUnspentWithNoOmniBalance(client, listunspent, tokens.propertyid);
    listunspent = listunspent.concat(await utils.asyncGetHotAccountUnspent(client));
    if (listunspent.length == 0) {
        return [];
    }

    // 获取手续费率
    const feeRate = await feeutils.asyncGetFeeRate(client);

    // 生成交易输出
    let output = {};
    let sum = new BigNumber(0);
    for (let [key, _] of balances) {
        output[key] = feeRate;
        sum = sum.plus(new BigNumber(feeRate));
    }

    // 生成交易输入
    let inputs = [];
    let sendAmount = new BigNumber(0);
    while (true) {
        if (listunspent.length == 0) {
            break;
        }
        [listunspent, inputs, addamount, count] = utils.fillTransactionInputs(listunspent, inputs, 1);
        if (count == 0) {
            break;
        } 
        sendAmount = sendAmount.plus(addamount);
        if (sendAmount.comparedTo(sum) >= 0) {
            break;
        }
    }

    // 创建原始交易
    while (true) {
        let rawtx = await client.createRawTransaction(inputs, output);
        let txsigned = await client.signRawTransaction(rawtx);
        const bytes = parseInt((txsigned.hex.length + 100) / 2);
        const fee = feeutils.calculateFee(bytes, feeRate);
        if (sendAmount.minus(sum).comparedTo(fee) < 0) {
            if (Object.keys(output) == 0) {
                return null;
            }
            sum = sum.minus(feeRate);
            let key = Object.keys(output)[0];
            delete output[key];
            continue;
        }

        rawtx = await client.fundRawTransaction(rawtx, {changeAddress: hot, feeRate: feeRate});
        txsigned = await client.signRawTransaction(rawtx.hex);
        return await client.sendRawTransaction(txsigned.hex);
    }
}

module.exports = async function(client, req, callback) {
    const rule = [
        {
            name: 'minAmount',
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
    [error, txid] = await nothrow(asyncSendFee(client, rule[0].value));
    if (error == null) {
        callback(undefined, txid);
        logger.error('Send fee success, txid: %s', txid);
    } else {
        callback({code: -32000, message: error.message}, undefined);
        logger.error('Failed to send fee, reason: %s', error.message);
    }
 }