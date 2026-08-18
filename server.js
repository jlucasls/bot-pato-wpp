const express = require("express");
const dotenv = require("dotenv");
const qrcode = require("qrcode");
const logger = require("./utils/logger.utils");
const messageRouter = require("./routes/messages.routes");
const botRouter = require("./routes/bot.routes");
const client = require("./whatsapp/client");

dotenv.config();
const app = express();
app.use(express.json());
let qrCodeString;

client.on("qr", (qr) => {
    logger.info("Gerando QR Code...");
    try {
        qrCodeString=qr;
        logger.success("QR Code gerado com sucesso.");
    } catch (err) {
        logger.error("Erro ao gerar QR Code.", err.message);
    }
});

client.initialize();

app.get('/', async (req, res) => {
    if (!qrCodeString) {
        return res.send(`
            <h1>QR Code ainda não disponível.</h1>
            <p>Aguarde o WhatsApp inicializar.</p>
        `);
    }
    const qrImage = await qrcode.toDataURL(qrCodeString);
    return res.send(`
        <div>
            <h1>Escaneie o QR Code:</h1>
            <img src="${qrImage}" />
        </div>
    `);
});
app.use('/messages', messageRouter);
app.use('/bot', botRouter);
app.listen(process.env.PORT, () => {
    logger.info(`Server running in http://localhost:${process.env.PORT}`);
});