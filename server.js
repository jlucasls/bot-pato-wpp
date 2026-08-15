const express = require("express");
const dotenv = require("dotenv");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
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

const lidsPermitidos = ["31160021344467", "182549078892659", "257676630044715"];

const usuariosAtivos = new Set();

client.on("qr", (qr) => {
    logger.info("Escaneie o QR Code: ");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    logger.success("WhatsApp conectado!");
});

client.on("message", async (message) => {
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
                    logger.success("Bot desligado com sucesso!");
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

// Iniciando ROTA para utilização do WebHook de integração com o N8N
app.post('/send-message', async (req, res) => {
    const {tel, message} = req.body;
    if(!tel || !message){
        return res.status(400).json({ error: 'Telefone e Mensagem são obrigatórios.' });
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

app.listen(process.env.PORT, () => {
    logger.info("Server running in http://localhost:3000");
});
