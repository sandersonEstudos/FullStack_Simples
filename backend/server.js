// =========================
// 🌐 CONFIGURAÇÃO
// =========================
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// =========================
// 🔑 SIMULAÇÃO DE BANCO DE DADOS
// =========================
let usuarios = [
    { id: 1, nome: "Caio" },
    { id: 2, nome: "Maria" }
];

let tokenFake = "123456"; // token fixo para simplificação

// =========================
// 🔑 LOGIN
// =========================
app.post("/login", (req, res) => {
    const { usuario, senha } = req.body;

    // Simulação de login
    if (usuario === "admin" && senha === "123") {
        res.json({ success: true, token: tokenFake });
    } else {
        res.json({ success: false });
    }
});

// =========================
// 📥 LISTAR USUÁRIOS
// =========================
app.get("/listar", (req, res) => {
    const auth = req.headers.authorization;

    if (auth !== "Token " + tokenFake) {
        return res.status(401).json({ error: "Não autorizado" });
    }

    res.json(usuarios);
});

// =========================
// 💾 SALVAR (INSERT/UPDATE)
// =========================
app.post("/salvar", (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== "Token " + tokenFake) {
        return res.status(401).json({ error: "Não autorizado" });
    }

    const { id, nome } = req.body;

    if (id) {
        // Atualiza usuário existente
        const user = usuarios.find(u => u.id == id);
        if (user) user.nome = nome;
    } else {
        // Cria novo usuário
        const novoId = usuarios.length ? usuarios[usuarios.length - 1].id + 1 : 1;
        usuarios.push({ id: novoId, nome });
    }

    res.json({ success: true });
});

// =========================
// ❌ DELETAR
// =========================
app.delete("/deletar/:id", (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== "Token " + tokenFake) {
        return res.status(401).json({ error: "Não autorizado" });
    }

    const id = parseInt(req.params.id);
    usuarios = usuarios.filter(u => u.id !== id);

    res.json({ success: true });
});

// =========================
// 🚀 INICIAR SERVIDOR
// =========================
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});