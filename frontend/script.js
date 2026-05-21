// =========================
// CONFIG
// =========================
const API = "http://localhost:3000";

// -------------------------
// LOGIN
// -------------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usuario = document.getElementById("usuario").value;
        const senha = document.getElementById("senha").value;

        try {
            const res = await fetch(API + "/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, senha })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem("token", data.token);
                window.location = "dashboard.html";
            } else {
                alert("Login inválido");
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao conectar com o servidor");
        }
    });
}

// -------------------------
// VERIFICA LOGIN
// -------------------------
function verificarLogin() {
    const token = localStorage.getItem("token");
    if (!token) window.location = "index.html";
}

// -------------------------
// DASHBOARD / CRUD
// -------------------------
if (document.getElementById("tabelaUsuarios")) {
    verificarLogin();
    carregar();

    document.getElementById("formCadastro").addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("id").value;
        const nome = document.getElementById("nome").value;

        try {
            await fetch(API + "/salvar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Token " + localStorage.getItem("token")
                },
                body: JSON.stringify({ id: id || null, nome })
            });
            limparForm();
            carregar();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar");
        }
    });
}

// -------------------------
// FUNÇÕES AUXILIARES
// -------------------------
function limparForm() {
    document.getElementById("id").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("infoBox").innerText = "Nenhum usuário selecionado";
}

// -------------------------
// CARREGAR USUÁRIOS
// -------------------------
let usuariosCache = [];
async function carregar() {
    try {
        const res = await fetch(API + "/listar", {
            headers: { "Authorization": "Token " + localStorage.getItem("token") }
        });
        if (!res.ok) {
            if (res.status === 401) {
                alert("Sessão expirada");
                logout();
            }
            return;
        }
        const dados = await res.json();
        usuariosCache = dados;
        preencherTabela(dados);
        atualizarCena3D(dados);
    } catch (err) {
        console.error(err);
        alert("Erro ao carregar usuários");
    }
}

