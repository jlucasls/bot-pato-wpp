import express from "express";
import dotenv from "dotenv";
import logger from "../utils/logger.utils.js";
import { getClient } from "../whatsapp/client.js";
import { isClientPronto } from "../whatsapp/clientState.js";
import { getFormsMessage } from "../messages/formsMessage.message.js";
import { getVideoMessage } from "../messages/videoMessage.messages.js";

dotenv.config();

const router = express.Router();
const LID_GROUP = process.env.LID_GROUP || "";

router.post('/send-message', async (req, res) => {
    const { telefone, nome } = req.body;

    if (!telefone) {
        return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }

    const client = getClient();
    const pronto = typeof isClientPronto === 'function' ? isClientPronto() : isClientPronto;

    if (!client || !pronto) {
        logger.error("Client não foi inicializado ou não está pronto.");
        return res.status(500).json({ error: "Client não foi inicializado." });
    }

    try {
        const telefoneFormatado = telefone.replace(/\D/g, '');
        const remoteJid = `${telefoneFormatado}@s.whatsapp.net`;

        const [result] = await client.onWhatsApp(remoteJid);

        if (!result || !result.exists) {
            return res.status(404).json({ 
                error: 'Número não cadastrado no WhatsApp.' 
            });
        }

        const message = getFormsMessage(telefoneFormatado);

        await client.sendMessage(remoteJid, { 
            text: message,
            mentions: [remoteJid]
        });

        logger.success('Mensagem enviada com sucesso!');
        return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
    } catch (err) {
        logger.error('Erro ao enviar mensagem: ' + err.message);
        return res.status(500).json({ error: 'Falha interna ao enviar mensagem.' });
    }
});

router.post('/jobs/send-video-message', async (req, res) => {
    try {
        const { id, title, url, publishedAt } = req.body;

        if (!id) {
            logger.error("Falha ao obter Id. Verifique as saídas.");
            return res.status(400).json({ error: 'Id é obrigatório.' });
        }
        if (!title) {
            logger.error("Falha ao obter Título. Verifique as saídas.");
            return res.status(400).json({ error: 'Título é obrigatório.' });
        }
        if (!url) {
            logger.error("Falha ao obter URL. Verifique as saídas.");
            return res.status(400).json({ error: 'URL é obrigatório.' });
        }
        if (!publishedAt) {
            logger.error("Falha ao obter data de publicação. Verifique as saídas.");
            return res.status(400).json({ error: 'Data de publicação é obrigatória.' });
        }

        const client = getClient();
        const pronto = typeof isClientPronto === 'function' ? isClientPronto() : isClientPronto;

        if (!client || !pronto) {
            logger.error("Client não foi inicializado ou não está pronto.");
            return res.status(500).json({ error: "Client não foi inicializado." });
        }

        if (!LID_GROUP) {
            logger.error("ID do grupo não pode ser nulo.");
            return res.status(400).json({ error: 'ID do grupo não configurado no .env.' });
        }

        const message = getVideoMessage(title, url);

        await client.sendMessage(LID_GROUP, { text: message });

        logger.success('Notificação de novo vídeo enviada com sucesso!');
        return res.status(200).json({ success: true, message: 'Notificação de novo vídeo enviada com sucesso!' });

    } catch (err) {
        logger.error("Falha ao enviar mensagem de novo vídeo: ", err.message);
        return res.status(500).json({ error: `Erro ao tentar enviar mensagem para o grupo: ${err.message}` });
    }
});

export default router;