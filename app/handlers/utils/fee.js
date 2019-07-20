const BigNumber = require('bignumber.js');

module.exports = {
    // 获取当前千字费率
    asyncGetFeeRate: async function(client) {
        const result = await client.estimateSmartFee(6);
        return result.feerate.toString(10);
    },

    // 计算交易手续费
    calculateFee: async function(bytes, feeRate) {
        bytes = new BigNumber(bytes);
        feeRate = new BigNumber(feeRate);
        return bytes.dividedBy(1000).multipliedBy(feeRate).toString(10);
    }
};
