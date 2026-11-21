
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#loginmain form");

    if (!form) return;

    const identificador = document.getElementById("email");
    const senha = document.getElementById("senha");

    form.noValidate = true;

    function limparErro(campo) {
        const aviso = campo.nextElementSibling;

        if (aviso && aviso.classList.contains("erro")) {
            aviso.remove();
        }
    }

    function mostrarErro(campo, mensagem) {
        limparErro(campo);

        const aviso = document.createElement("span");
        aviso.className = "erro";
        aviso.setAttribute("role", "alert");
        aviso.textContent = mensagem;

        campo.insertAdjacentElement("afterend", aviso);
    }

    function removerSucesso() {
        const mensagem = document.getElementById("login-sucesso");

        if (mensagem) mensagem.remove();
    }

    const rotulo = document.createElement("label");
    rotulo.setAttribute("for", "mostrar-senha");
    rotulo.style.cssText = "display:block;margin-top:6px;font-size:14px;cursor:pointer;color:#003A1C;";

    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.id = "mostrar-senha";
    caixa.style.marginRight = "6px";

    rotulo.appendChild(caixa);
    rotulo.appendChild(document.createTextNode("Mostrar senha"));

    senha.insertAdjacentElement("afterend", rotulo);

    caixa.addEventListener("change", function () {
        senha.type = caixa.checked ? "text" : "password";
    });

    identificador.addEventListener("input", function () {
        limparErro(identificador);
    });

    senha.addEventListener("input", function () {
        limparErro(senha);
    });

    // "async" porque o login agora confere a senha protegida (hash) e precisa esperar
    form.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        removerSucesso();
        limparErro(identificador);
        limparErro(senha);

        const valor = identificador.value.trim();

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
        const loginValido = /^[A-Za-z]{6}$/.test(valor);

        if (!emailValido && !loginValido) {
            mostrarErro(identificador, "Digite um e-mail válido ou um login com exatamente 6 letras.");
            identificador.focus();
            return;
        }

        if ((senha.value.match(/\p{L}/gu) || []).length < 8) {
            mostrarErro(senha, "A senha deve ter no mínimo 8 letras.");
            senha.focus();
            return;
        }

        if (!window.ExploraZOAuth) {
            mostrarErro(identificador, "O sistema de autenticação não foi carregado.");
            return;
        }

        try {
            await window.ExploraZOAuth.entrar(valor, senha.value);

            const sucesso = document.createElement("div");
            sucesso.id = "login-sucesso";
            sucesso.setAttribute("role", "status");
            sucesso.style.cssText = "margin:12px auto;padding:12px 16px;max-width:420px;border-radius:8px;background:#eef7ef;border:1px solid #6fd58c;color:#1f5c2f;font-weight:600;";
            sucesso.textContent = "Login realizado com sucesso! Redirecionando...";

            form.appendChild(sucesso);

            const botao = form.querySelector('button[type="submit"]');

            if (botao) botao.disabled = true;

            const destino = window.ExploraZOAuth.obterDestino();

            setTimeout(function () {
                window.location.href = destino;
            }, 1200);

        } catch (erro) {
            mostrarErro(identificador, erro.message);
        }
    });
});
