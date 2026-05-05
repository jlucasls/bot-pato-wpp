const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const { getMenu } = require("./services/menu");
const { getPatoNews } = require("./services/PatoNews");
const { getPatoTv } = require("./services/PatoTv");
const { getSite } = require("./services/Site");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
    }
});

// QR Code
client.on("qr", (qr) => {
    console.log("Escaneie o QR Code:");
    qrcode.generate(qr, { small: true });
});

// Conectado
client.on("ready", () => {
    console.log("WhatsApp conectado!");
});

// Mensagens
client.on("message", async (message) => {

    if (message.fromMe) return;
     if (message.from.includes("@g.us")) return; //ignora grupos

     const MEU_NUMERO = "5571991071460@c.us";

if (message.from !== MEU_NUMERO) return;

    const msg = message.body.toLowerCase().trim();

    console.log("Mensagem recebida:", msg);

    let resposta;

    if (msg === "oi" || msg === "menu" || msg === "0") {
        resposta = getMenu();

    } else if (msg === "1") {
        resposta = getPatoNews();

    } else if (msg === "2") {
        resposta = getPatoTv();

    } else if (msg === "3") {
        resposta = getSite();

    } else if (msg === "sair") {
        resposta = "👋 Atendimento encerrado! Digite 'menu' para começar novamente.";

    } else if (msg === "desligar") {
        await message.reply("🛑 Bot será desligado...");
        console.log("Bot desligado manualmente.");
        process.exit();
        return;

    } else {
        resposta = "Não entendi 🤔. Digite 'menu'.";
    }

    await message.reply(resposta);
});

// Inicializa
client.initialize();