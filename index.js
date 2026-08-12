const express = require ("express");
const routes = require("./rotas");

const app = express();

app.use(express.json());
app.use("/", routes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🤖 BOT LIGADO 🤖\nRodando na porta: 5000`);
});