const express = require("express");
const router = express.Router();

const { getMenu } = require("./services/menu");

router.post("/mensagem", (req, res) => {
  const mensagem = req.body.mensagem.toLowerCase();

  let resposta;

  if (mensagem === "oi" || mensagem === "menu") {
    resposta = getMenu();
  } else {
    resposta = "Não entendi 🤔. Digite 'menu' para ver opções.";
  }

  res.json({ resposta });
});

module.exports = router;