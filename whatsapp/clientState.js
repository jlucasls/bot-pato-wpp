let clientPronto = false;
const isClientPronto = () => clientPronto;
const setClientPronto = (estado) => {
    clientPronto = estado;
};
module.exports = {
    isClientPronto,
    setClientPronto
};