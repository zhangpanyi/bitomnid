const BigNumber = require('bignumber.js');

module.exports = {
    // 验证参数规则
    validationParams: function(req, rule, callback) {
        let params = req.params;
        for (let i = 0; i < rule.length; i++) {
            if (i >= params.length) {
                if (rule[i].value == null) {
                    let error = {code: -32602, message: rule[i].name+' is required'};
                    callback(error, undefined);
                    return false;
                }
                continue;
            }

            if (!rule[i].is_valid(params[i].toString())) {
                let error = {code: -32602, message: rule[i].name+' is invalid param'};
                callback(error, undefined);
                return false;
            }
        }
        return true;
    },

    // 填充交易输入
    fillTransactionInputs: function(listunspent, inputs, maxNum) {
        let set = new Set();
        for (let idx = 0; idx < inputs.length; idx++) {
            const input = inputs[idx];
            set.add(input.txid + ':' + input.vout)
        }

        let count = 0;
        let amount = new BigNumber(0);
        for (let idx = 0; idx < listunspent.length;) {
            const unspent = listunspent[idx];
            if (set.has(unspent.txid + ':' + unspent.vout)) {
                idx++;
                continue;
            }
            count++;
            amount = amount.plus(new BigNumber(unspent.amount));
            inputs.push({txid: unspent.txid, vout: unspent.vout});

            if (count >= maxNum) {
                break;
            }
            listunspent[idx] = listunspent[listunspent.length - 1];
            listunspent.length = listunspent.length - 1;
        }
        return [listunspent, inputs, amount.toString(), count];
    },

    // 获取热钱包地址
    asyncGetHotAddress: async function(client) {
        const addresses = await client.getAddressesByAccount('hot');
        if (addresses.length == 0) {
            const address = await client.getAccountAddress('hot');
            return [address];
        }
        return addresses[0];
    },

    // 获取付款钱包地址
    asyncGetPaymentAddresses: async function(client) {
        return await client.getAddressesByAccount('payment');
    },

    // 获取Omni代币余额
    asyncGetOmniWalletBalances: async function (client, propertyid) {
        let balances = new Map();
        const array = await client.omni_getwalletaddressbalances();
        for (let idx in array) {
            const address = array[idx];
            for (let idx in address.balances) {
                const balance = address.balances[idx];
                if (balance.propertyid == propertyid) {
                    balances.set(address.address, balance.balance);
                    break;
                }
            }
        }
        return balances;
    },

    // 获取未消费输出
    asyncGetUnspentByAddresses: async function (client, addresses, minBalance) {
        let array = new Array();
        const listunspent = await client.listUnspent(1, 999999999, addresses);
        for (const index in listunspent) {
            const unspent = listunspent[index];
            if (!minBalance) {
                array.push(unspent);
            } else if (unspent.amount >= minBalance) {
                array.push(unspent);
            }
        }
        return array;
    },

    // 获取没有Omni余额未消费输出
    asyncGetUnspentWithNoOmniBalance: async function (client, listunspent, propertyid) {
        let array = new Array();
        const balances = await this.asyncGetOmniWalletBalances(client, propertyid);
        for (let idx in listunspent) {
            const unspent = listunspent[idx];
            if (!balances.has(unspent.address)) {
                array.push(unspent);
            }
        }
        return array;
    },
};
