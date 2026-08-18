const express = require("express");
const dotenv = require("dotenv");
const qrcode = require("qrcode");
const { getBemVindo } = require("./messages/bemVindo.messages");
const { getMenu } = require("./messages/menu.messages");
const { getPatoNews } = require("./messages/patoNews.messages");
const { getPatoTv } = require("./messages/patoTv.messages");
const { getSite } = require("./messages/site.messages");
const { getSair } = require("./messages/sair.messages");
const { MENSAGENS } = require("./utils/messages.utils");
const { deleteFolder } = require("./utils/deleteFolder.utils");
const logger = require("./utils/logger.utils");
const messageRouter = require("./routes/messages.routes");
const botRouter = require("./routes/bot.routes");
const client = require("./whatsapp/client");
const { setClientPronto, isClientPronto } = require("./whatsapp/clientState");

dotenv.config();
const app = express();
app.use(express.json());

const lidsPermitidos = ["31160021344467", "182549078892659", "257676630044715"];
const usuariosAtivos = new Set();
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

client.on("ready", () => {
    setClientPronto(true);
    logger.success("WhatsApp conectado.");
});

client.on("disconnected", () => {
    setClientPronto(false);
    logger.warn("WhatsApp desconectado.");
});

client.on("message", async (message) => {
    if(!isClientPronto) return;
    try {
        if (message.fromMe) return;
        if (message.from.includes("@g.us")) return;
        if (message.from.includes("@newsletter")) return;
        let user;
        try {
            user = await message.getContact();
        } catch (err) {
            logger.error("Erro na resolução de JID do contato. ERROR: ", err.message);
            await message.reply("🦆 QUACK! Desculpa, estamos enfrentando turbulências em nossos serviços. Tente novamente mais tarde!");
            return;
        }
        if (!lidsPermitidos.includes(user.number)) {
            logger.info(`Mensagem bloqueada de: ${user.pushname} (${user.number})`);
            return;
        }
        const msg = message.body.toLowerCase().trim();
        let resposta;
        if (!usuariosAtivos.has(user.number)) {
            usuariosAtivos.add(user.number);
            resposta = getBemVindo(user.id.user);
        } else {
            if (msg in MENSAGENS) {
                resposta = MENSAGENS[msg];
                if(msg === "sair") usuariosAtivos.delete(user.number);
                if (typeof resposta === "function") {
                    resposta = resposta(user.id.user);
                }
            }
            else if (msg === "desligar") {
                if (lidsPermitidos.includes(user.number)) {
                    await message.reply("🛑 Encerrando Bot... 🛑");
                    logger.info("Iniciando desligamento manual...");
                    try {
                        await client.destroy();
                        logger.info("1. Navegador fechado com sucesso.");
                        deleteFolder("./.wwebjs_auth");
                        deleteFolder("./.wwebjs_cache");
                        logger.info("2. Cache e autenticação limpos!");
                    } catch (err) {
                        logger.error("Erro durante o processo de limpeza:", err.message);
                    }
                    logger.warn("Bot desligado com sucesso!");
                    process.exit();
                    return;
                }
                resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
            }
            else {
                resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
            }
        }
        await message.reply(resposta, undefined, {
            mentions: [`${user.id.user}@c.us`],
        });
    } catch (err) {
        logger.error("Erro interno no processamento/envio da mensagem. ERROR: " + err.message);
        try {
            await message.reply("🦆 QUACK! Desculpa, estamos enfrentando turbulências em nossos serviços. Tente novamente mais tarde!");
        } catch (replyErr) {
            logger.error("Falha crítica ao enviar mensagem de erro de fallback: " + replyErr.message);
        }
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

