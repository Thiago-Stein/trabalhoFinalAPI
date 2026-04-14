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

// Inicia o banco antes de escutar a porta
iniciarBanco().then(() => {
    app.listen(3000, '0.0.0.0', () => console.log('API conectada ao SQLite na porta 3000!!'));
});