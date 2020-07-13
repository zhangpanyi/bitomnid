const BigNumber = require('bignumber.js');

const Const = require('./const');
const Notify = require('./notify');
const UnSpent = require('./unspent');

const sleep = require('./common/sleep');
const logger = require('./common/logger');

const server = require('../config/server');

class Poller {
    constructor(client) {
        this._client = client;
        this._extra = new Set();
        this._unspentSet = new Set();
    }

    // 开始轮询
    async startPolling() {
        // 初始化状态
        this._unspentSet = new Set(UnSpent.getListUnspent());
        
        // 轮询状态变更
        while (true) {
            try {
                await sleep(5 * 1000);

                // 获取unspent
                let set, listunspent;
                [set, listunspent] = await this._asyncGetUnspentSet();
                set = new Set([...this._extra, ...set]);
                this._extra.clear();
    
                // 获取新增交易
                let add = new Array();
                for (let key of set) {
                    if (!this._unspentSet.has(key)) {
                        add.push(key);
                    }
                }
    
                // 解析交易信息
                for (let idx = 0; idx < add.length; idx++) {
                    const slice = add[idx].split(':');
                    try {
                        await this._asyncParseTranstion(slice[0], parseInt(slice[1]));
                    } catch (error) {
                        logger.warn("Failed to parse transtion, txid: %s, vout: %s, %s",
                            slice[0], parseInt(slice[1]), error.message);
                    } 
                }

                // 更新未消费输出
                this._unspentSet = set;
                UnSpent.setListUnspent(Array.from(set));
            } catch (error) {
                logger.warn("Failed to polling list unspent, %s", error.message);
            }
        }
    }

    // 获取未消费输出
    async asyncGetListtUnspent() {
        let set, listunspent;
        [set, listunspent] = await this._asyncGetUnspentSet();
        this._extra = new Set([...this._extra, ...set]);
        return listunspent;
    }


    // 获取未消费输出集合
    async _asyncGetUnspentSet() {
        let array = [];
        let set = new Set();
        const listunspent = await this._client.listUnspent(1, 999999999);
        for (const index in listunspent) {
            const unspent = listunspent[index];
            if (unspent.account !== server.paymentAccount) {
                continue;
            }
            array.push(unspent);
            set.add(unspent.txid + ':' + unspent.vout);
        }
        return [set, array];
    }

    // 是否包含我发送
    async _asyncHasSendFromMine(details) {
        for (let idx = 0; idx < details.length; idx++) {
            const item = details[idx];
            if (item.category == 'send') {
                const result = await this._client.validateAddress(item.address);
                if (result.ismine) {
                    return true;
                }
            }
        }
        return false;
    }

    // 获取充值金额
    async _asyncGetPaymentAmount(details, vout) {
        for (let idx = 0; idx < details.length; idx++) {
            const item = details[idx];
            if (item.category == 'receive' && item.vout == vout) {
                return [item.address, item.amount];
            }
        }
        return [null, '0'];
    }

    // 解析Omni交易
    async _asyncParseOmniTranstion(txid) {
        const tx = await this._client.omni_gettransaction(txid);
        if (!tx.valid || !tx.ismine || tx.propertyid != server.propertyid) {
            return;
        }

        const result = await this._client.validateAddress(tx.sendingaddress);
        if (result.ismine) {
            return;
        }

        let notify = new Notify();
        notify.symbol      = 'USDT';
        notify.address     = tx.referenceaddress;
        notify.hash        = tx.txid;
        notify.amount      = tx.amount;
        notify.post(server.notify);
        logger.warn('Transfer has been received, symbol: %s, address: %s, amount: %s, txid: %s',
            notify.symbol, notify.address, notify.amount, notify.hash);
    }

    // 解析交易信息
    async _asyncParseTranstion(txid, vout) {
        let tx = await this._client.getTransaction(txid);
        if (await this._asyncHasSendFromMine(tx.details)) {
            return false;
        }
        if (tx.hex.search(Const.OmniSimpleSendHeader) > 0) {
            await this._asyncParseOmniTranstion(txid);
        }
        
        let address, amount;
        [address, amount] = await this._asyncGetPaymentAmount(tx.details, vout);
        const zero = new BigNumber(0);
        amount = new BigNumber(amount);
        if (amount.comparedTo(zero) <= 0) {
            return false;
        }

        let notify = new Notify();
        notify.symbol      = 'BTC';
        notify.address     = address;
        notify.hash        = txid;
        notify.vout        = vout;
        notify.amount      = amount.toString(10);
        notify.post(server.notify);
        logger.warn('Transfer has been received, symbol: %s, address: %s, amount: %s, txid: %s, vout: %s',
            notify.symbol, notify.address, notify.amount, notify.hash, notify.vout);
        return true;
    }
}

module.exports = Poller;