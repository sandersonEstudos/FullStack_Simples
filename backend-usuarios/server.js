const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, "usuarios.json");

const ADMIN_USUARIO = process.env.ADMIN_USUARIO || "admin";
const ADMIN_SENHA = process.env.ADMIN_SENHA || "123456";

const sessoesAtivas = new Set();

app.use(cors());
app.use(express.json());

async function garantirArquivoDados() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    const usuariosIniciais = [
      { id: 1, nome: "Ana Souza" },
      { id: 2, nome: "Carlos Lima" },
      { id: 3, nome: "Mariana Costa" }
    ];
    await fs.writeFile(DATA_FILE, JSON.stringify(usuariosIniciais, null, 2));
  }
}

async function lerUsuarios() {
  await garantirArquivoDados();
  const conteudo = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(conteudo || "[]");
}

async function salvarUsuarios(usuarios) {
  await fs.writeFile(DATA_FILE, JSON.stringify(usuarios, null, 2));
}

function criarToken() {
  return crypto.randomBytes(32).toString("hex");
}

function autenticar(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [tipo, token] = authorization.split(" ");

  if (tipo !== "Token" || !token || !sessoesAtivas.has(token)) {
    return res.status(401).json({ success: false, message: "Token inválido ou ausente" });
  }

  req.token = token;
  return next();
}

function normalizarNome(nome) {
  if (typeof nome !== "string") return "";
  return nome.trim();
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Back-end de usuários online",
    endpoints: {
      login: "POST /login",
      listar: "GET /listar",
      salvar: "POST /salvar",
      deletar: "DELETE /deletar/:id"
    }
  });
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body || {};

  if (usuario === ADMIN_USUARIO && senha === ADMIN_SENHA) {
    const token = criarToken();
    sessoesAtivas.add(token);
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: "Login inválido" });
});

app.get("/listar", autenticar, async (req, res) => {
  try {
    const usuarios = await lerUsuarios();
    return res.json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return res.status(500).json({ success: false, message: "Erro ao listar usuários" });
  }
});

app.post("/salvar", autenticar, async (req, res) => {
  try {
    const { id, nome } = req.body || {};
    const nomeNormalizado = normalizarNome(nome);

    if (!nomeNormalizado) {
      return res.status(400).json({ success: false, message: "O campo nome é obrigatório" });
    }

    const usuarios = await lerUsuarios();

    if (id) {
      const idNumerico = Number(id);
      const usuarioExistente = usuarios.find((usuario) => usuario.id === idNumerico);

      if (!usuarioExistente) {
        return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      }

      usuarioExistente.nome = nomeNormalizado;
      await salvarUsuarios(usuarios);
      return res.json({ success: true, usuario: usuarioExistente, message: "Usuário atualizado com sucesso" });
    }

    const proximoId = usuarios.length > 0 ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1 : 1;
    const novoUsuario = { id: proximoId, nome: nomeNormalizado };
    usuarios.push(novoUsuario);
    await salvarUsuarios(usuarios);

    return res.status(201).json({ success: true, usuario: novoUsuario, message: "Usuário criado com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    return res.status(500).json({ success: false, message: "Erro ao salvar usuário" });
  }
});

app.delete("/deletar/:id", autenticar, async (req, res) => {
  try {
    const idNumerico = Number(req.params.id);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }

    const usuarios = await lerUsuarios();
    const totalAntes = usuarios.length;
    const usuariosFiltrados = usuarios.filter((usuario) => usuario.id !== idNumerico);

    if (usuariosFiltrados.length === totalAntes) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }

    await salvarUsuarios(usuariosFiltrados);
    return res.json({ success: true, message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return res.status(500).json({ success: false, message: "Erro ao deletar usuário" });
  }
});

app.post("/logout", autenticar, (req, res) => {
  sessoesAtivas.delete(req.token);
  return res.json({ success: true, message: "Logout realizado com sucesso" });
});

app.use((req, res) => {
  return res.status(404).json({ success: false, message: "Rota não encontrada" });
});

garantirArquivoDados()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Login padrão: usuário "${ADMIN_USUARIO}" e senha "${ADMIN_SENHA}"`);
    });
  })
  .catch((error) => {
    console.error("Não foi possível iniciar o servidor:", error);
    process.exit(1);
  });