function preencherTabela(dados) {
    const tabela = document.getElementById("tabelaUsuarios");
    tabela.innerHTML = "";
    dados.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.nome}</td>
      <td>
        <button class="btn" onclick="editar(${u.id}, '${escapeHtml(u.nome)}')">Editar</button>
        <button class="btn ghost" onclick="deletar(${u.id})">Excluir</button>
      </td>`;
        tabela.appendChild(tr);
    });
}

function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// -------------------------
// EDITAR / DELETAR
// -------------------------
function editar(id, nome) {
    document.getElementById("id").value = id;
    document.getElementById("nome").value = nome;
    document.getElementById("infoBox").innerText = `Editando usuário ${id} — ${nome}`;
}

async function deletar(id) {
    if (!confirm("Confirma exclusão?")) return;
    try {
        await fetch(API + "/deletar/" + id, {
            method: "DELETE",
            headers: { "Authorization": "Token " + localStorage.getItem("token") }
        });
        carregar();
    } catch (err) {
        console.error(err);
        alert("Erro ao deletar");
    }
}

// -------------------------
// LOGOUT
// -------------------------
function logout() {
    localStorage.removeItem("token");
    window.location = "index.html";
}

// -------------------------
// HELP MODAL
// -------------------------
function toggleHelp() {
    const m = document.getElementById("helpModal");
    m.classList.toggle("hidden");
}

// =========================
// THREE.JS INTEGRAÇÃO
// =========================
let scene, camera, renderer, controls, raycaster, mouse;
let userMeshes = {}; // map id -> mesh

function initThree() {
    const container = document.getElementById("threeContainer");
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x071021, 0.02);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 6, 12);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Luzes
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Plano sutil
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x071021, transparent: true, opacity: 0.0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    scene.add(ground);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 30;

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Fundo animado de partículas
    createBackgroundParticles();

    window.addEventListener("resize", onWindowResize);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    animate();
}

function createBackgroundParticles() {
    const g = new THREE.BufferGeometry();
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 8 - 1;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x6ee7b7, size: 0.08, opacity: 0.9, transparent: true });
    const points = new THREE.Points(g, mat);
    scene.add(points);
}

function atualizarCena3D(users) {
    if (!scene) initThree();

    // Remove meshes que não existem mais
    const ids = users.map(u => String(u.id));
    for (const id in userMeshes) {
        if (!ids.includes(id)) {
            scene.remove(userMeshes[id]);
            delete userMeshes[id];
        }
    }

    // Criar/atualizar meshes
    const spacing = 3.2;
    users.forEach((u, i) => {
        const key = String(u.id);
        if (!userMeshes[key]) {
            const group = new THREE.Group();

            // base esfera
            const geo = new THREE.SphereGeometry(0.8, 32, 32);
            const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL((i / users.length), 0.6, 0.5), metalness: 0.3, roughness: 0.4 });
            const sphere = new THREE.Mesh(geo, mat);
            sphere.userData = { id: u.id, nome: u.nome };
            group.add(sphere);

            // placa com nome
            const canvas = document.createElement("canvas");
            canvas.width = 256; canvas.height = 64;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "rgba(10,14,20,0.9)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#e6eef6";
            ctx.font = "20px sans-serif";
            ctx.fillText(u.nome, 12, 38);
            const tex = new THREE.CanvasTexture(canvas);
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
            plane.position.set(0, -1.2, 0);
            group.add(plane);

            // posição
            const col = i % 4;
            const row = Math.floor(i / 4);
            group.position.set((col - 1.5) * spacing, 0.5 - row * 1.6, (row % 2 === 0 ? -1 : 1) * (row * 0.2));

            scene.add(group);
            userMeshes[key] = group;
        } else {
            // atualiza nome se necessário
            const g = userMeshes[key];
            g.children[0].userData.nome = u.nome;
            // atualizar textura do plano
            const plane = g.children.find(c => c.geometry && c.geometry.type === "PlaneGeometry");
            if (plane) {
                const ctx = plane.material.map.image.getContext("2d");
                ctx.clearRect(0, 0, plane.material.map.image.width, plane.material.map.image.height);
                ctx.fillStyle = "rgba(10,14,20,0.9)";
                ctx.fillRect(0, 0, plane.material.map.image.width, plane.material.map.image.height);
                ctx.fillStyle = "#e6eef6";
                ctx.font = "20px sans-serif";
                ctx.fillText(u.nome, 12, 38);
                plane.material.map.needsUpdate = true;
            }
        }
    });
}

function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(Object.values(userMeshes).flatMap(g => g.children), true);
    if (intersects.length > 0) {
        // sobe até o grupo pai que tem userData
        let obj = intersects[0].object;
        while (obj && !obj.userData.id) obj = obj.parent;
        if (obj && obj.userData.id) {
            const id = obj.userData.id;
            const nome = obj.userData.nome;
            editar(id, nome);
            // destaque visual
            destaqueMesh(obj);
        }
    }
}

function destaqueMesh(mesh) {
    // anima escala rápida
    const g = mesh.parent || mesh;
    const initial = g.scale.clone();
    const target = initial.clone().multiplyScalar(1.15);
    let t = 0;
    const dur = 18;
    function anim() {
        t++;
        const f = t / dur;
        g.scale.lerpVectors(initial, target, Math.sin(f * Math.PI));
        if (t < dur) requestAnimationFrame(anim);
        else g.scale.copy(initial);
    }
    anim();
}

function onWindowResize() {
    const container = document.getElementById("threeContainer");
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function animate() {
    requestAnimationFrame(animate);
    // rotação sutil dos grupos
    Object.values(userMeshes).forEach((g, i) => {
        g.rotation.y += 0.003 + (i % 3) * 0.0008;
    });
    controls.update();
    renderer.render(scene, camera);
}

// Inicializa Three quando a página carregar
if (document.getElementById("threeContainer")) {
    window.addEventListener("load", () => {
        initThree();
        // se já houver dados carregados, atualiza cena
        if (usuariosCache.length) atualizarCena3D(usuariosCache);
    });
}