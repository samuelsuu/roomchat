const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

let users = [];

wss.on('connection', function connection(ws) {
    // Send chat history to new clients upon connection
    fs.readFile('chat.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading chat history:', err);
            return;
        }
        ws.send(JSON.stringify({ type: 'chatHistory', history: data }));
    });

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);
        if (data.type === 'join') {
            const isExistingUser = users.find(user => user === data.username);
            if (!isExistingUser) {
                users.push(data.username);
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Username already exists' }));
                return;
            }
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'users', users: users }));
                }
            });
        } else if (data.type === 'message') {
            fs.appendFile('chat.txt', `${data.sender}: ${data.text}\n`, (err) => {
                if (err) throw err;
                console.log('Message appended to chat.txt');
            });
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });
});

server.listen(8080, function() {
    console.log('Server listening on port 8080');
});
