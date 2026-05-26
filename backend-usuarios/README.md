# Back-end de Usuários

Este projeto implementa um back-end **Node.js com Express** compatível com o arquivo `script.js` enviado. O front-end faz requisições para `http://localhost:3000`, portanto o servidor foi configurado para rodar na porta `3000` por padrão.

## Como executar

Entre na pasta do projeto e instale as dependências:

```bash
cd backend-usuarios
npm install
```

Depois, inicie o servidor:

```bash
npm start
```

Se tudo estiver correto, aparecerá uma mensagem semelhante a:

```text
Servidor rodando em http://localhost:3000
Login padrão: usuário "admin" e senha "123456"
```

## Login padrão

| Campo | Valor |
|---|---|
| Usuário | `admin` |
| Senha | `123456` |

Você pode alterar essas credenciais usando variáveis de ambiente:

```bash
ADMIN_USUARIO=meuusuario ADMIN_SENHA=minhasenha npm start
```

## Rotas compatíveis com o front-end

| Método | Rota | Autenticação | Uso no front-end |
|---|---:|---|---|
| `POST` | `/login` | Não | Realiza login e retorna `{ success, token }`. |
| `GET` | `/listar` | Sim | Carrega a tabela e a cena 3D com os usuários. |
| `POST` | `/salvar` | Sim | Cria um novo usuário ou atualiza um usuário existente. |
| `DELETE` | `/deletar/:id` | Sim | Remove o usuário pelo ID. |
| `POST` | `/logout` | Sim | Encerra a sessão do token atual. Esta rota é extra; o front-end atual remove o token localmente. |

## Formato de autenticação

As rotas protegidas esperam o mesmo cabeçalho usado no seu `script.js`:

```http
Authorization: Token SEU_TOKEN_AQUI
```

## Estrutura dos dados

Os usuários ficam salvos no arquivo `usuarios.json`, criado automaticamente na primeira execução. Cada usuário segue este formato:

```json
{
  "id": 1,
  "nome": "Ana Souza"
}
```

## Observação importante

Este back-end foi feito para ambiente local e estudos. Para produção, recomenda-se usar banco de dados, criptografia de senha, tokens JWT com expiração e configuração de CORS mais restrita.
