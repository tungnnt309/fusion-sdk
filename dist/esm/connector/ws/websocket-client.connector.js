import WebSocket from 'ws';
export class WebsocketClient {
    constructor(config) {
        this.url = config.url;
        this.authKey = config.authKey;
        const lazyInit = config.lazyInit || false;
        if (!lazyInit) {
            this.initialized = true;
            this.ws = new WebSocket(this.url, this.authKey
                ? {
                    headers: {
                        Authorization: `Bearer ${this.authKey}`
                    }
                }
                : undefined);
            return;
        }
        this.initialized = false;
    }
    init() {
        if (this.initialized) {
            throw new Error('WebSocket is already initialized');
        }
        this.initialized = true;
        this.ws = new WebSocket(this.url, this.authKey
            ? {
                headers: {
                    Authorization: `Bearer ${this.authKey}`
                }
            }
            : undefined);
    }
    on(event, cb) {
        this.checkInitialized();
        this.ws.on(event, cb);
    }
    off(event, cb) {
        this.checkInitialized();
        this.ws.off(event, cb);
    }
    onOpen(cb) {
        this.on('open', cb);
    }
    send(message) {
        this.checkInitialized();
        const serialized = JSON.stringify(message);
        this.ws.send(serialized);
    }
    onMessage(cb) {
        this.on('message', (data) => {
            const parsedData = JSON.parse(data);
            cb(parsedData);
        });
    }
    ping() {
        this.ws.ping();
    }
    onPong(cb) {
        this.on('pong', () => {
            cb();
        });
    }
    onClose(cb) {
        this.on('close', cb);
    }
    onError(cb) {
        this.on('error', cb);
    }
    close() {
        this.checkInitialized();
        this.ws.close();
    }
    checkInitialized() {
        if (!this.initialized) {
            throwInitError();
        }
    }
}
function throwInitError() {
    throw new Error('WebSocket is not initialized. Call init() first.');
}
//# sourceMappingURL=websocket-client.connector.js.map