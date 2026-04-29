const express = require ("express");
const routes = require("./rotas");

const app = express();

app.use(express.json());
app.use("/", routes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Bot rodando na porta ${PORT}`);
})