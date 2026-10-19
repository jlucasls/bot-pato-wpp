import express from "express";
import dotenv from "dotenv";
import logger from "../utils/logger.utils.js";
import { startBot, stopBot, logoutBot, restartBot, getBotStatus } from "../whatsapp/client.js";

dotenv.config();

const router = express.Router();
const ACTION_PASSWORD = process.env.ACTION_PASSWORD || "";

router.post('/start', async (req, res) => {
    try {
        await startBot();
        logger.info("Iniciar o WhatsApp...");
        return res.status(200).json({ message: "Iniciando o WhatsApp..." });
    } catch (err) {
        logger.error("Erro ao ligar bot:", err.message);
        return res.status(500).json({ error: "Erro ao ligar o bot." });
    }
});

router.post('/stop', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            logger.info("Foi detectada uma tentativa de desligamento do bot. Credencial não pode ser nula.");
            return res.status(200).json({ message: "Credencial inválida.", reset: true });
        }

        if (password !== ACTION_PASSWORD) {
            logger.info("Foi detectada uma tentativa de desligamento do bot. Credencial inválida");
            return res.status(200).json({ message: "Credencial inválida.", reset: true });
        }

        await stopBot();
        logger.success("Bot desligado com sucesso.");
        return res.status(200).json({ message: "Bot desligado com sucesso." });
    } catch (err) {
        logger.error("Erro ao desligar bot:", err.message);
        return res.status(500).json({ error: "Erro ao desligar o bot." });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            logger.info("Foi detectada uma tentativa de logout da sessão. Credencial não pode ser nula.");
            return res.status(200).json({ message: "Credencial inválida.", reset: true });
        }

        if (password !== ACTION_PASSWORD) {
            logger.info("Foi detectada uma tentativa de logout da sessão. Credencial inválida");
            return res.status(200).json({ message: "Credencial inválida.", reset: true });
        }

        await logoutBot();
        logger.success("Sessão deslogada com sucesso.");
        return res.status(200).json({ message: "Sessão deslogada com sucesso." });
    } catch (err) {
        logger.error("Erro ao deslogar bot:", err.message);
        return res.status(500).json({ error: "Erro ao deslogar o bot." });
    }
});

router.post('/restart', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            logger.info("Foi detectada uma tentativa de reinicialização do bot. Credencial não pode ser nula.");
            return res.status(200).json({ message: "Credencial inválida.", reset: true });
        }

        if (password !== ACTION_PASSWORD) {
            logger.info("Foi detectada uma tentativa de reinicialização do bot. Credencial inválida");
            return res.status(200).json({ message: "Credencial inválida.", reset: true });
        }

        logger.info("Reiniciando o bot...");
        await restartBot();
        logger.success("Bot reiniciado com sucesso.");
        return res.status(200).json({ message: "Bot reiniciado com sucesso." });
    } catch (err) {
        logger.error("Erro ao reiniciar bot:", err.message);
        return res.status(500).json({ error: "Erro ao reiniciar o bot." });
    }
});

router.get('/status', (req, res) => {
    const status = getBotStatus();
    return res.status(200).json(status);
});

export default router;