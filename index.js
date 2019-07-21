const Client = require('bitcoin-core');

const server = require('./config/server');

const RPCServer = require('./app/rpcserver');
const logger = require('./app/common/logger');

try {
    const client = new Client(server.endpoint);
    const rpcserver = new RPCServer(client);
    rpcserver.start();
} catch (error) {
    logger.fatal('Service terminated, reason: %s', error.message)
}
