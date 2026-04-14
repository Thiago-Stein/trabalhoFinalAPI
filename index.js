const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API de Filmes Rodando!');
});

app.listen(3000, () => {
    console.log('Servidor inicializado na porta 3000');
});