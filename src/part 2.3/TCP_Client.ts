import net from 'net';

export function runClientTCP(message: string, port = 3000, host = '127.0.0.1'): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = new net.Socket();

    client.connect(port, host, () => {
      console.log('[Client] Connected to server');
      client.write(message);
      console.log(`[Client] message"${message}" sended to the server`);
    });

    client.on('data', (data: Buffer) => {
      const response = data.toString().trim();
      const duration = Date.now() - startTime;

      console.log(`[Client] Received back: ${response}`);
      console.log(`[Client] Round-trip time: ${duration}ms`);
      console.log(`[Client] Match: ${response === message}`);

      client.end();
    });

    client.on('close', () => {
      console.log('[Client] Connection closed');
      resolve();
    });

    client.on('error', reject);
  });
}