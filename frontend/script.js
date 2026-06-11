API = "http://localhost:3000";

const loginForm = 
document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const usuario = usuario.value;
        const senha = senha.value;

        const res = await fetch(API + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({ usuario, senha })
        });

        const data = await res.json();

        if (data.success) {

            localStorage.setItem("token", data.token);

            window.location = "dashboard.html";
        }
    });
}

function verificarLogin() {

    const token = localStorage.getItem("token");

    if (!token) window.location = "index.html";
}

if (document.getElementById("tabelaUsuarios")) {

    verificarLogin();

    carregar();

    document.getElementById("formCadastro").addEventListener("submit",
        async (e) => {

            e.preventDefault();

            await fetch(API + "/salvar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",

                    "Authorization": localStorage.getItem("token")
                },

                body: JSON.stringify({
                    id: id.value,
                    nome: nome.value
                })
            });

            carregar();
        });

    async function carregar() {

        const res = await fetch(API + "/listar", {
            headers: {
                "Authorization": localStorage.getItem("token")
            }
        });

        const dados = await res.json();

        tabelaUsuarios.innerHTML = "";

        dados.forEach(u => {

            tabelaUsuarios.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td>${u.nome}</td>

                <td>

                    <button onclick="editar(${u.id},
                    '${u.nome}')">Editar</button>

                    <button
                    onclick="deletar(${u.id})">Excluir</button>
                </td>
            </tr>`;
        });
    }

    window.editar = (idv, nomev) => {

        id.value = idv;
        nome.value = nomev;
    };

    window.deletar = async (idv) => {

        await fetch(API + "/deletar/" + idv, {
            method: "DELETE",
            headers: {
                "Authorization": localStorage.getItem("token")
            }
        });

        carregar();
    };
}

function logout() {

    localStorage.removeItem("token");

    window.location = "index.html";
}