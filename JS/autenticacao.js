// =====================================================================
// ExploraZOAuth - cadastro, login, sessão e perfil do usuário
//
// IMPORTANTE (limitação): o site ainda não tem servidor (backend).
// Tudo fica salvo no localStorage do navegador, então isto é uma
// DEMONSTRAÇÃO. Em um site real, o login e a senha ficam no servidor.
// =====================================================================
window.ExploraZOAuth = (function () {
    const CHAVE_USUARIOS = "explorazoUsuarios";
    const CHAVE_SESSAO = "explorazoSessao";
    const CHAVE_DESTINO = "redirecionarAposLogin";

    const paginasPermitidas = [
        "index.html",
        "sobre.html",
        "orçamento.html",
        "perfil.html"
    ];

    // ---------------------------------------------------------------
    // Funções auxiliares para ler e gravar a lista de usuários
    // ---------------------------------------------------------------
    function buscarUsuarios() {
        try {
            const usuarios = JSON.parse(
                localStorage.getItem(CHAVE_USUARIOS)
            );

            return Array.isArray(usuarios) ? usuarios : [];
        } catch (erro) {
            return [];
        }
    }

    function salvarUsuarios(usuarios) {
        try {
            localStorage.setItem(
                CHAVE_USUARIOS,
                JSON.stringify(usuarios)
            );
        } catch (erro) {
            // Acontece, por exemplo, quando a foto é grande demais para o localStorage
            throw new Error("Não foi possível salvar os dados neste navegador.");
        }
    }

    // Descobre qual posição da lista é o usuário que está logado.
    // Sempre usamos o "id" da sessão, assim ninguém mexe na conta de outra pessoa.
    function acharPosicaoDoLogado(usuarios, sessao) {
        return usuarios.findIndex(function (usuario) {
            return usuario && usuario.id === sessao.id;
        });
    }

    // ---------------------------------------------------------------
    // Proteção da senha (hash com salt)
    //
    // Em vez de guardar a senha, guardamos um "resumo" dela (hash SHA-256).
    // O "salt" é um texto aleatório que deixa o hash diferente para cada usuário.
    // Não dá para transformar o hash de volta na senha original.
    // ---------------------------------------------------------------
    function criarSalt() {
        const numeros = new Uint8Array(16);
        crypto.getRandomValues(numeros);

        return Array.from(numeros).map(function (numero) {
            return numero.toString(16).padStart(2, "0");
        }).join("");
    }

    // "async/await": o navegador calcula o hash com calma, então
    // usamos "await" para esperar o resultado ficar pronto.
    async function gerarHash(senha, salt) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("Este navegador não consegue proteger a senha. Abra o site pelo Live Server ou por HTTPS.");
        }

        const texto = new TextEncoder().encode(salt + senha);
        const resultado = await crypto.subtle.digest("SHA-256", texto);

        return Array.from(new Uint8Array(resultado)).map(function (numero) {
            return numero.toString(16).padStart(2, "0");
        }).join("");
    }

    // Confere se a senha digitada é a senha da conta.
    async function conferirSenha(usuario, senhaDigitada) {
        if (usuario.senhaHash) {
            const hashDigitado = await gerarHash(senhaDigitada, usuario.salt);
            return hashDigitado === usuario.senhaHash;
        }

        // Contas criadas antes desta versão guardavam a senha em texto puro.
        return usuario.senha === senhaDigitada;
    }

    // Troca a senha em texto puro (contas antigas) pelo hash.
    // Acontece sozinho no primeiro login depois da atualização.
    async function protegerSenhaAntiga(idDoUsuario, senhaDigitada) {
        const salt = criarSalt();
        const hash = await gerarHash(senhaDigitada, salt);

        const usuarios = buscarUsuarios();
        const posicao = usuarios.findIndex(function (usuario) {
            return usuario && usuario.id === idDoUsuario;
        });

        if (posicao === -1) return;

        usuarios[posicao].salt = salt;
        usuarios[posicao].senhaHash = hash;
        delete usuarios[posicao].senha;

        salvarUsuarios(usuarios);
    }

    // ---------------------------------------------------------------
    // Cadastro
    // ---------------------------------------------------------------
    async function cadastrarUsuario(dados) {
        const login = dados.login.trim();

        if (!/^[a-zA-Z]{6}$/.test(login)) {
            throw new Error("O login deve ter exatamente 6 letras.");
        }

        if ((dados.senha.match(/\p{L}/gu) || []).length < 8) {
            throw new Error("A senha deve ter no mínimo 8 letras.");
        }

        // Primeiro calculamos o hash...
        const salt = criarSalt();
        const senhaHash = await gerarHash(dados.senha, salt);

        // ...e só depois lemos a lista, para não gravar por cima de dados mais novos.
        const usuarios = buscarUsuarios();

        const existe = usuarios.some(function (usuario) {
            return usuario &&
                typeof usuario.login === "string" &&
                usuario.login.toLowerCase() === login.toLowerCase();
        });

        if (existe) {
            throw new Error("Esse login já está cadastrado.");
        }

        const usuario = {
            id: Date.now().toString(),
            nome: dados.nome.trim(),
            email: dados.email.trim().toLowerCase(),
            nascimento: dados.nascimento,
            sexo: dados.sexo,
            nomeMaterno: dados.nomeMaterno.trim(),
            cpf: dados.cpf.replace(/\D/g, ""),
            telefoneCelular: dados.telefoneCelular,
            telefoneFixo: dados.telefoneFixo,
            endereco: dados.endereco.trim(),
            login: login,
            salt: salt,
            senhaHash: senhaHash
        };

        usuarios.push(usuario);
        salvarUsuarios(usuarios);

        return {
            id: usuario.id,
            nome: usuario.nome,
            login: usuario.login,
            email: usuario.email
        };
    }

    // ---------------------------------------------------------------
    // Login e sessão
    // ---------------------------------------------------------------
    async function entrar(identificador, senha) {
        const usuarios = buscarUsuarios();
        const busca = identificador.trim().toLowerCase();

        const usuario = usuarios.find(function (item) {
            return item && (
                (
                    typeof item.email === "string" &&
                    item.email.trim().toLowerCase() === busca
                ) ||
                (
                    typeof item.login === "string" &&
                    item.login.trim().toLowerCase() === busca
                )
            );
        });

        if (!usuario || !(await conferirSenha(usuario, senha))) {
            throw new Error("E-mail, login ou senha incorretos.");
        }

        // Conta antiga com senha em texto puro: protege agora.
        if (!usuario.senhaHash) {
            try {
                await protegerSenhaAntiga(usuario.id, senha);
            } catch (erro) {
                // Se não der para proteger agora, o login continua funcionando.
            }
        }

        // A sessão guarda só o básico. A senha NUNCA vai para a sessão.
        const sessao = {
            id: usuario.id,
            nome: usuario.nome,
            login: usuario.login,
            email: usuario.email
        };

        localStorage.setItem(
            CHAVE_SESSAO,
            JSON.stringify(sessao)
        );

        return sessao;
    }

    function obterUsuario() {
        try {
            return JSON.parse(
                localStorage.getItem(CHAVE_SESSAO)
            );
        } catch (erro) {
            return null;
        }
    }

    function estaLogado() {
        return obterUsuario() !== null;
    }

    function sair() {
        localStorage.removeItem(CHAVE_SESSAO);
    }

    function definirDestino(destino) {
        if (paginasPermitidas.includes(destino)) {
            localStorage.setItem(CHAVE_DESTINO, destino);
        }
    }

    function obterDestino() {
        const destino = localStorage.getItem(CHAVE_DESTINO);

        localStorage.removeItem(CHAVE_DESTINO);

        if (paginasPermitidas.includes(destino)) {
            return destino;
        }

        return "index.html";
    }

    // ---------------------------------------------------------------
    // Perfil
    // ---------------------------------------------------------------

    // Contas criadas no cadastro guardam o endereço em um texto só, assim:
    // "CEP: 23000-000, Rua X, Nº 10, Apto 2, Bairro, Cidade/UF"
    // Esta função separa o texto em partes para o perfil poder editar cada uma.
    function separarEnderecoAntigo(texto) {
        const resultado = { cep: "", endereco: texto, bairro: "", cidade: "", estado: "" };
        const partes = texto.split(", ");

        // Se o texto não tem o formato do cadastro, deixamos tudo em "endereco"
        if (partes.length < 5 || partes[0].indexOf("CEP: ") !== 0) {
            return resultado;
        }

        const cidadeEEstado = partes[partes.length - 1];
        const posicaoBarra = cidadeEEstado.lastIndexOf("/");

        resultado.cep = partes[0].replace("CEP: ", "");
        resultado.bairro = partes[partes.length - 2];
        resultado.cidade = posicaoBarra >= 0 ? cidadeEEstado.slice(0, posicaoBarra) : cidadeEEstado;
        resultado.estado = posicaoBarra >= 0 ? cidadeEEstado.slice(posicaoBarra + 1) : "";
        resultado.endereco = partes.slice(1, partes.length - 2).join(", ");

        return resultado;
    }

    // Devolve os dados do usuário LOGADO (e só dele), sem senha, salt ou hash.
    function obterDadosCompletos() {
        const sessao = obterUsuario();

        if (!sessao) return null;

        const usuarios = buscarUsuarios();
        const posicao = acharPosicaoDoLogado(usuarios, sessao);

        if (posicao === -1) return null;

        const registro = usuarios[posicao];
        const dados = {};

        // Copia tudo, menos o que é segredo
        Object.keys(registro).forEach(function (campo) {
            if (campo !== "senha" && campo !== "senhaHash" && campo !== "salt") {
                dados[campo] = registro[campo];
            }
        });

        // Conta que ainda não separou o endereço em partes
        if (dados.cidade === undefined && typeof dados.endereco === "string") {
            const partes = separarEnderecoAntigo(dados.endereco);

            dados.cep = partes.cep;
            dados.endereco = partes.endereco;
            dados.bairro = partes.bairro;
            dados.cidade = partes.cidade;
            dados.estado = partes.estado;
        }

        // Valores padrão para quem nunca salvou preferências
        if (!dados.preferencias) {
            dados.preferencias = { notificacoes: false, novidadesEmail: false, interesses: [] };
        }

        return dados;
    }

    // Atualiza os dados pessoais do usuário logado.
    // Só altera os campos que forem enviados em "dados".
    function atualizarPerfil(dados) {
        const sessao = obterUsuario();

        if (!sessao) {
            throw new Error("Você precisa entrar na sua conta.");
        }

        const usuarios = buscarUsuarios();
        const posicao = acharPosicaoDoLogado(usuarios, sessao);

        if (posicao === -1) {
            throw new Error("Não foi possível encontrar sua conta.");
        }

        const nome = (dados.nome !== undefined ? dados.nome : usuarios[posicao].nome).trim();
        const email = (dados.email !== undefined ? dados.email : usuarios[posicao].email).trim().toLowerCase();

        if (!nome || !email) {
            throw new Error("Preencha seu nome e e-mail.");
        }

        const emailExiste = usuarios.some(function (usuario, i) {
            return i !== posicao &&
                usuario &&
                typeof usuario.email === "string" &&
                usuario.email.toLowerCase() === email;
        });

        if (emailExiste) {
            throw new Error("Esse e-mail já está sendo usado por outra conta.");
        }

        usuarios[posicao].nome = nome;
        usuarios[posicao].email = email;

        // Campos de texto opcionais: só mudam se vierem em "dados"
        const camposDeTexto = [
            "sobre", "telefoneCelular", "telefoneFixo",
            "endereco", "cep", "bairro", "cidade", "estado"
        ];

        camposDeTexto.forEach(function (campo) {
            if (dados[campo] !== undefined) {
                usuarios[posicao][campo] = String(dados[campo]).trim();
            }
        });

        // Foto de perfil (texto da imagem). Texto vazio = sem foto.
        if (dados.foto !== undefined) {
            usuarios[posicao].foto = dados.foto;
        }

        salvarUsuarios(usuarios);

        // A sessão também é atualizada, para o orçamento já usar o nome/e-mail novos
        const novaSessao = {
            id: usuarios[posicao].id,
            nome: usuarios[posicao].nome,
            login: usuarios[posicao].login,
            email: usuarios[posicao].email
        };

        localStorage.setItem(CHAVE_SESSAO, JSON.stringify(novaSessao));
        return novaSessao;
    }

    // Altera a senha do usuário logado (pede a senha atual antes).
    async function alterarSenha(senhaAtual, novaSenha) {
        const sessao = obterUsuario();

        if (!sessao) {
            throw new Error("Você precisa entrar na sua conta.");
        }

        let usuarios = buscarUsuarios();
        let posicao = acharPosicaoDoLogado(usuarios, sessao);

        if (posicao === -1) {
            throw new Error("Não foi possível encontrar sua conta.");
        }

        if (!(await conferirSenha(usuarios[posicao], senhaAtual))) {
            throw new Error("A senha atual está incorreta.");
        }

        if ((novaSenha.match(/\p{L}/gu) || []).length < 8) {
            throw new Error("A nova senha deve ter no mínimo 8 letras.");
        }

        if (novaSenha === senhaAtual) {
            throw new Error("A nova senha precisa ser diferente da atual.");
        }

        const salt = criarSalt();
        const hash = await gerarHash(novaSenha, salt);

        // Lemos a lista de novo, pois o "await" acima leva um tempinho
        usuarios = buscarUsuarios();
        posicao = acharPosicaoDoLogado(usuarios, sessao);

        if (posicao === -1) {
            throw new Error("Não foi possível encontrar sua conta.");
        }

        usuarios[posicao].salt = salt;
        usuarios[posicao].senhaHash = hash;
        delete usuarios[posicao].senha; // remove a senha em texto puro, se existir

        salvarUsuarios(usuarios);
    }

    // Salva as preferências do usuário logado.
    function salvarPreferencias(preferencias) {
        const sessao = obterUsuario();

        if (!sessao) {
            throw new Error("Você precisa entrar na sua conta.");
        }

        const usuarios = buscarUsuarios();
        const posicao = acharPosicaoDoLogado(usuarios, sessao);

        if (posicao === -1) {
            throw new Error("Não foi possível encontrar sua conta.");
        }

        usuarios[posicao].preferencias = {
            notificacoes: Boolean(preferencias.notificacoes),
            novidadesEmail: Boolean(preferencias.novidadesEmail),
            interesses: Array.isArray(preferencias.interesses) ? preferencias.interesses : []
        };

        salvarUsuarios(usuarios);
    }

    function obterSobreUsuario() {
        const sessao = obterUsuario();

        if (!sessao) return "";

        const usuarios = buscarUsuarios();
        const usuario = usuarios.find(function (item) {
            return item && item.id === sessao.id;
        });

        return usuario ? (usuario.sobre || "") : "";
    }

    return {
        cadastrarUsuario: cadastrarUsuario,
        entrar: entrar,
        obterUsuario: obterUsuario,
        obterDadosCompletos: obterDadosCompletos,
        atualizarPerfil: atualizarPerfil,
        alterarSenha: alterarSenha,
        salvarPreferencias: salvarPreferencias,
        obterSobreUsuario: obterSobreUsuario,
        estaLogado: estaLogado,
        sair: sair,
        definirDestino: definirDestino,
        obterDestino: obterDestino
    };
})();
