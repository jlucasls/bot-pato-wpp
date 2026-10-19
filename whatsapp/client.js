import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import dotenv from 'dotenv';
import { getBemVindo } from '../messages/bemVindo.messages.js';
import { MENSAGENS } from '../utils/messages.utils.js';
import logger from '../utils/logger.utils.js';
import { setClientPronto, isClientPronto } from './clientState.js';
import { deleteFolder } from '../utils/deleteFolder.utils.js';

dotenv.config();

let client = null;
let currentQrCode = null;
const usuariosAtivos = new Set();

const lidsPermitidos = process.env.LIDS_PERMITIDOS ? process.env.LIDS_PERMITIDOS.split(";") : [];
const blockMessages = process.env.BLOCK_MESSAGES || 'true';

async function startBot() {
    if (client) {
        logger.warn("Instância do WhatsApp já está rodando ou inicializando.");
        return;
    }

    logger.info("Iniciando cliente do WhatsApp...");

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    client = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
                currentQrCode = await qrcode.toDataURL(qr);
                setClientPronto(false);
                logger.success("QR Code gerado com sucesso.");
            } catch (err) {
                logger.error("Erro ao gerar QR Code.", err.message);
            }
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode || lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            logger.warn(`WhatsApp desconectado. Motivo: ${lastDisconnect?.error?.message || 'Desconhecido'}`);
            
            await stopBot();

            if (shouldReconnect) {
                logger.info("Tentando reconectar...");
                await startBot();
            }
        } else if (connection === 'open') {
            setClientPronto(true);
            currentQrCode = null;
            logger.success("WhatsApp conectado.");
        }
    });

    client.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        if (!isClientPronto()) return;

        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const remoteJid = m.key.remoteJid;

        if (remoteJid.endsWith('@g.us') || remoteJid.includes('@newsletter')) return;

        const number = remoteJid.replace('@s.whatsapp.net', '');
        const pushname = m.pushName || 'Usuário';

        const metionNumber = number.replace('@lid', '');

        try {
            if (blockMessages === 'true') {
                if (!lidsPermitidos.includes(number)) {
                    logger.info(`Mensagem bloqueada de: ${pushname} (${number})`);
                    return;
                }
            }

            const messageBody = m.message.conversation || 
                                m.message.extendedTextMessage?.text || '';
            const msg = messageBody.toLowerCase().trim();
            
            let resposta;

            if (!usuariosAtivos.has(number)) {
                usuariosAtivos.add(number);
                resposta = getBemVindo(number);
            } else {
                if (msg in MENSAGENS) {
                    resposta = MENSAGENS[msg];
                    if (msg === "sair") usuariosAtivos.delete(number);
                    if (typeof resposta === "function") {
                        resposta = resposta(number);
                    }
                } else {
                    resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
                }
            }

            await client.sendMessage(remoteJid, {
                text: resposta,
                mentions: [remoteJid],
            }, { quoted: m });

        } catch (err) {
            logger.error("Erro interno no processamento/envio da mensagem. ERROR: ", err.message);
            try {
                await client.sendMessage(metionNumber, {
                    text: "🦆 QUACK! Desculpa, estamos enfrentando turbulências em nossos serviços. Tente novamente mais tarde!"
                }, { quoted: m });
            } catch (replyErr) {
                logger.error("Falha crítica ao enviar mensagem de erro de fallback: ", replyErr.message);
            }
        }
    });
}

async function stopBot() {
    if (client) {
        try {
            logger.warn("Iniciando desligamento do Bot...");
            client.end(undefined);
            logger.info("Conexão encerrada com sucesso.");
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
    try {
        logger.info("Deslogando do WhatsApp e limpando sessão...");
        await stopBot();
        deleteFolder("./auth_info_baileys");
        logger.info("Sessão deslogada com sucesso.");
    } catch (err) {
        logger.error("Erro ao fazer logout no WhatsApp: ", err.message);
    } finally {
        setClientPronto(false);
        currentQrCode = null;
        await restartBot();
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

export { startBot, stopBot, logoutBot, restartBot, getBotStatus, getClient };