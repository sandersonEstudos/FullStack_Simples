const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

const port = 3000

app.use(cors());
app.use(express.json());

const SECRET = "segredo_super_seguro";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "sistema"
});

app.post("/registrar", async (req, res) => {

    const { usuario, senha } = req.body;

    const hash = await bcrypt.hash(senha, 10);

    db.query(
        "INSERT INTO usuarios_login (usuario, senha) VALUES (?, ?)",
        [usuario, hash],
        () => res.json({ ok: true })
    );
});

app.post("/login", (req, res) => {

    const { usuario, senha } = req.body;

    db.query(
        "SELECT * FROM usuarios_login WHERE usuario=?",
        [usuario],
        async (err, result) => {

            if (result.length === 0) {
                return res.json({ success: false });
            }

            const user = result[0];

            const valido = await bcrypt.compare(
                senha,
                user.senha
            );

            if (!valido) {
                return res.json({ success: false });
            }

            const token = jwt.sign(
                { id: user.id },
                SECRET,
                {
                    expiresIn: "1h"
                }
            );

            res.json({ success: true, token });
        }
    );
});

function verificarToken(req, res, next) {

    const token = req.headers.authorization;

    if (!token) return res.sendStatus(403);

    jwt.verify(token, SECRET, (err, decoded) => {

        if (err) return res.sendStatus(401);

        req.userId = decoded.id;

        next();
    });
}

app.get("/listar", verificarToken, (req, res) => {

    db.query("SELECT * FROM usuarios", (err, result) => {

        res.json(result);
    });
});

app.post("/salvar", verificarToken, (req, res) => {

    const { id, nome } = req.body;

    if (id) {

        db.query(
            "UPDATE usuarios SET nome=? WHERE id=?",
            [nome, id]
        );

    } else {

        db.query(
            "INSERT INTO usuarios (nome) VALUES (?)",
            [nome]
        );
    }

    res.json({ ok: true });
});

app.delete("/deletar/:id", verificarToken, (req, res) => {

    db.query(
        "DELETE FROM usuarios WHERE id=?",
        [req.params.id]
    );

    res.json({ ok: true });
});

app.listen(port, () => console.log("Servidor rodando"));