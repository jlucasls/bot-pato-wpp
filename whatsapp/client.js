const { Client, LocalAuth } = require("whatsapp-web.js");
const { getBemVindo } = require("../messages/bemVindo.messages");
const { MENSAGENS } = require("../utils/messages.utils");
const logger = require("../utils/logger.utils");
const { deleteFolder } = require("../utils/deleteFolder.utils");
const { isClientPronto } = require("./clientState");
const dotenv = require("dotenv");
dotenv.config();

const usuariosAtivos = new Set();
const lidsPermitidos = process.env.LIDS_PERMITIDOS.split(";");

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

module.exports = client;