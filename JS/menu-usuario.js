// Atualiza o link do cabeçalho de acordo com o acesso do usuário.
document.addEventListener("DOMContentLoaded", function () {
    const linkLogin = document.getElementById("login");

    if (!linkLogin || !window.ExploraZOAuth) return;

    const usuario = window.ExploraZOAuth.obterUsuario();

    if (usuario) {
        linkLogin.href = "perfil.html";
        linkLogin.innerHTML = '<i class="fa-regular fa-user"></i> Meu perfil';
    } else {
        linkLogin.href = "login.html";
        linkLogin.innerHTML = '<i class="fa-regular fa-user"></i> Login';

        // Ao clicar em Login, guardamos a página atual.
        // Depois de entrar, o usuário volta para ela.
        linkLogin.addEventListener("click", function () {
            const paginaAtual = decodeURIComponent(window.location.pathname.split("/").pop());

            // Se a página não estiver na lista permitida, o definirDestino ignora
            window.ExploraZOAuth.definirDestino(paginaAtual);
        });
    }
});
