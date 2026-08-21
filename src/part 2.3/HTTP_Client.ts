import { request, type RequestOptions } from 'node:http';

function makeRequest(options: RequestOptions, postData?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (postData) {
            req.write(postData);
        }

        req.end();
    });
}

export async function runClientHTTP(message: string, port = 3000, host = '127.0.0.1'): Promise<void> {
    console.log('--- Initiating HTTP Client ---');
    const startTime = Date.now(); 

    const payload = JSON.stringify(message);
    const postOptions: RequestOptions = {
        hostname: host,
        port: port,
        path: '/api/data',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    try {
        console.log('\nSending POST request to /api/data...');
        const response = await makeRequest(postOptions, payload);
        console.log(`[Client] Received back: ${response}`);
        const duration = Date.now() - startTime;
        console.log(`[Client] Round-trip time: ${duration}ms`);
        const responsedMessage = JSON.parse(response).data;
        console.log(`[Client] Match: ${responsedMessage === message}`);
        console.log('Server Response:', JSON.parse(response));
    } catch (error) {
        console.error('POST Request Error:', error);
    }
}
