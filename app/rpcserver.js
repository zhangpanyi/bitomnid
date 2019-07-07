
const rpc = require('node-json-rpc');
const logger = require('./common/logger');
const server = require('../config/server');

class RPCServer {
    constructor(client){
        this._server = new rpc.Server(server.accept);

        const sentoken = require('./handlers/sentoken');
        this._server.addMethod('extSendToken', function(req, callback) {
            sentoken(client, req, callback);
        });

        const newaddress = require('./handlers/newaddress');
        this._server.addMethod('extNewAddress', function(req, callback) {
            newaddress(client, req, callback);
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
