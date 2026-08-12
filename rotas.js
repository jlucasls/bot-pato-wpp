const { getMenu } = require("./messages/menu.messages");
const{ getPatoNews } = require("./messages/patoNews.messages");
const{ getPatoTv } = require("./messages/patoTv.messages");
const{ getSite } = require("./messages/site.messages");

const express = require("express");
const router = express.Router();

// Opções de mensagens
const MENSAGENS = {
  "oi": (user) => getMenu(user),
  "menu": (user) => getMenu(user),
  "1": getPatoNews(),
  "2": getPatoTv,
  "3": getSite()
}

router.post("/mensagem", (req, res) => {
  
  const msg = req.body.mensagem.toLowerCase();
  let resposta;
  
  let user;

  if (MENSAGENS.hasOwn(msg)) {
    resposta = MENSAGENS[msg];

    if (typeof resposta === "function") {
      resposta = resposta(user);
    }

  } else {
    resposta = "Não entendi 🤔. Digite 'menu' para ver opções.";
  }

  res.json({ resposta });

});

module.exports = router;