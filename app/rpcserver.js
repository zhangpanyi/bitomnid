
const rpc = require('node-json-rpc');
const logger = require('./common/logger');
const server = require('../config/server');

class RPCServer {
    constructor(client){
        this._server = new rpc.Server(server.accept);

        // 资金归集
        const collect = require('./handlers/collect');
        this._server.addMethod('extCollect', function(req, callback) {
            collect(client, req, callback);
        });

        // 创建地址
        const newaddr = require('./handlers/newaddr');
        this._server.addMethod('extNewAddr', function(req, callback) {
            newaddr(client, req, callback);
        });

        // 发送手续费
        const sendfee = require('./handlers/sendfee');
        this._server.addMethod('extSendFee', function(req, callback) {
            sendfee(client, req, callback);
        });

        // 发送BTC/USDT
        const sendtoken = require('./handlers/sendtoken');
        this._server.addMethod('extSendToken', function(req, callback) {
            sendtoken(client, req, callback);
        });

        // 获取钱包余额
        const walletbalance = require('./handlers/walletbalance');
        this._server.addMethod('extWalletBalance', function(req, callback) {
            walletbalance(client, req, callback);
        });
    }

    start() {
        this._server.start(function (error) {
            if (error) {
                throw error;
            } else {
                logger.info('JSON RPC server running ...');
            }
        });
    }
}

module.exports = RPCServer;
