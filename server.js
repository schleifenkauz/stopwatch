const express= require('express');
const http = require('http');
const os = require('os');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

let time = 0;
let timer = null;
let running = false;

app.use(express.static("public"));

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.push(ws);
    ws.send(running ? 'start' : 'stop');
});

app.post('/start', (req, res) => {
    if (!running) {
        running = true;
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('start');
            }
        });
        timer = setInterval(() => {
            time++;
            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(time.toString());
                }
            });
        }, 1000);
    }
    res.send('Starting stopwatch');
});

app.post('/stop', (req, res) => {
    running = false;
    clearInterval(timer);
    timer = null;
    time = 0;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send("stop");
        }
    });
    res.send('Stopping stopwatch');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const addresses = Object.values(os.networkInterfaces())
        .flatMap((networkInterfaces = []) => networkInterfaces)
        .filter(({ family, internal }) => !internal && (family === 'IPv4' || family === 4))
        .map(({ address }) => address);

    if (addresses.length === 0) {
        console.log('No local network IPv4 address found');
        return;
    }

    addresses.forEach((address) => {
        console.log(`Local network: http://${address}:${PORT}`);
    });
});