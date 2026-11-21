const estaAutenticado = window.ExploraZOAuth.estaLogado();

if (!estaAutenticado) {
    window.ExploraZOAuth.definirDestino("perfil.html");
    window.location.replace("login.html");
}

document.addEventListener("DOMContentLoaded", function () {
    if (!estaAutenticado) return;

    // Dados completos do usuário logado (nunca incluem a senha)
    let dadosUsuario = window.ExploraZOAuth.obterDadosCompletos();

    if (dadosUsuario === null) {
        window.ExploraZOAuth.sair();
        window.location.replace("login.html");
        return;
    }

    let fotoEmEdicao = dadosUsuario.foto || "";

    // Elementos do topo
    const topoNome = document.getElementById("topo-nome");
    const topoLogin = document.getElementById("topo-login");
    const topoEmail = document.getElementById("topo-email");
    const topoSobre = document.getElementById("topo-sobre");
    const topoFotoImagem = document.getElementById("topo-foto-imagem");
    const topoFotoIcone = document.getElementById("topo-foto-icone");

    // Elementos de dados pessoais
    const formDados = document.getElementById("form-dados");
    const campoNome = document.getElementById("campo-nome");
    const campoEmail = document.getElementById("campo-email");
    const campoCelular = document.getElementById("campo-celular");
    const campoFixo = document.getElementById("campo-fixo");
    const campoCep = document.getElementById("campo-cep");
    const campoEndereco = document.getElementById("campo-endereco");
    const campoBairro = document.getElementById("campo-bairro");
    const campoCidade = document.getElementById("campo-cidade");
    const campoEstado = document.getElementById("campo-estado");
    const campoSobre = document.getElementById("campo-sobre");
    const contadorSobre = document.getElementById("contador-sobre");
    const mensagemDados = document.getElementById("mensagem-dados");

    // Elementos da foto no editor
    const campoFoto = document.getElementById("campo-foto");
    const editorFotoImagem = document.getElementById("editor-foto-imagem");
    const editorFotoIcone = document.getElementById("editor-foto-icone");

    // Elementos de segurança
    const formSenha = document.getElementById("form-senha");
    const campoSenhaAtual = document.getElementById("campo-senha-atual");
    const campoSenhaNova = document.getElementById("campo-senha-nova");
    const campoSenhaConfirmar = document.getElementById("campo-senha-confirmar");
    const caixaMostrarSenhas = document.getElementById("mostrar-senhas");
    const mensagemSenha = document.getElementById("mensagem-senha");

    // Elementos de preferências
    const formPreferencias = document.getElementById("form-preferencias");
    const prefNotificacoes = document.getElementById("pref-notificacoes");
    const prefNovidades = document.getElementById("pref-novidades");
    const caixasInteresses = document.querySelectorAll('input[name="interesse"]');
    const radioTemaClaro = document.getElementById("tema-claro");
    const radioTemaEscuro = document.getElementById("tema-escuro");
    const mensagemPreferencias = document.getElementById("mensagem-preferencias");

    // Mensagens e erros de validação
    function mostrarMensagem(caixa, texto, tipo) {
        caixa.textContent = texto;
        caixa.classList.remove("perfil-mensagem-ok", "perfil-mensagem-erro");
        caixa.classList.add(tipo === "ok" ? "perfil-mensagem-ok" : "perfil-mensagem-erro");
    }

    function limparMensagem(caixa) {
        caixa.textContent = "";
        caixa.classList.remove("perfil-mensagem-ok", "perfil-mensagem-erro");
    }

    function mostrarErroNoCampo(campo, texto) {
        const aviso = document.createElement("span");
        aviso.className = "erro";
        aviso.textContent = texto;
        campo.closest(".perfil-campo").appendChild(aviso);
    }

    function limparErrosDoFormulario(formulario) {
        formulario.querySelectorAll(".erro").forEach(function (aviso) {
            aviso.remove();
        });
    }

    function validarRegras(regras) {
        const erros = regras.filter(function (regra) {
            return !regra[1];
        });

        erros.forEach(function (regra) {
            mostrarErroNoCampo(regra[0], regra[2]);
        });

        if (erros.length > 0) {
            erros[0][0].focus();
            return false;
        }
        return true;
    }

    [formDados, formSenha].forEach(function (formulario) {
        formulario.addEventListener("input", function (evento) {
            const grupo = evento.target.closest(".perfil-campo");
            const erro = grupo && grupo.querySelector(".erro");
            if (erro) erro.remove();
        });
    });

    // Formatação e leitura de dados
    function textoOuNaoInformado(valor) {
        return valor ? valor : "Não informado";
    }

    function formatarData(dataISO) {
        return dataISO ? dataISO.split("-").reverse().join("/") : "Não informado";
    }

    function esconderCpf(cpf) {
        const numeros = (cpf || "").replace(/\D/g, "");
        if (numeros.length !== 11) return "Não informado";
        return "•••.•••.•••-" + numeros.slice(9);
    }

    function montarEnderecoCompleto(dados) {
        let cidadeEstado = dados.cidade || dados.estado || "";
        if (dados.cidade && dados.estado) {
            cidadeEstado = dados.cidade + "/" + dados.estado;
        }

        return [
            dados.endereco,
            dados.bairro,
            cidadeEstado,
            dados.cep ? "CEP " + dados.cep : ""
        ].filter(Boolean).join(", ");
    }

    function contarSolicitacoes() {
        try {
            const sessao = window.ExploraZOAuth.obterUsuario();
            const meuId = sessao?.login || sessao?.email || sessao?.id;
            const pedidos = JSON.parse(localStorage.getItem("explorazoSolicitacoes") || "[]");

            if (!Array.isArray(pedidos) || !meuId) return 0;

            return pedidos.filter(function (pedido) {
                return pedido && pedido.usuarioId === meuId;
            }).length;
        } catch (erro) {
            return 0;
        }
    }

    // Foto de perfil
    function mostrarFoto(imagem, icone, foto) {
        if (foto && foto.indexOf("data:image/") === 0) {
            imagem.src = foto;
            imagem.hidden = false;
            icone.hidden = true;
        } else {
            imagem.removeAttribute("src");
            imagem.hidden = true;
            icone.hidden = false;
        }
    }

    function reduzirFoto(arquivo, aoTerminar, aoFalhar) {
        const leitor = new FileReader();

        leitor.onload = function () {
            const imagem = new Image();

            imagem.onload = function () {
                const tamanhoMaximo = 300;
                const proporcao = Math.min(1, tamanhoMaximo / Math.max(imagem.width, imagem.height));
                const canvas = document.createElement("canvas");

                canvas.width = Math.round(imagem.width * proporcao);
                canvas.height = Math.round(imagem.height * proporcao);

                const desenho = canvas.getContext("2d");
                desenho.fillStyle = "#ffffff";
                desenho.fillRect(0, 0, canvas.width, canvas.height);
                desenho.drawImage(imagem, 0, 0, canvas.width, canvas.height);

                aoTerminar(canvas.toDataURL("image/jpeg", 0.8));
            };

            imagem.onerror = aoFalhar;
            imagem.src = leitor.result;
        };

        leitor.onerror = aoFalhar;
        leitor.readAsDataURL(arquivo);
    }

    // Máscaras de campos
    function aplicarMascaraTelefone(campo, limite) {
        const numeros = campo.value.replace(/\D/g, "").slice(0, limite);
        if (!numeros) {
            campo.value = "";
            return;
        }
        if (numeros.length <= 2) {
            campo.value = "(" + numeros;
            return;
        }
        const divisao = limite === 11 ? 7 : 6;
        campo.value = "(" + numeros.slice(0, 2) + ") " +
            numeros.slice(2, divisao) +
            (numeros.length > divisao ? "-" + numeros.slice(divisao) : "");
    }

    campoCelular.addEventListener("input", function () {
        aplicarMascaraTelefone(campoCelular, 11);
    });

    campoFixo.addEventListener("input", function () {
        aplicarMascaraTelefone(campoFixo, 10);
    });

    campoCep.addEventListener("input", function () {
        const numeros = campoCep.value.replace(/\D/g, "").slice(0, 8);
        campoCep.value = numeros.replace(/^(\d{5})(\d)/, "$1-$2");
    });

    campoEstado.addEventListener("input", function () {
        campoEstado.value = campoEstado.value.replace(/[^A-Za-z]/g, "").toUpperCase();
    });

    function atualizarContador() {
        contadorSobre.textContent = campoSobre.value.length + "/300";
    }

    campoSobre.addEventListener("input", atualizarContador);

    // Preenchimento da tela
    function preencherTopo() {
        topoNome.textContent = dadosUsuario.nome;
        topoLogin.textContent = "@" + dadosUsuario.login;
        topoEmail.textContent = dadosUsuario.email;
        topoSobre.textContent = dadosUsuario.sobre || "Você ainda não escreveu uma descrição sobre você.";
        mostrarFoto(topoFotoImagem, topoFotoIcone, dadosUsuario.foto);
    }

    function preencherResumo() {
        const preferencias = dadosUsuario.preferencias;
        const quantidade = contarSolicitacoes();

        document.getElementById("conta-nome").textContent = dadosUsuario.nome;
        document.getElementById("conta-email").textContent = dadosUsuario.email;
        document.getElementById("conta-login").textContent = dadosUsuario.login;
        document.getElementById("conta-nascimento").textContent = formatarData(dadosUsuario.nascimento);
        document.getElementById("conta-sexo").textContent = textoOuNaoInformado(dadosUsuario.sexo);
        document.getElementById("conta-cpf").textContent = esconderCpf(dadosUsuario.cpf);
        document.getElementById("conta-mae").textContent = textoOuNaoInformado(dadosUsuario.nomeMaterno);
        document.getElementById("conta-celular").textContent = textoOuNaoInformado(dadosUsuario.telefoneCelular);
        document.getElementById("conta-fixo").textContent = textoOuNaoInformado(dadosUsuario.telefoneFixo);
        document.getElementById("conta-endereco").textContent = textoOuNaoInformado(montarEnderecoCompleto(dadosUsuario));
        document.getElementById("conta-sobre").textContent = textoOuNaoInformado(dadosUsuario.sobre);
        document.getElementById("conta-notificacoes").textContent = preferencias.notificacoes ? "Ativadas" : "Desativadas";
        document.getElementById("conta-novidades").textContent = preferencias.novidadesEmail ? "Sim" : "Não";
        document.getElementById("conta-interesses").textContent = preferencias.interesses.length > 0
            ? preferencias.interesses.join(", ")
            : "Nenhum selecionado";

        document.getElementById("conta-solicitacoes").textContent = quantidade === 0
            ? "Nenhuma solicitação feita ainda"
            : quantidade === 1
                ? "1 solicitação feita"
                : quantidade + " solicitações feitas";
    }

    function preencherFormularioDados() {
        campoNome.value = dadosUsuario.nome || "";
        campoEmail.value = dadosUsuario.email || "";
        campoCelular.value = dadosUsuario.telefoneCelular || "";
        campoFixo.value = dadosUsuario.telefoneFixo || "";
        campoCep.value = dadosUsuario.cep || "";
        campoEndereco.value = dadosUsuario.endereco || "";
        campoBairro.value = dadosUsuario.bairro || "";
        campoCidade.value = dadosUsuario.cidade || "";
        campoEstado.value = dadosUsuario.estado || "";
        campoSobre.value = dadosUsuario.sobre || "";

        fotoEmEdicao = dadosUsuario.foto || "";
        mostrarFoto(editorFotoImagem, editorFotoIcone, fotoEmEdicao);

        campoFoto.value = "";
        atualizarContador();
        limparErrosDoFormulario(formDados);
        limparMensagem(mensagemDados);
    }

    function preencherPreferencias() {
        const preferencias = dadosUsuario.preferencias;
        prefNotificacoes.checked = preferencias.notificacoes;
        prefNovidades.checked = preferencias.novidadesEmail;

        caixasInteresses.forEach(function (caixa) {
            caixa.checked = preferencias.interesses.indexOf(caixa.value) !== -1;
        });
    }

    // Navegação por abas
    const botoesAbas = document.querySelectorAll(".perfil-aba");
    const paineis = document.querySelectorAll(".perfil-painel");

    function abrirAba(nomeDaAba) {
        botoesAbas.forEach(function (botao) {
            const ehAtiva = botao.dataset.aba === nomeDaAba;
            botao.classList.toggle("perfil-aba-ativa", ehAtiva);
            botao.setAttribute("aria-selected", ehAtiva ? "true" : "false");
        });

        paineis.forEach(function (painel) {
            painel.hidden = painel.id !== "aba-" + nomeDaAba;
        });

        if (nomeDaAba === "preferencias") {
            sincronizarTema();
        }
    }

    botoesAbas.forEach(function (botao) {
        botao.addEventListener("click", function () {
            abrirAba(botao.dataset.aba);
        });
    });

    document.getElementById("botao-editar").addEventListener("click", function () {
        abrirAba("dados");
        campoNome.focus();
    });

    // Foto, salvar e cancelar dados pessoais
    document.getElementById("botao-escolher-foto").addEventListener("click", function () {
        campoFoto.click();
    });

    campoFoto.addEventListener("change", function () {
        const arquivo = campoFoto.files[0];
        if (!arquivo) return;

        if (arquivo.type.indexOf("image/") !== 0) {
            mostrarMensagem(mensagemDados, "Escolha um arquivo de imagem (JPG ou PNG).", "erro");
            campoFoto.value = "";
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            mostrarMensagem(mensagemDados, "A imagem é muito grande. Escolha uma de até 5 MB.", "erro");
            campoFoto.value = "";
            return;
        }

        reduzirFoto(
            arquivo,
            function (fotoPronta) {
                fotoEmEdicao = fotoPronta;
                mostrarFoto(editorFotoImagem, editorFotoIcone, fotoEmEdicao);
                mostrarMensagem(mensagemDados, "Foto escolhida! Clique em Salvar alterações para guardar.", "ok");
            },
            function () {
                mostrarMensagem(mensagemDados, "Não foi possível ler essa imagem.", "erro");
            }
        );

        campoFoto.value = "";
    });

    document.getElementById("botao-remover-foto").addEventListener("click", function () {
        fotoEmEdicao = "";
        mostrarFoto(editorFotoImagem, editorFotoIcone, "");
        mostrarMensagem(mensagemDados, "Foto removida. Clique em Salvar alterações para confirmar.", "ok");
    });

    formDados.addEventListener("submit", function (evento) {
        evento.preventDefault();
        limparErrosDoFormulario(formDados);
        limparMensagem(mensagemDados);

        const regras = [
            [campoNome, /^[\p{L}\s]{15,60}$/u.test(campoNome.value.trim()), "Digite um nome entre 15 e 60 caracteres alfabéticos."],
            [campoEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value.trim()), "Digite um e-mail válido."],
            [campoCelular, /^\(\d{2}\) \d{5}-\d{4}$/.test(campoCelular.value), "Confira o telefone celular."],
            [campoFixo, /^\(\d{2}\) \d{4}-\d{4}$/.test(campoFixo.value), "Confira o telefone fixo."],
            [campoCep, /^\d{5}-\d{3}$/.test(campoCep.value), "Digite um CEP válido."],
            [campoEndereco, campoEndereco.value.trim() !== "", "Informe a rua, o número e o complemento."],
            [campoBairro, campoBairro.value.trim() !== "", "Informe o bairro."],
            [campoCidade, campoCidade.value.trim() !== "", "Informe a cidade."],
            [campoEstado, /^[A-Za-z]{2}$/.test(campoEstado.value.trim()), "Informe a sigla do estado com duas letras."]
        ];

        if (!validarRegras(regras)) {
            mostrarMensagem(mensagemDados, "Confira os campos indicados em vermelho.", "erro");
            return;
        }

        try {
            window.ExploraZOAuth.atualizarPerfil({
                nome: campoNome.value,
                email: campoEmail.value,
                telefoneCelular: campoCelular.value,
                telefoneFixo: campoFixo.value,
                cep: campoCep.value,
                endereco: campoEndereco.value,
                bairro: campoBairro.value,
                cidade: campoCidade.value,
                estado: campoEstado.value.toUpperCase(),
                sobre: campoSobre.value,
                foto: fotoEmEdicao
            });

            dadosUsuario = window.ExploraZOAuth.obterDadosCompletos();
            preencherTopo();
            preencherResumo();
            preencherFormularioDados();
            mostrarMensagem(mensagemDados, "Dados salvos com sucesso!", "ok");
        } catch (erro) {
            mostrarMensagem(mensagemDados, erro.message, "erro");
        }
    });

    document.getElementById("botao-cancelar").addEventListener("click", function () {
        preencherFormularioDados();
        mostrarMensagem(mensagemDados, "Alterações canceladas.", "ok");
    });

    // Segurança e troca de senha
    caixaMostrarSenhas.addEventListener("change", function () {
        const tipo = caixaMostrarSenhas.checked ? "text" : "password";
        campoSenhaAtual.type = tipo;
        campoSenhaNova.type = tipo;
        campoSenhaConfirmar.type = tipo;
    });

    formSenha.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        limparErrosDoFormulario(formSenha);
        limparMensagem(mensagemSenha);

        const senhaAtual = campoSenhaAtual.value;
        const senhaNova = campoSenhaNova.value;
        const senhaConfirmada = campoSenhaConfirmar.value;

        const regras = [
            [campoSenhaAtual, senhaAtual !== "", "Digite sua senha atual."],
            [campoSenhaNova, (senhaNova.match(/\p{L}/gu) || []).length >= 8, "A nova senha deve ter no mínimo 8 letras."],
            [campoSenhaConfirmar, senhaConfirmada === senhaNova, "As senhas não são iguais."]
        ];

        if (!validarRegras(regras)) {
            mostrarMensagem(mensagemSenha, "Confira os campos indicados em vermelho.", "erro");
            return;
        }

        const botaoEnviar = formSenha.querySelector('button[type="submit"]');
        botaoEnviar.disabled = true;

        try {
            await window.ExploraZOAuth.alterarSenha(senhaAtual, senhaNova);
            formSenha.reset();
            mostrarMensagem(mensagemSenha, "Senha alterada com sucesso!", "ok");
        } catch (erro) {
            mostrarMensagem(mensagemSenha, erro.message, "erro");
        } finally {
            botaoEnviar.disabled = false;
        }
    });

    // Preferências e tema
    formPreferencias.addEventListener("submit", function (evento) {
        evento.preventDefault();
        limparMensagem(mensagemPreferencias);

        const interessesMarcados = Array.from(caixasInteresses)
            .filter(function (caixa) {
                return caixa.checked;
            })
            .map(function (caixa) {
                return caixa.value;
            });

        try {
            window.ExploraZOAuth.salvarPreferencias({
                notificacoes: prefNotificacoes.checked,
                novidadesEmail: prefNovidades.checked,
                interesses: interessesMarcados
            });

            dadosUsuario = window.ExploraZOAuth.obterDadosCompletos();
            preencherResumo();
            mostrarMensagem(mensagemPreferencias, "Preferências salvas com sucesso!", "ok");
        } catch (erro) {
            mostrarMensagem(mensagemPreferencias, erro.message, "erro");
        }
    });

    function sincronizarTema() {
        const estaEscuro = document.documentElement.classList.contains("modo-escuro");
        radioTemaEscuro.checked = estaEscuro;
        radioTemaClaro.checked = !estaEscuro;
    }

    function aoEscolherTema(evento) {
        const querEscuro = evento.target.value === "escuro";
        const estaEscuro = document.documentElement.classList.contains("modo-escuro");
        const botaoTema = document.getElementById("botao-tema");

        if (querEscuro !== estaEscuro && botaoTema) {
            botaoTema.click();
        }
    }

    radioTemaClaro.addEventListener("change", aoEscolherTema);
    radioTemaEscuro.addEventListener("change", aoEscolherTema);

    const botaoTemaCabecalho = document.getElementById("botao-tema");
    if (botaoTemaCabecalho) {
        botaoTemaCabecalho.addEventListener("click", sincronizarTema);
    }

    // Sair da conta
    document.getElementById("botao-sair").addEventListener("click", function () {
        if (confirm("Deseja realmente sair da sua conta?")) {
            window.ExploraZOAuth.sair();
            window.location.href = "index.html";
        }
    });

    // Inicialização
    preencherTopo();
    preencherResumo();
    preencherFormularioDados();
    preencherPreferencias();
    sincronizarTema();
});