import dgram from 'node:dgram';

export function runClientUDP(message: string, port = 41234, host = '127.0.0.1'): Promise<void> {
  return new Promise((resolve, reject) => {

    const startTime = Date.now();
    const client = dgram.createSocket('udp4');

    client.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
      const response = data.toString().trim();
      const duration = Date.now() - startTime;

      console.log(`[Client] Received reply: "${response}" from ${rinfo.address}:${rinfo.port}`);
      console.log(`[Client] Round-trip time: ${duration}ms`);
      console.log(`[Client] Match: ${response === message}`);

      client.close();
    });

    client.on('close', () => {
      console.log('[Client] Socket closed');
      resolve();
    });

    client.on('error', reject);

    client.send(message, port, host, (err) => {
      if (err) {
        console.error('[Client] Send error:', err);
        client.close();
        reject(err);
      } else {
        console.log(`[Client] Message "${message}" sent to ${host}:${port}`);
      }
    });
  });
}
