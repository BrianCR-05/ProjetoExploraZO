document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formCadastro");

    if (!form) return;

    form.noValidate = true;

    const campos = {
        nome: document.getElementById("nome"),
        email: document.getElementById("email"),
        nascimento: document.getElementById("nascimento"),
        nomeMaterno: document.getElementById("nomeMaterno"),
        cpf: document.getElementById("cpf"),
        celular: document.getElementById("telefone"),
        fixo: document.getElementById("telefoneFixo"),
        cep: document.getElementById("cep"),
        rua: document.getElementById("rua"),
        numero: document.getElementById("numero"),
        complemento: document.getElementById("complemento"),
        bairro: document.getElementById("bairro"),
        cidade: document.getElementById("cidade"),
        estado: document.getElementById("estado"),
        login: document.getElementById("loginUsuario"),
        senha: document.getElementById("senha"),
        confirmarSenha: document.getElementById("confirmarSenha"),
        termos: document.getElementById("termos")
    };

    function formatarCPF(valor) {
        return valor.replace(/\D/g, "").slice(0, 11)
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    }

    function formatarTelefone(campo, limite) {
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

    function mostrarErro(campo, mensagem) {
        const grupo = campo.closest(".campo-cadastro");
        const aviso = document.createElement("span");

        aviso.className = "erro";
        aviso.textContent = mensagem;

        grupo.appendChild(aviso);
    }

    campos.cpf.addEventListener("input", function () {
        campos.cpf.value = formatarCPF(campos.cpf.value);
    });

    campos.cep.addEventListener("input", function () {
        const numeros = campos.cep.value.replace(/\D/g, "").slice(0, 8);
        campos.cep.value = numeros.replace(/^(\d{5})(\d)/, "$1-$2");
    });

    campos.celular.addEventListener("input", function () {
        formatarTelefone(campos.celular, 11);
    });

    campos.fixo.addEventListener("input", function () {
        formatarTelefone(campos.fixo, 10);
    });

    const mostrarSenha = document.createElement("input");
    mostrarSenha.type = "checkbox";

    const legendaSenha = document.createElement("label");
    legendaSenha.append(mostrarSenha, " Mostrar senha");

    campos.confirmarSenha.insertAdjacentElement("afterend", legendaSenha);

    mostrarSenha.addEventListener("change", function () {
        const tipo = mostrarSenha.checked ? "text" : "password";

        campos.senha.type = tipo;
        campos.confirmarSenha.type = tipo;
    });

    form.addEventListener("input", function (evento) {
        const grupo = evento.target.closest(".campo-cadastro");
        const erro = grupo && grupo.querySelector(".erro");

        if (erro) erro.remove();
    });

    form.addEventListener("change", function (evento) {
        const grupo = evento.target.closest(".campo-cadastro");
        const erro = grupo && grupo.querySelector(".erro");

        if (erro) erro.remove();
    });

    // "async" porque o cadastro agora protege a senha (hash) e precisa esperar
    form.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        form.querySelectorAll(".erro, .mensagem-sucesso").forEach(function (item) {
            item.remove();
        });

        const genero = form.querySelector('input[name="genero"]:checked');

        const hoje = new Date();
        const dataAtual = [
            hoje.getFullYear(),
            String(hoje.getMonth() + 1).padStart(2, "0"),
            String(hoje.getDate()).padStart(2, "0")
        ].join("-");

        const regras = [
            [campos.nome, /^[\p{L}\s]{15,60}$/u.test(campos.nome.value.trim()), "Digite um nome entre 15 e 60 caracteres alfabéticos."],
            [campos.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.value.trim()), "Digite um e-mail válido."],
            [campos.nascimento, campos.nascimento.value !== "" && campos.nascimento.value <= dataAtual, "Informe uma data de nascimento válida."],
            [campos.nomeMaterno, campos.nomeMaterno.value.trim() !== "", "Informe o nome da mãe."],
            [campos.cpf, /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(campos.cpf.value), "Informe um CPF com 11 números."],
            [campos.celular, /^\(\d{2}\) \d{5}-\d{4}$/.test(campos.celular.value), "Confira o telefone celular."],
            [campos.fixo, /^\(\d{2}\) \d{4}-\d{4}$/.test(campos.fixo.value), "Confira o telefone fixo."],
            [campos.cep, /^\d{5}-\d{3}$/.test(campos.cep.value), "Digite um CEP válido."],
            [campos.rua, campos.rua.value.trim() !== "", "Informe a rua ou avenida."],
            [campos.numero, campos.numero.value.trim() !== "", "Informe o número."],
            [campos.bairro, campos.bairro.value.trim() !== "", "Informe o bairro."],
            [campos.cidade, campos.cidade.value.trim() !== "", "Informe a cidade."],
            [campos.estado, /^[A-Za-z]{2}$/.test(campos.estado.value.trim()), "Informe a sigla do estado com duas letras."],
            [campos.login, /^[A-Za-z]{6}$/.test(campos.login.value.trim()), "O login deve ter exatamente 6 letras."],
            [campos.senha, (campos.senha.value.match(/\p{L}/gu) || []).length >= 8, "A senha deve ter no mínimo 8 letras."],
            [campos.confirmarSenha, campos.confirmarSenha.value === campos.senha.value, "As senhas não são iguais."],
            [form.querySelector('input[name="genero"]'), Boolean(genero), "Selecione uma opção de sexo."],
            [campos.termos, campos.termos.checked, "Aceite os termos e condições."]
        ];

        const erros = regras.filter(function (regra) {
            return !regra[1];
        });

        erros.forEach(function (regra) {
            mostrarErro(regra[0], regra[2]);
        });

        if (erros.length > 0) {
            erros[0][0].focus();
            return;
        }

        if (!window.ExploraZOAuth) {
            mostrarErro(campos.login, "A autenticação não foi carregada.");
            return;
        }

        const endereco = [
            "CEP: " + campos.cep.value,
            campos.rua.value.trim(),
            "Nº " + campos.numero.value.trim(),
            campos.complemento.value.trim(),
            campos.bairro.value.trim(),
            campos.cidade.value.trim() + "/" + campos.estado.value.trim().toUpperCase()
        ].filter(Boolean).join(", ");

        const dados = {
            nome: campos.nome.value.trim(),
            email: campos.email.value.trim(),
            nascimento: campos.nascimento.value,
            sexo: genero.value,
            nomeMaterno: campos.nomeMaterno.value.trim(),
            cpf: campos.cpf.value,
            telefoneCelular: campos.celular.value,
            telefoneFixo: campos.fixo.value,
            endereco: endereco,
            login: campos.login.value.trim(),
            senha: campos.senha.value
        };

        try {
            await window.ExploraZOAuth.cadastrarUsuario(dados);

            const mensagem = document.createElement("p");
            mensagem.className = "mensagem-sucesso";
            mensagem.textContent = "Cadastro realizado com sucesso! Redirecionando para o login.";

            form.appendChild(mensagem);

            const botao = form.querySelector('button[type="submit"]');

            if (botao) botao.disabled = true;

            setTimeout(function () {
                window.location.href = "login.html";
            }, 1500);

        } catch (erro) {
            mostrarErro(campos.login, erro.message);
        }
    });
});