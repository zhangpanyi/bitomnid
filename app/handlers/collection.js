
const BigNumber = require('bignumber.js');
const utils = require('./utils/utils.js');
const nothrow = require('../common/nothrow');
const tokens = require("../../config/tokens");

// 交易输入
class Input {
    constructor(txid, vout, amount) {
        this.txid = txid;
        this.vout = vout;
        this.amount = amount;
    }
}

// 归集比特币
async function collectionBTC(client) {
    // 获取基本信息
    const hot = await utils.getHotAddress(client);
    const addresses = await utils.getPaymentAddresses(client);
    let listunspent = await utils.getUnspentByAddresses(client, addresses);
    listunspent = await utils.getUnspentWithNoOmniBalance(client, listunspent, tokens.propertyid);
    if (listunspent.length == 0) {
        return null;
    }

    // 创建输入和输出
    let inputs = [];
    for (let idx in listunspent) {
        const unspent = listunspent[idx];
        inputs.push({txid: unspent.txid, vout: unspent.vout});
    }

    const output = {};
    output[hot] = listunspent[0].amount;

    // 创建原始交易
    const feeBudget = new BigNumber(0.0005);
    let rawtx = await client.createRawTransaction(inputs, output);
    rawtx = await client.fundRawTransaction(rawtx,
        {'changeAddress': hot, 'feeRate': feeBudget.toString(10)});
    const txsigned = await client.signRawTransaction(rawtx.hex);
    const txid = await client.sendRawTransaction(txsigned.hex);
    return txid;
}

// 归集泰达币
async function collectionUSDT(client, min_amount) {
    // 获取基本信息
    min_amount = new BigNumber(min_amount);
    const hot = await utils.getHotAddress(client);
    const addresses = await utils.getPaymentAddresses(client);
    let listunspent = await utils.getUnspentByAddresses(client, addresses);
    const balances = await this.getOmniWalletBalances(client, propertyid);

    // 寻找交易载体
    let insufficient = new Map();
    let transactions = new Array();
    const feeBudget = new BigNumber(0.0005);
    for (let idx in listunspent) {
        const unspent = listunspent[idx];
        if (balances.has(unspent.address)) {
            let b = new BigNumber(balances.get(unspent.address));
            if (b.comparedTo(min_amount) == -1) {
                balances.delete(unspent.address);
                continue;
            }

            let amount = new BigNumber(unspent.amount);
            let input = new Input(unspent.txid, unspent.vout, amount);
            if (amount.comparedTo(feeBudget) >= 0) {
                balances.delete(unspent.address);
                transactions.push({inputs: [input], amount: b});
            } else {
                if (insufficient.has(unspent.address)) {
                    let item = insufficient.get(unspent.address);
                    item.inputs.push(input);
                    insufficient.set(unspent.address, item);

                    let sum = new BigNumber(0);
                    for (let i = 0; i < item.inputs.length; i++) {
                        sum = sum.plus(item.inputs[i].amount);
                    }
                    if (sum.comparedTo(feeBudget) >= 0) {
                        balances.delete(unspent.address);
                        insufficient.delete(unspent.address);
                        transactions.push({inputs: item.inputs, amount: b});
                    }
                    continue;
                }
                insufficient.set(unspent.address, {inputs: [input], amount: b});
            }
        }
    }

    return array;
}

module.exports = async function(client, req, callback) {
   const rule = [
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
        }
    ];
    if (!utils.validationParams(req, rule, callback)) {
        return;
    }

    let error, txid;
    if (rule[0] == 'BTC') {
        [error, txid] = await nothrow(collectionBTC(client));
    } else if (rule['symbol'] == 'USDT') {
        [error, txid] = await nothrow(await collectionUSDT(client));
    }

    if (error == null) {
        callback(undefined, txid);
    } else {
        callback({code: -32000, message: error.message}, undefined);
    }
}
