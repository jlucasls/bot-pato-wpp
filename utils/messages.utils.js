const { getBemVindo } = require("../messages/bemVindo.messages");
const { getMenu } = require("../messages/menu.messages");
const { getPatoNews } = require("../messages/patoNews.messages");
const { getPatoTv } = require("../messages/patoTv.messages");
const { getSair } = require("../messages/sair.messages");
const { getSite } = require("../messages/site.messages");

const MENSAGENS = {
    "oi": (userId) => getBemVindo(userId),
    "menu": (userId) => getMenu(userId),
    "1": () => getPatoNews(),
    "2": () => getPatoTv(),
    "3": () => getSite(),
    "voltar": (userId) => getMenu(userId),
    "sair": (userId) => getSair(userId),
};

module.exports = { MENSAGENS };