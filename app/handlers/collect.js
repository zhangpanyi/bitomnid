
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
async function asyncCollectionBTC(client) {
    // 获取基本信息
    const hot = await utils.asyncGetHotAddress(client);
    const addresses = await utils.asyncGetPaymentAddresses(client);
    let listunspent = await utils.asyncGetUnspentByAddresses(client, addresses);
    listunspent = await utils.asyncGetUnspentWithNoOmniBalance(client, listunspent, tokens.propertyid);
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
        {changeAddress: hot, feeRate: feeBudget.toString(10)});
    const txsigned = await client.signRawTransaction(rawtx.hex);
    const txid = await client.sendRawTransaction(txsigned.hex);
    return txid;
}

// 归集泰达币
async function asyncCollectionUSDT(client, minAmount) {
    // 获取基本信息
    minAmount = new BigNumber(minAmount);
    const hot = await utils.asyncGetHotAddress(client);
    const addresses = await utils.asyncGetPaymentAddresses(client);
    let listunspent = await utils.asyncGetUnspentByAddresses(client, addresses);
    const balances = await utils.asyncGetOmniWalletBalances(client, propertyid);

    // 匹配交易事务
    let transactions = matchTransactions(listunspent, balances, minAmount);
    if (transactions.length == 0) {
        return [];
    }

    // 生成交易信息
    

    return array;
}

// 匹配交易事务
async function matchTransactions(listunspent, omniBalances, minAmount) {
    let transactions = new Array();
    for (let idx in listunspent) {
        const unspent = listunspent[idx];
        if (omniBalances.has(unspent.address)) {
            let balance = new BigNumber(omniBalances.get(unspent.address));
            if (balance.comparedTo(minAmount) == -1) {
                omniBalances.delete(unspent.address);
                continue;
            }
            
            omniBalances.delete(unspent.address);
            let amount = new BigNumber(unspent.amount);
            let input = new Input(unspent.txid, unspent.vout, amount);
            transactions.push({inputs: [input], amount: balance});
        }
    }
    return transactions;
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
        [error, txid] = await nothrow(asyncCollectionBTC(client));
    } else if (rule['symbol'] == 'USDT') {
        [error, txid] = await nothrow(asyncCollectionUSDT(client));
    }

    if (error == null) {
        callback(undefined, txid);
    } else {
        callback({code: -32000, message: error.message}, undefined);
    }
}
