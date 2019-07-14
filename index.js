const Client = require('bitcoin-core');
const server = require('./config/server');
const RPCServer = require('./app/rpcserver');
const logger = require('./app/common/logger');

const utils = require('./app/handlers/utils/utils');

const collection = require('./app/handlers/collection');


async function aaaa(client) {
    let a = await client.omni_getInfo();
    console.info(a);
}

try {
    const client = new Client(server.endpoint);
    collection(client, 'muWgnXpEPGjVoENrn1WdwS8Gny2WLNpDB2', 0.005);
    const rpcserver = new RPCServer(client);
    rpcserver.start();
} catch (error) {
    logger.fatal('Service terminated, reason: %s', error.message)
}
