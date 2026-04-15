# API de Catálogo de Filmes

Uma RESTful API robusta para gerenciamento de um catálogo de filmes, desenvolvida como projeto final/avaliação. O sistema inclui um banco de dados relacional, autenticação de rotas, paginação, filtros e testes automatizados.

Deploy em Produção: [Acesse a API aqui](https://trabalho-api-de-filmes.onrender.com)

---

## Tecnologias Utilizadas

* Node.js com Express (Criação do servidor e roteamento)
* SQLite3 (Banco de dados relacional embutido)
* JSON Web Token (JWT) (Autenticação e segurança das rotas)
* Jest & Supertest (Testes automatizados de integração)

---

## Funcionalidades e Requisitos Atendidos

* CRUD Completo: Criação, leitura, atualização e exclusão de filmes.
* Banco de Dados Relacional: Utilização de JOINs relacionando a tabela filmes com a tabela diretores.
* Seed Automático: O sistema cria as tabelas e popula o banco com 20 registros iniciais automaticamente na primeira execução.
* Segurança (JWT): Rotas de alteração de dados (POST, PUT, DELETE) protegidas por token de autenticação.
* Consultas Avançadas: Suporte a paginação, ordenação e filtros dinâmicos via Query Parameters direto no banco de dados.
* Validações Robustas: Prevenção contra dados inválidos e retornos com Status Codes HTTP adequados (200, 201, 400, 401, 403, 404, 500).

---

## Como rodar o projeto localmente

1. Clone o repositório:
git clone https://github.com/SEU_USUARIO/trabalho-api-de-filmes.git
cd trabalho-api-de-filmes

2. Instale as dependências:
npm install

3. Inicie o servidor:
npm start

> A API estará rodando em http://localhost:3000. O arquivo banco.sqlite será criado automaticamente na raiz do projeto.

---

## Como rodar os testes automatizados

Para verificar a integridade da rota principal de listagem, execute o comando configurado com o Jest:
npm test

---

## Endpoints da API

### Autenticação
* POST /api/login - Recebe { "usuario": "admin", "senha": "123" } e retorna o Token JWT.

### Filmes (Rotas Públicas)
* GET /api/filmes - Lista os filmes. 
  * Query Params opcionais: ?pagina=1&limite=10&genero=Terror&ordem=tempoEmMinutos&direcao=desc
* GET /api/filmes/:id - Retorna os detalhes de um filme específico (incluindo o nome do diretor via JOIN).

### Filmes (Rotas Protegidas - Requerem Header Authorization: Bearer <token>)
* POST /api/filmes - Adiciona um novo filme.
* PUT /api/filmes/:id - Atualiza os dados de um filme existente.
* DELETE /api/filmes/:id - Remove um filme do catálogo.

--- 
### EXEMPLO VISUAL VIA POSTMAN:

Primeiramente precisamos fazer login para mexer nos dados, para isso usaremos um POST que eu nomeei como "LoginADM":
<img width="1282" height="833" alt="loginComoADM" src="https://github.com/user-attachments/assets/7fb60a4d-2296-41de-abed-12061f7a87c2" />
<br>

Após isso, utilizei o meu método GET MostrarFilmes para vermos como esta a lista atual de filmes (Fui para a página 2 já que ao adicionar algum filme ele iria para lá! E para isso utilizei "/api/filmes?pagina=2"): 
<img width="1277" height="834" alt="MostrarFilmesNormal" src="https://github.com/user-attachments/assets/a32c868b-4b9d-452c-a097-0bb7304261c3" />

<br>
Aqui criei o filme "Oppenheimer" na nosssa lista (Com um erro de idade proposital para alterar no PUT):
<img width="1279" height="832" alt="filmeCriado" src="https://github.com/user-attachments/assets/d30e18f1-cee0-4f5c-b348-98049973e059" />

<br>
Para mostrar que a lista atualizada com o novo filme usei novamente o meu método GET MostrarFilmes (O ID dele esta como 23 pois fiz 2 testes anteriores a essas imagens!): 
<img width="1280" height="832" alt="listaComOFilmeNovo" src="https://github.com/user-attachments/assets/bdde3fbb-933e-4873-a78a-e596cb3844ce" />

<br>
Aqui é utilizado o método GET e dessa vez é o que eu chamei de MostrarPorID (Na URL o que muda é que após "/api/filmes/23")
<img width="1281" height="832" alt="pesquisaPorID" src="https://github.com/user-attachments/assets/db421b17-73d6-4fc7-beea-89cb466223bb" />

<br>
Após isso editei o filme com um método PUT que chamei de EditarFilme, onde mudei para a classificação indicativa correta e adicionei o gênero "Histórico":
<img width="1280" height="834" alt="atualizarFilme" src="https://github.com/user-attachments/assets/21b003e2-43a4-458e-b0d0-4a6f698356b8" />

<br>
Aqui é o GET MostrarFilmes pós edição do filme:
<img width="1276" height="829" alt="ListaPosFilmeEditado" src="https://github.com/user-attachments/assets/7924332b-d12f-4283-883f-0074c6fcddd1" />

<br>
Aqui utilizei o método DELET que chamei de DeletarFilme, onde após clicar em "Send" ele me retornou que o filme foi deletado!
<img width="1282" height="830" alt="deletarFilme" src="https://github.com/user-attachments/assets/958eeba8-4f4b-4087-9381-6d472230ed56" />

<br>
E por fim aqui esta a lista pós o filme ser deletado:
<img width="1280" height="833" alt="listaPosDelete" src="https://github.com/user-attachments/assets/f601dcd1-8634-4c78-97ce-b157f2eb554d" />
