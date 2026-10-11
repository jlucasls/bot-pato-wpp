const express = require("express");
const dotenv = require("dotenv");
const logger = require("./utils/logger.utils");
const messageRouter = require("./routes/messages.routes");
const botRouter = require("./routes/bot.routes");
const { startBot, getBotStatus } = require("./whatsapp/client");
const { verifyNewVideos } = require("./jobs/youtube.job");

dotenv.config();
const app = express();
app.use(express.json());
const INTERVAL = 60 * 60 * 1000; // Consulta a cada 1 hora

app.get('/', async (req, res) => {
    const { isPronto, qrCode } = getBotStatus();

    if (isPronto) {
        return res.send(`<h1>WhatsApp já está conectado!</h1>`);
    }

    if (!qrCode) {
        return res.send(`
            <h1>QR Code ainda não disponível.</h1>
            <p>Se o bot estiver desligado, faça um POST para /bot/start para inicializar.</p>
        `);
    }

    return res.send(`
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; margin-top:50px;">
            <h1>Escaneie o QR Code:</h1>
            <img src="${qrCode}" alt="QR Code WhatsApp" />
        </div>
    `);
});

app.use('/messages', messageRouter);
app.use('/bot', botRouter);

setInterval(verifyNewVideos, INTERVAL);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    logger.info(`Server running in http://localhost:${process.env.PORT}`);
    await startBot();
});