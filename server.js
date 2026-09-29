const express = require("express");
const dotenv = require("dotenv");
const qrcode = require("qrcode");
const logger = require("./utils/logger.utils");
const messageRouter = require("./routes/messages.routes");
const botRouter = require("./routes/bot.routes");
const client = require("./whatsapp/client");
const { startBot, getBotStatus } = require("./whatsapp/client");

dotenv.config();
const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
    const { isPronto, qrCode } = getBotStatus();

    res.send( `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="shortcut icon" href="./public/images/logo-256.png" type="image/x-icon">
            <title>Bot | ${!isPronto ? "Entrar" : "Conectado"}</title>
        </head>
        <body>
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <h1>${!qrCode && !isPronto ? "WhatsApp conectado com sucesso!" : !qrCode ? "QR Code ainda não disponível." : "Escaneie o QR Code:" }</h1>
                ${!qrCode ? "<p>Se o bot estiver desligado, faça um POST para /bot/start para inicializar.</p>" : `<img src="${qrCode}" alt='QR Code WhatsApp' />` } 
            </div>
            
            <script>
                // Seleciona os elementos do HTML
                const botao = document.getElementById('meuBotao');
                const resultado = document.getElementById('resultado');

                // Adiciona o evento de clique ao botão
                botao.addEventListener('click', async () => {
                    resultado.textContent = 'Carregando...';
                    
                    try {
                        // Faz a requisição para a rota do próprio servidor
                        const resposta = await fetch('/api/dados');
                        const dados = await respuesta.json();
                        
                        // Atualiza o HTML com a resposta do servidor
                        resultado.textContent = dados.mensagem;
                    } catch (erro) {
                        resultado.textContent = 'Erro ao consultar o servidor.';
                        console.error(erro);
                    }
                });
            </script>
        </body>
        </html>
    `);
});

app.use('/messages', messageRouter);
app.use('/bot', botRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    logger.info(`Server running in http://localhost:${process.env.PORT}`);
    await startBot();
});