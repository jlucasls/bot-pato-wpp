const express = require("express");
const router = express.Router();
const logger = require("../utils/logger.utils");
const client = require(".././whatsapp/client");
const { isClientPronto } = require(".././whatsapp/clientState");

router.post('/turn-bot-off', async (req, res) => {
    const { telefone } = req.body;
    if(!telefone){
        return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }
    if(!isClientPronto){
        logger.error("Client não foi inicializado.")
        return res.status(500).json({ error:"Client não foi inicializado." });
    }
    try{
        const numeroFormatado = telefone.replace(/\D/g, '');
        const chatId = `${numeroFormatado}@c.us`;
        const detalhesNumero = await client.getNumberId(numeroFormatado);
        if(!detalhesNumero){
            return res.status(404).json({ error: 'Número não cadastrado no WhatsApp.' });
        }
        logger.info(detalhesNumero.user);
        return res.status(200).json({ success: "Bot desligado com sucesso." });
    }catch(err){
        logger.error('Erro ao desligar bot:', err.message);
        return res.status(500).json({ err: 'Erro ao desligar bot.' });
    };
});

module.exports = router;