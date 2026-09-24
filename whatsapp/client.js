const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const { getBemVindo } = require("../messages/bemVindo.messages");
const { MENSAGENS } = require("../utils/messages.utils");
const logger = require("../utils/logger.utils");
const { setClientPronto, isClientPronto } = require("./clientState");
const dotenv = require("dotenv");
const { deleteFolder } = require("../utils/deleteFolder.utils");
dotenv.config();

let client = null;
let currentQrCode = null;
const usuariosAtivos = new Set();
// CONSTANTE ABAIXO É APENAS EM AMBIENTE DE TESTE!!!
const lidsPermitidos = process.env.LIDS_PERMITIDOS ? process.env.LIDS_PERMITIDOS.split(";") : [];

async function startBot() {
    if (client) {
        logger.warn("Instância do WhatsApp já está rodando ou inicializando.");
        return;
    }

    logger.info("Iniciando cliente do WhatsApp...");

    client = new Client({
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
    client.on("qr", async (qr) => {
        try {
            currentQrCode = await qrcode.toDataURL(qr);
            setClientPronto(false);
            logger.success("QR Code gerado com sucesso.");
        } catch (err) {
            logger.error("Erro ao gerar QR Code.", err.message);
        }
    });

    client.on("ready", () => {
        setClientPronto(true);
        currentQrCode = null;
        logger.success("WhatsApp conectado.");
    });

    client.on("disconnected", async (reason) => {
        logger.warn(`WhatsApp desconectado. Motivo: ${reason}`);
        await stopBot();
    });

    client.on("message", async (message) => {
        if (!isClientPronto()) return;

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

            const msg = message.body.toLowerCase().trim();
            let resposta;

            if (!usuariosAtivos.has(user.number)) {
                usuariosAtivos.add(user.number);
                resposta = getBemVindo(user.id.user);
            } else {
                if (msg in MENSAGENS) {
                    resposta = MENSAGENS[msg];
                    if (msg === "sair") usuariosAtivos.delete(user.number);
                    if (typeof resposta === "function") {
                        resposta = resposta(user.id.user);
                    }
                } else if (msg === "desligar") {
                    if (lidsPermitidos.includes(user.number)) {
                        await message.reply("🛑 Encerrando Bot via comando... 🛑");
                        logger.info("Iniciando desligamento manual por mensagem...");
                        await stopBot();
                        return;
                    }
                    resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
                } else {
                    resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
                }
            }

            await message.reply(resposta, undefined, {
                mentions: [`${user.id.user}@c.us`],
            });
        } catch (err) {
            logger.error("Erro interno no processamento/envio da mensagem. ERROR: ", err.message);
            try {
                await message.reply("🦆 QUACK! Desculpa, estamos enfrentando turbulências em nossos serviços. Tente novamente mais tarde!");
            } catch (replyErr) {
                logger.error("Falha crítica ao enviar mensagem de erro de fallback: ", replyErr.message);
            }
        }
    });

    try {
        await client.initialize();
    } catch (err) {
        logger.error("Erro na inicialização do Puppeteer: ", err.message);
        await stopBot();
    }
}

async function stopBot() {
    if (client) {
        try {
            logger.warn("Iniciando desligamento do Bot...");
            logger.info("Encerrando navegador Puppeteer...");
            await client.destroy();
            logger.info("Navegador fechado com sucesso.");
        } catch (err) {
            logger.error("Erro ao encerrar a instância do cliente: ", err.message);
        } finally {
            client = null;
            currentQrCode = null;
            setClientPronto(false);
            logger.warn("Bot totalmente desligado.");
        }
    }
}

async function logoutBot() {
    if (client) {
        try {
            logger.info("Deslogando do WhatsApp Web...");
            await client.logout();
            deleteFolder("../.wwebjs_auth");
            deleteFolder("../.wwebjs_cache");
            logger.info("Sessão deslogada com sucesso.");
        } catch (err) {
            logger.error("Erro ao fazer logout no WhatsApp: ", err.message);
        } finally {
            await restartBot();
        }
    } else {
        setClientPronto(false);
        currentQrCode = null;
    }
}

async function restartBot() {
    logger.info("Reiniciando Bot...");
    await stopBot();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await startBot();
}

function getBotStatus() {
    return {
        isPronto: isClientPronto(),
        isRodando: !!client,
        qrCode: currentQrCode
    };
}

function getClient() {
    return client;
}

module.exports = {
    startBot,
    stopBot,
    logoutBot,
    restartBot,
    getBotStatus,
    getClient
};