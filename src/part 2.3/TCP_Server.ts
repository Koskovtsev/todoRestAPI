import net from 'net';

export function startServerTCP(port = 3000, host = '127.0.0.1'): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      console.log(`[Server] Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

      socket.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        console.log(`[Server] Received: ${message}`);
        socket.write(`${message}\n`);
        console.log(`[Server] Resended back: ${message}`);
      });

      socket.on('end', () => console.log('[Server] Client disconnected.'));
      socket.on('error', (err: Error) => console.error(`[Server] Socket error: ${err.message}`));
    });

    server.listen(port, host, () => {
      console.log(`[Server] Running on ${host}:${port}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}