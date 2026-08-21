import dgram from 'node:dgram';


export function startServerUDP(port = 41234, host = '127.0.0.1'): Promise<dgram.Socket> {
  return new Promise((resolve, reject) => {
    const server = dgram.createSocket('udp4');

    server.on('error', (err) => {
      console.error('[Server] Socket error:', err.message);
    });

    server.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
      const messageText = data.toString();
      console.log(`[Server] Received: "${messageText}" from ${rinfo.address}:${rinfo.port}`);

      const response = Buffer.from(`${messageText}`);
      server.send(response, rinfo.port, rinfo.address, (error) => {
        if (error) {
          console.error('[Server] Failed to send response:', error);
        } else {
          console.log(`[Server] Replied to ${rinfo.address}:${rinfo.port} a text: ${messageText}`);
        }
      });
    });

    server.on('listening', () => {
      const address = server.address();
      console.log(`[Server] Listening on ${address.address}:${address.port}`);
    });
  
    const onStartupError = (err: Error) => {
      reject(err);
    };
    server.once('error', onStartupError);

    server.bind(port, host, () => {
      server.removeListener('error', onStartupError);
      console.log(`[Server] Running on ${host}:${port}`);
      resolve(server);
    });
  });
}
