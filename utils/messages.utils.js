import { getBemVindo } from '../messages/bemVindo.messages.js';
import { getMenu } from '../messages/menu.messages.js';
import { getPatoNews } from '../messages/patoNews.messages.js';
import { getPatoTv } from '../messages/patoTv.messages.js';
import { getSair } from '../messages/sair.messages.js';
import { getSite } from '../messages/site.messages.js';

const MENSAGENS = {
    "oi": (userId) => getBemVindo(userId),
    "menu": (userId) => getMenu(userId),
    "1": () => getPatoNews(),
    "2": () => getPatoTv(),
    "3": () => getSite(),
    "voltar": (userId) => getMenu(userId),
    "sair": (userId) => getSair(userId),
};

export { MENSAGENS };