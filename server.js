const express = require("express");
const dotenv = require("dotenv");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const logger = require("./utils/logger.utils");
const { deleteFolder } = require("./utils/deleteFolder.utils");
const { MENSAGENS } = require("./routes/mensagens.routes");
const { getBemVindo } = require("./messages/bemVindo.messages");
const { getMenu } = require("./messages/menu.messages");
const { getPatoNews } = require("./messages/patoNews.messages");
const { getPatoTv } = require("./messages/patoTv.messages");
const { getSite } = require("./messages/site.messages");
const { getSair } = require("./messages/sair.messages");

dotenv.config();
const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
    }
});

// Inicialmente para teste e também para ativar a opção de desligar o
// BOT e reinicializar os serviços apenas para usuários permitidos.
const lidsPermitidos = ["123781729280243", "31160021344467", "182549078892659", "257676630044715"];
const usuariosAtivos = new Set();
let clientPronto = false;
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
    clientPronto = true;
    logger.success("WhatsApp conectado.");
});

client.on("disconnected", () => {
    clientPronto = false;
    logger.warn("WhatsApp desconectado.");
});

client.on("message", async (message) => {
    if(!clientPronto) return;
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
        // APENAS TEMPORARIAMENTE
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
            else if (msg === "sair") {
                resposta = getSair(user.id.user);
                usuariosAtivos.delete(user.number);
            }
            else {
                resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
            }
        }
        await message.reply(resposta, undefined, {
            mentions: [`${user.id.user}@c.us`]
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

app.post('/send-message', async (req, res) => {
    const {tel, message} = req.body;
    if(!tel || !message){
        return res.status(400).json({ error: 'Telefone e Mensagem são obrigatórios.' });
    }
    if(!clientPronto){
        logger.error("Client não foi inicializado.")
        return res.status(500).json({ error:"Client não foi inicializado." });
    }
    try{
        const numeroFormatado = tel.replace(/\D/g, '');
        const chatId = `${numeroFormatado}@c.us`;
        const detalhesNumero = await client.getNumberId(numeroFormatado);
        if(!detalhesNumero){
            return res.status(404).json({ error: 'Número não cadastrado no WhatsApp.' })
        }
        await client.sendMessage(detalhesNumero._serialized, message);
        return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
    }catch(err){
        logger.error('Erro ao enviar mensagem:', err.message);
        return res.status(500).json({ err: 'Falha interna ao enviar mensagem.' });
    }
});

app.post('/turn-bot-off', async (req, res) => {
    const { tel } = req.body;
    if(!tel){
        return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }
    if(!clientPronto){
        logger.error("Client não foi inicializado.")
        return res.status(500).json({ error:"Client não foi inicializado." });
    }
    try{
        const numeroFormatado = tel.replace(/\D/g, '');
        const chatId = `${numeroFormatado}@c.us`;
        const detalhesNumero = await client.getNumberId(numeroFormatado);
        if(!detalhesNumero){
            return res.status(404).json({ error: 'Número não cadastrado no WhatsApp.' });
        }
        return logger.info(detalhesNumero.user);
    }catch(err){
        logger.error('Erro ao desligar bot:', err.message);
        return res.status(500).json({ err: 'Erro ao desligar bot.' });
    };
});

app.listen(process.env.PORT, () => {
    logger.info("Server running in http://localhost:3000");
});
