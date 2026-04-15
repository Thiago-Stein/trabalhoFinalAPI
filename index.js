const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SEGREDO_JWT = "rocky_grace_saviors_of_the_universe";

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
    //Parte dos Middleswares e login.
        // O "Porteiro": Verifica se quem tá chamando a rota tem o crachá (token)
    function checarToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Tira a palavra "Bearer " da frente

        if (!token) return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });

        jwt.verify(token, SEGREDO_JWT, (err, usuario) => {
            if (err) return res.status(403).json({ erro: "Token inválido ou expirado." });
            req.usuario = usuario;
            next(); // Se o token for válido, ele deixa a requisição passar!
        });
    }

    // Rota de Login pra pegar o Token
    app.post('/api/login', (req, res) => {
        const { usuario, senha } = req.body;
        
        // Hardcoded pra facilitar, mas na vida real checaria no banco
        if (usuario === 'admin' && senha === '123') {
            // Gera um token que vale por 1 hora
            const token = jwt.sign({ user: usuario }, SEGREDO_JWT, { expiresIn: '1h' });
            return res.json({ token });
        }
        
        res.status(401).json({ erro: "Usuário ou senha incorretos" });
    });


    app.get('/', (req, res) => {
        res.redirect('/api/filmes');
     });

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

        // Adicionar filme novo (Rota Protegida - Precisa do Token!)
    app.post('/api/filmes', checarToken, async (req, res) => {
        const { nome, tempoEmMinutos, genero, classificacaoIndicativa, diretor_id } = req.body;

        if (!nome || !genero || !tempoEmMinutos || classificacaoIndicativa === undefined || !diretor_id) {
            return res.status(400).json({ erro: "Campos obrigatórios faltando (incluindo diretor_id)" });
        }
        if (typeof tempoEmMinutos !== 'number' || tempoEmMinutos <= 0) {
            return res.status(400).json({ erro: "Tempo inválido" });
        }
        if (typeof classificacaoIndicativa !== 'number' || classificacaoIndicativa < 0) {
            return res.status(400).json({ erro: "Classificação inválida" });
        }

        try {
            const diretorExiste = await db.get('SELECT id FROM diretores WHERE id = ?', [diretor_id]);
            if (!diretorExiste) return res.status(404).json({ erro: "Diretor não existe no banco" });

            const result = await db.run(
                'INSERT INTO filmes (nome, tempoEmMinutos, genero, classificacaoIndicativa, diretor_id) VALUES (?, ?, ?, ?, ?)',
                [nome, tempoEmMinutos, genero, classificacaoIndicativa, diretor_id]
            );

            res.status(201).json({ 
                mensagem: "Filme salvo com sucesso!", 
                id_gerado: result.lastID 
            });
        } catch (error) {
            res.status(500).json({ erro: "Erro ao salvar no banco" });
        }
    });

    // Atualizar filme (Protegida)
    app.put('/api/filmes/:id', checarToken, async (req, res) => {
        const id = req.params.id;
        const filmeAtual = await db.get('SELECT * FROM filmes WHERE id = ?', [id]);

        if (!filmeAtual) return res.status(404).json({ erro: "Filme não encontrado" });

        const nome = req.body.nome !== undefined ? req.body.nome : filmeAtual.nome;
        const tempo = req.body.tempoEmMinutos !== undefined ? req.body.tempoEmMinutos : filmeAtual.tempoEmMinutos;
        const gen = req.body.genero !== undefined ? req.body.genero : filmeAtual.genero;
        const classInd = req.body.classificacaoIndicativa !== undefined ? req.body.classificacaoIndicativa : filmeAtual.classificacaoIndicativa;
        const dirId = req.body.diretor_id !== undefined ? req.body.diretor_id : filmeAtual.diretor_id;

        await db.run(
            'UPDATE filmes SET nome = ?, tempoEmMinutos = ?, genero = ?, classificacaoIndicativa = ?, diretor_id = ? WHERE id = ?',
            [nome, tempo, gen, classInd, dirId, id]
        );

        res.json({ mensagem: "Filme atualizado!" });
    });

    // Deletar filme (Protegida)
    app.delete('/api/filmes/:id', checarToken, async (req, res) => {
        const result = await db.run('DELETE FROM filmes WHERE id = ?', [req.params.id]);

        if (result.changes === 0) {
            return res.status(404).json({ erro: "Filme não encontrado" });
        }

        res.json({ mensagem: "Filme excluído do banco com sucesso!" });
    });

    // Inicia o banco antes de escutar a porta
    iniciarBanco().then(() => {
        // Só liga o servidor de verdade se NÃO estiver rodando teste automatizado
        if (process.env.NODE_ENV !== 'test') {
            // Pega a porta do Render OU usa a 3000 se tiver rodando no seu PC
            const PORTA = process.env.PORT || 3000; 
            
            app.listen(PORTA, '0.0.0.0', () => console.log(`API conectada ao SQLite na porta ${PORTA}!!`));
        }
    });

    // Exporta a nossa API para o arquivo de testes conseguir usar
    module.exports = app;