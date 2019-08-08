const Client = require('omnilayer-core');

const server = require('./config/server');

const Poller = require('./app/poller');
const RPCServer = require('./app/rpcserver');

const logger = require('./app/common/logger');

try {
    const client = new Client(server.endpoint);

    const poller = new Poller(client);
    poller.startPolling();
    
    client.poller = poller;
    const rpcserver = new RPCServer(client);
    rpcserver.start();
} catch (error) {
    logger.fatal('Service terminated, reason: %s', error.message)
}