const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
app.use(express.json());

let db; // Variável global do banco

// Função para iniciar e popular o banco
async function iniciarBanco() {
    db = await open({
        filename: './banco.sqlite',
        driver: sqlite3.Database
    });



    // Cria as tabelas
    await db.exec(`
        CREATE TABLE IF NOT EXISTS diretores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS filmes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            tempoEmMinutos INTEGER NOT NULL,
            genero TEXT NOT NULL,
            classificacaoIndicativa INTEGER NOT NULL,
            diretor_id INTEGER,
            FOREIGN KEY(diretor_id) REFERENCES diretores(id)
        );
    `);

    const qtd = await db.get('SELECT COUNT(*) as count FROM filmes');
    
    // Insere os 20 filmes se o banco estiver vazio
    if (qtd.count === 0) {
        console.log('Banco zerado! Inserindo diretores e os 20 filmes...');
        
        await db.exec(`
            INSERT INTO diretores (nome) VALUES 
            ('Ari Aster'), ('Gints Zilbalodis'), ('Damien Chazelle'), ('David Fincher'), ('Christopher Nolan');
        `);

        const filmesSeed = [
            { nome: "Hereditário", tempo: 126, gen: "Terror", class: 16, dir: 1 },
            { nome: "Midsommar", tempo: 148, gen: "Terror", class: 18, dir: 1 },
            { nome: "Flow", tempo: 85, gen: "Animação", class: 0, dir: 2 },
            { nome: "La La Land", tempo: 128, gen: "Musical", class: 0, dir: 3 },
            { nome: "Whiplash", tempo: 106, gen: "Drama", class: 12, dir: 3 },
            { nome: "Seven", tempo: 127, gen: "Suspense", class: 16, dir: 4 },
            { nome: "Clube da Luta", tempo: 139, gen: "Drama", class: 18, dir: 4 },
            { nome: "Garota Exemplar", tempo: 149, gen: "Suspense", class: 16, dir: 4 },
            { nome: "A Origem", tempo: 148, gen: "Ficção", class: 14, dir: 5 },
            { nome: "Interestelar", tempo: 169, gen: "Ficção", class: 10, dir: 5 },
            { nome: "Batman: Cavaleiro das Trevas", tempo: 152, gen: "Ação", class: 12, dir: 5 },
            { nome: "Dunkirk", tempo: 106, gen: "Guerra", class: 14, dir: 5 },
            { nome: "Zodíaco", tempo: 157, gen: "Suspense", class: 16, dir: 4 },
            { nome: "O Primeiro Homem", tempo: 141, gen: "Drama", class: 12, dir: 3 },
            { nome: "Babilônia", tempo: 189, gen: "Comédia", class: 18, dir: 3 },
            { nome: "A Rede Social", tempo: 120, gen: "Drama", class: 14, dir: 4 },
            { nome: "Benjamin Button", tempo: 166, gen: "Drama", class: 12, dir: 4 },
            { nome: "Beau Tem Medo", tempo: 179, gen: "Terror", class: 18, dir: 1 },
            { nome: "Tenet", tempo: 150, gen: "Ação", class: 14, dir: 5 },
            { nome: "Amnésia", tempo: 113, gen: "Suspense", class: 14, dir: 5 }
        ];

        for (const f of filmesSeed) {
            await db.run(
                'INSERT INTO filmes (nome, tempoEmMinutos, genero, classificacaoIndicativa, diretor_id) VALUES (?, ?, ?, ?, ?)',
                [f.nome, f.tempo, f.gen, f.class, f.dir]
            );
        }
    }
}


// Rota que lista os filmes com filtros, paginação e ordenação via Banco de Dados.
app.get('/api/filmes', async (req, res) => {
    const { genero, tempo_max, tempo_min, ordem, direcao, pagina = 1, limite = 11 } = req.query;

    // A query base com o JOIN para pegar o nome do diretor
    let query = `
        SELECT f.id, f.nome, f.tempoEmMinutos, f.genero, f.classificacaoIndicativa, d.nome as diretor_nome 
        FROM filmes f
        JOIN diretores d ON f.diretor_id = d.id 
        WHERE 1=1
    `;
    let params = [];
    
    // Uma query extra para contar o total de itens para a paginação
    let queryCount = `SELECT COUNT(*) as total FROM filmes f WHERE 1=1`; 
    let paramsCount = [];

    // Filtros dinâmicos (Adiciona na query só se o usuário pedir)
    if (genero) {
        query += ` AND f.genero = ?`;
        queryCount += ` AND f.genero = ?`;
        params.push(genero);
        paramsCount.push(genero);
    }
    if (tempo_max) {
        query += ` AND f.tempoEmMinutos <= ?`;
        queryCount += ` AND f.tempoEmMinutos <= ?`;
        params.push(tempo_max);
        paramsCount.push(tempo_max);
    }
    if (tempo_min) {
        query += ` AND f.tempoEmMinutos >= ?`;
        queryCount += ` AND f.tempoEmMinutos >= ?`;
        params.push(tempo_min);
        paramsCount.push(tempo_min);
    }

    // Ordenação (Com trava de segurança para evitar injeção de SQL)
    const colunasValidas = ['nome', 'tempoEmMinutos'];
    if (ordem && colunasValidas.includes(ordem)) {
        const dirValida = direcao === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY f.${ordem} ${dirValida}`;
    }

    // Paginação usando LIMIT e OFFSET do SQLite
    const limiteNum = parseInt(limite) || 11;
    const paginaNum = parseInt(pagina) || 1;
    const offset = (paginaNum - 1) * limiteNum;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limiteNum, offset);

    try {
        const dados = await db.all(query, params);
        const { total } = await db.get(queryCount, paramsCount);

        res.json({
            dados,
            paginacao: {
                pagina_atual: paginaNum,
                itens_por_pagina: limiteNum,
                total_itens: total,
                total_paginas: Math.ceil(total / limiteNum)
            }
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

// Rota para buscar um filme específico pelo ID
app.get('/api/filmes/:id', async (req, res) => {
    const filme = await db.get(`
        SELECT f.*, d.nome as diretor_nome 
        FROM filmes f JOIN diretores d ON f.diretor_id = d.id 
        WHERE f.id = ?
    `, [req.params.id]);

    if (!filme) return res.status(404).json({ erro: "Filme não encontrado no banco" });
    
    res.json(filme);
});

// Inicia o banco antes de escutar a porta
iniciarBanco().then(() => {
    app.listen(3000, '0.0.0.0', () => console.log('API conectada ao SQLite na porta 3000!!'));
});