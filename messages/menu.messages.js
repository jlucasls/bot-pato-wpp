function getMenu(user) {
  return `
🦆 QUACK! E aí @${user}, no que te posso ajudar hoje?

Escolha uma opção digitando o número:

1️⃣ - 📢 Pato News
2️⃣ - 📺 PatoTv
3️⃣ - 🌐 Site do clube

_Digite *sair* para encerrar a conversa._
  `;
}
module.exports = { getMenu };