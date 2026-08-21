import { startServerTCP } from './TCP_Server.js';
import { runClientTCP } from './TCP_Client.js';

import { startServerUDP } from './UDP_server.js';
import { runClientUDP } from './UDP_Client.js';

import { startServerHTTP } from './HTTP_Server.js';
import { runClientHTTP } from './HTTP_Client.js';


async function TCP() {
    console.log('2.3 started');

    const server = await startServerTCP(3000, '127.0.0.1');

    await runClientTCP('some text', 3000, '127.0.0.1');

    server.close(() => {
        console.log('[Server] Stopped.');
    });
}
// TCP server/client
TCP().catch(console.error);

async function UDP() {
    const UDP_server = await startServerUDP(3000, '127.0.0.1');

    await runClientUDP('some text', 3000, '127.0.0.1');

    UDP_server.close(() => {
        console.log('[Server] Stopped.');
    });
}
// UDP server/client
UDP().catch(console.error);

async function HTTP() {
    const HTTP_server = await startServerHTTP(3000);

    await runClientHTTP('some text', 3000, '127.0.0.1');

    HTTP_server.close(() => {
        console.log('[Server] Stopped.');
    });
}
// HTTP server/client
HTTP().catch(console.error);