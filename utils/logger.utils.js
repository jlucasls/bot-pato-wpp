const fs = require('fs');
const path = require('path');

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    info: "\x1b[36m",
    success: "\x1b[32m",
    warn: "\x1b[33m",
    error: "\x1b[31m"
};

const logFilePath = path.join(__dirname, 'app.log');

function getTimestamp() {
    const now = new Date();
    return now.toLocaleString('pt-BR', { hour12: false });
}

function writeToFile(rawMessage) {
    const cleanMessage = rawMessage.replace(/\x1B\[\d+m/g, '');
    fs.appendFileSync(logFilePath, cleanMessage + '\n', 'utf8');
}

const logger = {
    info: (message, meta = '') => {
        const extra = meta ? ` | ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
        const line = `[${getTimestamp()}] ${colors.info}ℹ [INFO]${colors.reset} ${message}${extra}`;
        console.log(line);
        writeToFile(line);
    },

    success: (message, meta = '') => {
        const extra = meta ? ` | ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
        const line = `[${getTimestamp()}] ${colors.success}✔ [SUCCESS]${colors.reset} ${message}${extra}`;
        console.log(line);
        writeToFile(line);
    },

    warn: (message, meta = '') => {
        const extra = meta ? ` | ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
        const line = `[${getTimestamp()}] ${colors.warn}⚠ [WARN]${colors.reset} ${message}${extra}`;
        console.warn(line);
        writeToFile(line);
    },

    error: (message, error = '') => {
        const errDetails = error instanceof Error ? error.stack : (error ? JSON.stringify(error) : '');
        const line = `[${getTimestamp()}] ${colors.error}✖ [ERROR]${colors.reset} ${message} ${errDetails}`;
        console.error(line);
        writeToFile(line);
    }
};

module.exports = logger;