const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { deleteFolder } = require("./utils/deleteFolder.utils");
const { MENSAGENS } = require("./routes/mensagens.routes");

// Módulos de resposta do fluxo de conversação
const { getBemVindo } = require("./messages/bemVindo.messages");
const { getMenu } = require("./messages/menu.messages");
const { getPatoNews } = require("./messages/patoNews.messages");
const { getPatoTv } = require("./messages/patoTv.messages");
const { getSite } = require("./messages/site.messages");
const { getSair } = require("./messages/sair.messages");

// Configuração da instância do cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(), // Persistência de sessão local (Tokens/Chaves)
    puppeteer: {
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage" // Otimização de alocação de memória no container/SO
        ]
    }
});

// Lista de controle de acesso (ACL) baseada no número decodificado do contato. Também permite que os LIDs inseridos desliguem o Bot por mensagem.
const lidsPermitidos = ["31160021344467", "182549078892659", "257676630044715"];

// Controle de estado/sessão ativa dos usuários em memória (RAM)
const usuariosAtivos = new Set();

// Evento de geração do payload do QR Code para autenticação
client.on("qr", (qr) => {
    console.log("Escaneie o QR Code:");
    qrcode.generate(qr, { small: true });
});

// Evento de inicialização e sincronização concluída com o gateway do WhatsApp
client.on("ready", () => {
    console.log("WhatsApp conectado!");
});

// Handlers de eventos de mensagens recebidas (Inbound)
client.on("message", async (message) => {

    try {
        // Sanity Checks / Filtros globais de bypass
        if (message.fromMe) return;
        if (message.from.includes("@g.us")) return; // Ignora JIDs de grupos
        if (message.from.includes("@newsletter")) return; // Ignora JIDs de canais de transmissão

        let user;

        // Resolução de JID: Contorna o mascaramento de privacidade do protocolo @lid para obter o número real
        try {
            user = await message.getContact();
        } catch (err) {
            console.error("Erro na resolução de JID do contato. ERROR: " + err.message);
            await message.reply("🦆 QUACK! Desculpa, estamos enfrentando turbulências em nossos serviços. Tente novamente mais tarde!");
            return;
        }

        // Validação de segurança na camada de aplicação (ACL)
        if (!lidsPermitidos.includes(user.number)) {
            console.log(`Mensagem bloqueada de: ${user.pushname} (${user.number})`);
            return;
        }

        // Normalização do payload da mensagem
        const msg = message.body.toLowerCase().trim();
        let resposta;

        // Máquina de estados para tratamento de novos usuários vs usuários recorrentes
        if (!usuariosAtivos.has(user.number)) {
            // Estado: Novo usuário na sessão. Força fluxo de onboarding/boas-vindas independente do payload.
            usuariosAtivos.add(user.number);
            resposta = getBemVindo(user.id.user);
        } else {
            // Estado: Usuário recorrente. Processamento do roteamento de comandos.

            if (msg in MENSAGENS) {
                resposta = MENSAGENS[msg];
                if (typeof resposta === "function") {
                    resposta = resposta(user.id.user);
                }
            }

            else if (msg === "desligar") {
                if (lidsPermitidos.includes(user.number)) {
                    await message.reply("🛑 Encerrando Bot... 🛑");
                    console.log("🛑 Iniciando desligamento manual... 🛑");

                    try {
                        // Finaliza o subprocesso do navegador para liberar os locks dos arquivos em disco
                        await client.destroy();
                        console.log("1. Navegador fechado com sucesso.");

                        // Expurgamento dos dados de sessão para evitar corrupção de estado na próxima inicialização
                        deleteFolder("./.wwebjs_auth");
                        deleteFolder("./.wwebjs_cache");
                        console.log("2. Cache e autenticação limpos!");
                    } catch (err) {
                        console.error("Erro durante o processo de limpeza:", err.message);
                    }

                    console.log("✅ Bot desligado com sucesso! ✅");
                    process.exit();
                    return;
                }
                resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
            }

            else if (msg === "sair") {
                resposta = getSair(user.id.user);
                usuariosAtivos.delete(user.number); // Destrói o estado da sessão do usuário na RAM
            }

            else {
                resposta = "Não entendi 🤔. Digite *menu* para ver opções ou *sair* para encerrar a conversa.";
            }
        }

        // Injeção de metadados de menção (Força o mapeamento do ID do usuário para o sufixo legado @c.us exigido pela interface Web)
        await message.reply(resposta, undefined, {
            mentions: [`${user.id.user}@c.us`]
        });

    } catch (err) {
        console.error("Erro interno no processamento/envio da mensagem. ERROR: " + err.message);
        try {
            await message.reply("🦆 QUACK! Desculpa, estamos enfrentando turbulências em nossos serviços. Tente novamente mais tarde!");
        } catch (replyErr) {
            console.error("Falha crítica ao enviar mensagem de erro de fallback: " + replyErr.message);
        }
    }

});

// Inicialização e bootstrap do Puppeteer
client.initialize();