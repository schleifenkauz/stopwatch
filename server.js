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
let metronome_running = false;
let metronome_bpm = 60;

app.use(express.static("public"));

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.push(ws);
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    ws.on('close', () => {
        clients = clients.filter((client) => client !== ws);
    });
    ws.send(running ? 'start' : 'stop');
    if (running) ws.send(time.toString());
    ws.send(metronome_running
        ? JSON.stringify({ msg: 'start-metronome', bpm: metronome_bpm })
        : 'stop-metronome');
});

const heartbeat = setInterval(() => {
    clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return;
        if (client.isAlive === false) {
            client.terminate();
            return;
        }
        client.isAlive = false;
        client.ping();
    });
}, 30000);

server.on('close', () => clearInterval(heartbeat));

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

const startMetronome = (req, res) => {
    const bpm = Number(req.query.bpm || 60);
    if (!Number.isInteger(bpm) || bpm < 1 || bpm > 300) {
        return res.status(400).send('BPM must be an integer between 1 and 300');
    }
    metronome_running = true;
    metronome_bpm = bpm;
    console.log('Starting metronome with BPM:', bpm);
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ msg: "start-metronome", bpm: bpm }));
        }
    });
    res.send('Starting metronome');
};

app.get('/start-metronome', startMetronome);
app.post('/start-metronome', startMetronome);

app.post('/stop-metronome', (req, res) => {
    metronome_running = false;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send("stop-metronome");
        }
    });
    res.send('Stopping metronome');
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