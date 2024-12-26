const app = require('./app');
const http = require('http');
const { startWebSocketServer } = require('./websocket/websocketManager');
const PORT = process.env.PORT || 3000;  

const server = http.createServer(app);
startWebSocketServer(server);

// start server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
