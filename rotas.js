const{getPatoNews} = require("./services/PatoNews");
const{getPatoTv} = require("./services/PatoTv");
const{getSite} = require("./services/Site");


const express = require("express");
const router = express.Router();

const { getMenu } = require("./services/menu");

router.post("/mensagem", (req, res) => {
  const mensagem = req.body.mensagem.toLowerCase();

  let resposta;

  if (mensagem === "oi" || mensagem === "menu") {
    resposta = getMenu();
  }else if(mensagem === "1"){
    resposta = getPatoNews();
  } 
  else if(mensagem === "2"){
    resposta = getPatoTv();
  }
  else if(mensagem === "3"){
    resposta = getSite();
  }
  else {
    resposta = "Não entendi 🤔. Digite 'menu' para ver opções.";
  }

  res.json({ resposta });
});

module.exports = router;