const express = require("express");
const dotenv = require("dotenv");
const logger = require("./utils/logger.utils");
const messageRouter = require("./routes/messages.routes");
const qrcode = require("qrcode");
const botRouter = require("./routes/bot.routes");
const path = require('path');
const { startBot, getBotStatus } = require("./whatsapp/client");
const { verifyNewVideos } = require("./jobs/youtube.job");

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const INTERVAL = 60 * 60 * 1000;
const ENDPOINT = process.env.ENDPOINT || "https://localhost:3000/";

app.get('/', async (req, res) => {
    const { isPronto, isRodando, qrCode } = getBotStatus();

    const estado = qrCode
        ? "qr"
        : isPronto
            ? "pronto"
            : isRodando
                ? "iniciando"
                : "desligado";
    
    const titulos = {
        qr: "Escaneie o QR Code:",
        pronto: "WhatsApp conectado com sucesso!",
        iniciando: "Aguarde alguns instantes.",
        desligado: "Bot desligado.",
    };

    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="theme-color" content="#08080b">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
                <title>Bot | ${estado === "desligado" ? "Desligado" : !isPronto ? "Entrar" : "Conectado"}</title>
                <style>
                    :root {
                        --bg: #08080b;
                        --card: #111116;
                        --borda: #24242d;
                        --texto: #f2f2f5;
                        --suave: #b4b4c0;
                        --laranja: #f58a1f;
                        --laranja-forte: #ff5a0a;
                        --verde: #44a41b;
                        --perigo: #f87171;

                        --fonte-titulo: "Gaegu", "Comic Sans MS", cursive;
                        --fonte-corpo: "Inter", system-ui, sans-serif;
                        --fonte-mono: "JetBrains Mono", ui-monospace, monospace;
                    }

                    *, *::before, *::after{
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        background:
                            radial-gradient(600px circle at 50% 35%, rgba(245, 138, 31, 0.10), transparent 70%),
                            var(--bg);
                        color: var(--texto);
                        -webkit-font-smoothing: antialiased;
                        font-family: var(--fonte-corpo);
                    }

                    .hero-section{
                        width: 100%;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 4rem;
                        padding: 2rem 1rem;
                        text-align: center;
                    }

                    h1 {
                        font-family: var(--fonte-titulo);
                        font-size: clamp(2rem, 6vw, 3.2rem);
                        font-weight: 700;
                        line-height: 1.1;
                        max-width: 18ch;
                        margin: 0 auto;
                    }

                    .hero-section img {
                        width: min(280px, 80vw);
                        height: auto;
                        background: #fff;
                        padding: 14px;
                        border-radius: 20px;
                        box-shadow: 0 0 60px rgba(245, 138, 31, 0.25);
                    }

                    .buttons-section{
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: center;
                        gap: 0.75rem;
                    }

                    .btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.9375rem;
                        font-weight: 600;
                        letter-spacing: -0.005em;
                        gap: 9px;
                        padding: 14px 26px;
                        border-width: 1px;
                        border-style: solid;
                        border-color: transparent;
                        border-image: none;
                        border-radius: 999px;
                        white-space: nowrap;
                        background-color: var(--laranja);
                        font-family: var(--fonte-corpo);
                        cursor: pointer;
                        transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
                    }

                    .btn i {
                        font-size: 0.9rem;
                        color: var(--card);
                        transition: color 0.15s ease;
                    }

                    .btn:hover {
                        border-color: var(--laranja);
                        transform: translateY(-1px);
                    }

                    .btn:active {
                        transform: translateY(0);
                    }

                    .btn:focus-visible {
                        outline: 2px solid var(--laranja);
                        outline-offset: 3px;
                    }

                    .btn[hidden] {
                        display: none;
                    }

                    
                    .btn:disabled {
                        background: var(--card) !important;
                        border-color: var(--borda) !important;
                        color: var(--suave) !important;
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none !important;
                    }
                    
                    .btn:disabled i {
                        color: var(--suave) !important;
                    }

                    #startBtn {
                        background: var(--laranja);
                        border-color: var(--laranja);
                        color: #1a0f02;
                    }
                    #startBtn i { color: #1a0f02; }
                    #startBtn:hover { background: var(--verde); border-color: var(--verde); color: var(--texto) }
                    #startBtn:hover i { color: var(--texto) }

                    #stopBtn:hover,
                    #logoutBtn:hover {
                        background-color: var(--perigo);
                        border-color: var(--perigo);
                        color: var(--texto);
                    }
                    #stopBtn:hover i,
                    #logoutBtn:hover i {
                        color: var(--texto);
                    }

                    .display-section{
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 1rem;
                        min-height: 3.5rem;
                    }

                    #display {
                        font-family: var(--fonte-mono);
                        font-size: 0.9rem;
                        color: var(--suave);
                    }

                    #display:not(:empty)::before {
                        content: "> ";
                        color: var(--laranja);
                    }

                    .loader {
                        border-radius: 50%;
                        border: 4px solid rgba(245, 138, 31, 0.15);
                        border-top-color: var(--laranja);
                        border-right-color: var(--laranja-forte);
                        filter: drop-shadow(0 0 8px rgba(255, 90, 10, 0.55));
                        animation: spin 0.9s linear infinite;
                    }

                    .large {
                        width: 80px;
                        height: 80px;
                    }

                    .mini {
                        display: none;
                        width: 24px;
                        height: 24px;
                        border-width: 3px;
                    }

                    @keyframes spin {
                        0% {
                            transform: rotate(0deg);
                        }
                        100% {
                            transform: rotate(360deg);
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .loader { animation-duration: 2.5s; }
                        .btn { transition: none; }
                    }
                </style>
            </head>
            <body>
                <div class="hero-section">
                    <div>
                        <h1>
                            ${titulos[estado]}
                        </h1>
                    </div>                
                        ${estado === "qr"
                            ? `<img src="${qrCode}" alt='QR Code WhatsApp' />`
                            : ""
                        }
                        ${estado === "iniciando"
                            ? "<div class='loader large' role='status' aria-label='Loading'></div>"
                            : ""
                        }

                        ${
                            estado === "qr" && estado != "pronto"
                                ? `<div id="buttons-section" class="buttons-section">
                                        <button id="restartBtn" class="btn"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i><span>Reiniciar</span></button>
                                    </div>`
                                : ""
                        }

                        ${estado === "pronto" || estado === "desligado"
                            ? `<div id="buttons-section" class="buttons-section">
                                    <button id="startBtn" class="btn" ${estado === "pronto" ? "hidden" : ""}><i class="fa-solid fa-play" aria-hidden="true"></i><span>Iniciar</span></button>
                                    <button id="stopBtn" class="btn" ${estado === "desligado" ? "hidden" : ""}><i class="fa-solid fa-power-off" aria-hidden="true"></i><span>Desligar</span></button>
                                    <button id="restartBtn" class="btn" ${estado === "desligado" ? "hidden" : ""}><i class="fa-solid fa-rotate-right" aria-hidden="true"></i><span>Reiniciar</span></button>
                                    <button id="logoutBtn" class="btn" ${estado === "desligado" ? "hidden" : ""}><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i><span>Deslogar</span></button>
                                </div>`
                            : ""
                        }
                    <div class="display-section">
                        <div id="loader" class='loader mini' role='status' aria-label='Loading'></div>
                        <span id="display"></span>
                    </div>
                </div>
            </body>
            <script>
                const startBtn = document.getElementById('startBtn');
                const stopBtn = document.getElementById('stopBtn');
                const restartBtn = document.getElementById('restartBtn');
                const logoutBtn = document.getElementById('logoutBtn');
                const loader = document.getElementById('loader');
                const display = document.getElementById('display');
                const buttonsContainer = document.getElementById('buttons-section');
                
                document.addEventListener("DOMContentLoaded", () => {
                    if("${estado}" === "iniciando"){
                        setInterval(() => { window.location.reload() }, 1000);
                    }
                    if("${estado}" === "qr"){
                        setInterval(() => { window.location.reload() }, 5000);
                    }
                });

                if (startBtn) {
                    startBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await actionBot("start", false);
                    });
                }

                if (stopBtn) {
                    stopBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await actionBot("stop", true);
                    });
                }

                if (restartBtn) {
                    restartBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await actionBot("restart", true);
                    });
                }

                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await actionBot("logout", true);
                    });
                }

                async function actionBot(action, hasPassword){

                    let payload = {};

                    if(hasPassword){
                        let password = prompt("Digite a credencial: ");
                        if(password === null) return;
                        payload = {
                            password: password
                        }
                    }

                    loader.style.display = "block";
                    
                    const buttons = buttonsContainer.querySelectorAll('button');

                    buttons.forEach(b => {
                        b.disabled = true;
                    });

                    let message = "Inicializando bot..."

                    if(action === "stop"){
                        message = "Desligando bot...";
                    } else if (action === "restart") {
                        message = "Reinicializando bot...";
                    } else if (action === "logout") {
                        message = "Deslogando sessão";
                    }

                    display.textContent = message;

                    try{
                        const response = await fetch("${ENDPOINT}/bot/" + action, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(payload)
                        });

                        if(!response.ok){
                            throw new Error(response.error);
                        }

                        loader.style.display = "none";
                        const data = await response.json();
                        display.textContent = data.message;
                        
                        if(data.reset){
                            buttons.forEach(b => {
                                b.disabled = false;
                            });
                            return;
                        }
                        
                    } catch (err) {
                        console.log("Erro durante o acionamento da ação do bot. ERRO" + err.message);
                        display.textContent = "Erro durante o acionamento da ação do bot.";
                    } finally {
                        loader.style.display = "none";
                        setInterval(() => {
                            window.location.reload();
                        }, 3000);
                    }
                }
            </script>
        </html>
    `);
});

app.use('/messages', messageRouter);
app.use('/bot', botRouter);

setInterval(verifyNewVideos, INTERVAL);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    logger.info(`Server running in http://localhost:${process.env.PORT}`);
    await startBot();
});