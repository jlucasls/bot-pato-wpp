const { getBemVindo } = require("../messages/bemVindo.messages");
const { getMenu } = require("../messages/menu.messages");
const { getPatoNews } = require("../messages/patoNews.messages");
const { getPatoTv } = require("../messages/patoTv.messages");
const { getSite } = require("../messages/site.messages");

// Dicionário de rotas/comandos para funções síncronas de resposta
const MENSAGENS = {
    "oi": (userId) => getBemVindo(userId),
    "menu": (userId) => getMenu(userId),
    "1": () => getPatoNews(),
    "2": () => getPatoTv(),
    "3": () => getSite()
};

module.exports = { MENSAGENS };