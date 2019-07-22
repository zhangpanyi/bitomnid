
const BigNumber = require('bignumber.js');

const utils = require('./utils/utils.js');
const feeutils = require('./utils/feeutils.js');

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
    if (inputs.length == 0) {
        return null;
    }

    // 获取手续费率
    const feeRate = await feeutils.asyncGetFeeRate(client);
    const output = {};
    output[hot] = feeRate;

    // 创建原始交易
    let rawtx = await client.createRawTransaction(inputs, output);
    rawtx = await client.fundRawTransaction(rawtx,
        {changeAddress: hot, feeRate: feeRate});
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
    const balances = await utils.asyncGetOmniWalletBalances(client, tokens.propertyid);

    // 匹配交易事务
    let transactions;
    balances.delete(hot);
    [transactions, listunspent] = matchTransactions(listunspent, balances, minAmount);
    if (transactions.length == 0) {
        return [];
    }

    // 获取手续费率
    const feeRate = await feeutils.asyncGetFeeRate(client);

    // 发送到主地址
    let txs = [];
    listunspent = listunspent.concat(await utils.asyncGetUnspentByAddresses(client, [hot]));
    for (let idx = 0; idx < transactions.length; idx++) {
        let txid, ok;
        const tx = transactions[idx];
        [txid, listunspent, ok] = await asyncSendUSDT(client, listunspent, tx.inputs, hot, tx.amount, feeRate);
        if (!ok) {
            break;
        }
        txs.push(txid);
    }
    return txs;
}

// 匹配交易事务
function matchTransactions(listunspent, omniBalances, minAmount) {
    let transactions = new Array();
    for (let idx  = 0; idx < listunspent.length;) {
        const unspent = listunspent[idx];
        if (!omniBalances.has(unspent.address)) {
            idx++;
            continue;
        }

        let balance = new BigNumber(omniBalances.get(unspent.address));
        if (balance.comparedTo(minAmount) == -1) {
            idx++;
            omniBalances.delete(unspent.address);
            continue;
        }
        
        omniBalances.delete(unspent.address);
        let amount = new BigNumber(unspent.amount);
        let input = new Input(unspent.txid, unspent.vout, amount);
        transactions.push({inputs: [input], amount: balance});

        listunspent[idx] = listunspent[listunspent.length - 1];
        listunspent.length = listunspent.length - 1;
    }
    return [transactions, listunspent];
}

// 发送USDT到地址
async function asyncSendUSDT(client, listunspent, inputs, to, amount, feeRate) {
    if (listunspent.length == 0) {
        return [null, listunspent, false];
    }

    let addamount;
    let count = 0;
    [listunspent, inputs, addamount, count] = utils.fillTransactionInputs(listunspent, inputs, 1);
    if (count == 0) {
        return [null, listunspent, false];
    }

    let rawtx = await client.createRawTransaction(inputs, {});
    let payload = await client.omni_createpayload_simplesend(tokens.propertyid, amount.toString());
    rawtx = await client.omni_createrawtx_opreturn(rawtx, payload);
    rawtx = await client.omni_createrawtx_reference(rawtx, to);
    rawtx = await client.fundRawTransaction(rawtx, {changeAddress: to, feeRate: feeRate});
    const txsigned = await client.signRawTransaction(rawtx.hex);
    const txid = await client.sendRawTransaction(txsigned.hex);
    return txid;
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
        },
        {
            name: 'minAmount',
            value: '50',
            is_valid: function(amount) {
                if (!validator.isFloat(amount)) {
                    return false;
                }
                this.value = amount;
                return true;
            }
        },
    ];
    if (!utils.validationParams(req, rule, callback)) {
        return;
    }

    let error, txid;
    if (rule[0] == 'BTC') {
        [error, txid] = await nothrow(asyncCollectionBTC(client));
    } else if (rule['symbol'] == 'USDT') {
        [error, txid] = await nothrow(asyncCollectionUSDT(client, rule[1]));
    }

    if (error == null) {
        callback(undefined, txid);
    } else {
        callback({code: -32000, message: error.message}, undefined);
    }
}
