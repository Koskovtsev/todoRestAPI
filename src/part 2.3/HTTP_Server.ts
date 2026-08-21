import { createServer, IncomingMessage, ServerResponse, type Server } from 'node:http'; //

interface ApiResponse {
    status: string;
    message: string;
    timestamp: string;
    data?: any;
}
export function startServerHTTP(port = 3000, host = '127.0.0.1'): Promise<Server> {
    return new Promise((resolve, reject) => {
        const server = createServer((req: IncomingMessage, res: ServerResponse) => {
            const { method, url } = req;

            res.setHeader('Content-Type', 'application/json');

            if (method === 'GET' && url === '/api/health') {
                res.writeHead(200);
                const responseData: ApiResponse = {
                    status: 'success',
                    message: 'Server is healthy',
                    timestamp: new Date().toISOString()
                }
                return res.end(JSON.stringify(responseData));
            }

            if (method === 'POST' && url === '/api/data') {
                let body = '';

                req.on('data', (chunk) => {
                    body += chunk.toString();
                });

                req.on('end', () => {
                    try {
                        const parsedBody = body ? JSON.parse(body) : {};

                        res.writeHead(201);
                        const responseData: ApiResponse = {
                            status: 'success',
                            message: 'Data processed successfully',
                            timestamp: new Date().toISOString(),
                            data: parsedBody
                        };
                        res.end(JSON.stringify(responseData));
                    } catch (error) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON body' }));
                    }
                });
                return;
            }
            res.writeHead(404);
            res.end(JSON.stringify({ status: 'error', message: 'Route not found' }));
        });

        server.once('error', reject);

        server.listen(port, host, () => {
            console.log(`🚀 HTTP Server successfully running at ${host}:${port}`);
            resolve(server);
        });
    });
}