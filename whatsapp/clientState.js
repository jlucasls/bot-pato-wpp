let clientPronto = false;

const isClientPronto = () => clientPronto;

const setClientPronto = (estado) => {
    clientPronto = estado;
};

export {
    isClientPronto,
    setClientPronto
};