const express = require("express");
const router = express.Router();
const logger = require("../utils/logger.utils");
const { startBot, stopBot, logoutBot, restartBot, getBotStatus } = require("../whatsapp/client");

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
        await restartBot();
        logger.success("Bot reiniciado com sucesso.");
        return res.status(200).json({ message: "Reiniciando o bot..." });
    } catch (err) {
        logger.error("Erro ao reiniciar bot:", err.message);
        return res.status(500).json({ error: "Erro ao reiniciar o bot." });
    }
});

router.get('/status', (req, res) => {
    const status = getBotStatus();
    return res.status(200).json(status);
});

module.exports = router;