const request = require('supertest');
const app = require('./index');

describe('Testes da API de Filmes', () => {
    it('Deve listar os filmes na rota GET /api/filmes', async () => {
        const res = await request(app).get('/api/filmes');
        
        // Verifica se o status HTTP é 200 (OK - Sucesso)
        expect(res.statusCode).toEqual(200);
        
        // Verifica se a resposta traz as propriedades que a gente programou
        expect(res.body).toHaveProperty('dados');
        expect(res.body).toHaveProperty('paginacao');
    });
});