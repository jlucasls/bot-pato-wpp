const express = require("express");
const router = express.Router();
const logger = require("../utils/logger.utils");
const client = require(".././whatsapp/client");
const { isClientPronto } = require(".././whatsapp/clientState");

router.post('/send-message', async (req, res) => {
    const { telefone, nome } = req.body;
    if(!telefone){
        return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }
    if(!isClientPronto){
        logger.error("Client não foi inicializado.")
        return res.status(500).json({ error:"Client não foi inicializado." });
    }
    try{
        const telefoneFormatado = telefone.replace(/\D/g, '');

        const detalhesNumero = await client.getNumberId(`${telefoneFormatado}@c.us`);

        if(!detalhesNumero){
            return res.status(404).json({ 
                error: 'Número não cadastrado no WhatsApp.' 
            });
        }

        const user = await client.getContactById(detalhesNumero._serialized);

        const message = `Olá @${user.id.user}! Teste funcionando com sucesso.`;

        await client.sendMessage(user.id._serialized, message, { 
            mentions: [`${user.id.user}@c.us`],
        });

        logger.success('Mensagem enviada com sucesso!');
        return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
    }catch(err){
        logger.error('Erro ao enviar mensagem:', err);
        return res.status(500).json({ err: 'Falha interna ao enviar mensagem.' });
    }
});

module.exports = router;