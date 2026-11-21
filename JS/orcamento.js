
document.addEventListener("DOMContentLoaded", () => {

    const secao = document.getElementById("destinos");
    const form = document.querySelector("#orcamento form");

    if (!secao || !form) return;

    const destino = document.getElementById("destino");
    const data = document.getElementById("data");
    const chave = "explorazoSolicitacoes";
    const usuario = window.ExploraZOAuth?.obterUsuario?.() || null;

    const trilhas = [
        ["Pedra do Telégrafo", "imagens/telegrafo.jpg", "Barra de Guaratiba, Rio de Janeiro", "Mirante conhecido pela vista da região de Barra de Guaratiba.", 2, "Moderada (indicativa)"],
        ["Parque Estadual da Pedra Branca", "imagens/trilha do mirante.jpeg", "Parque Estadual da Pedra Branca, Rio de Janeiro", "Área natural com diferentes trilhas e pontos de visitação. A dificuldade varia conforme o percurso.", 0, "Varia conforme a trilha"],
        ["Cachoeira do Mendanha", "imagens/cachoeiramendanha.jpg", "Cachoeira do Mendanha, Campo Grande, Rio de Janeiro", "Passeio em meio à vegetação do Maciço do Mendanha.", 2, "Moderada (indicativa)"],
        ["Mirante do Caeté", "imagens/caete.jpg", "Mirante do Caeté, Prainha, Rio de Janeiro", "Mirante no Parque Natural Municipal da Prainha, com vista para a orla.", 1, "Leve (indicativa)"],
        ["Pedra da Tartaruga", "imagens/tortuga.jpg", "Pedra da Tartaruga, Grumari, Rio de Janeiro", "Formação rochosa na região de Grumari, com paisagens naturais.", 2, "Moderada (indicativa)"],
        ["Açude do Camorim", "imagens/vale secreto.jpg", "Açude do Camorim, Rio de Janeiro", "Ponto de visitação cercado pela floresta do Parque Estadual da Pedra Branca.", 0, "A confirmar com guia"],
        ["Praia do Perigoso", "imagens/praia-do-perigoso.jpg", "Praia do Perigoso, Barra de Guaratiba, Rio de Janeiro", "Praia de acesso por caminhada na região das praias selvagens.", 2, "Moderada (indicativa)"],
        ["Pico da Pedra Branca", "imagens/pedragavea.webp", "Pico da Pedra Branca, Rio de Janeiro", "Percurso de montanha no Maciço da Pedra Branca.", 3, "Difícil (indicativa)"],
        ["Pedra do Pontal", "imagens/doisirmaos.webp", "Pedra do Pontal, Recreio dos Bandeirantes, Rio de Janeiro", "Ponto rochoso entre as praias do Recreio, conhecido pela vista costeira.", 0, "A confirmar com guia"],
        ["Pedra do Quilombo", "imagens/trilha do mirante.jpeg", "Pedra do Quilombo, Rio de Janeiro", "Destino de caminhada no Maciço da Pedra Branca.", 3, "Difícil (indicativa)"],
        ["Pedra do Ponto", "imagens/pedradoponto.jpg", "Pedra do Ponto, Campo Grande, Rio de Janeiro", "Trilha em área de relevo elevado na Zona Oeste.", 3, "Difícil (indicativa)"]
    ].map(([nome, imagem, mapa, descricao, nivel, dificuldade]) =>
        ({ nome, imagem, mapa, descricao, nivel, dificuldade })
    );

    // Estimativas de duração e distância para os cards (podem variar conforme o trajeto).
    const percursos = {
        "Pedra do Telégrafo": [1, "Fácil", "1h30", "3 km"],
        "Parque Estadual da Pedra Branca": [2, "Moderada", "2h30", "5 km"],
        "Cachoeira do Mendanha": [2, "Moderada", "2h", "4 km"],
        "Mirante do Caeté": [1, "Fácil", "45 min", "1,5 km"],
        "Pedra da Tartaruga": [2, "Moderada", "1h40", "3 km"],
        "Açude do Camorim": [2, "Moderada", "2h30", "5,5 km"],
        "Praia do Perigoso": [2, "Moderada", "1h30", "3 km"],
        "Pico da Pedra Branca": [4, "Muito difícil", "5h", "9 km"],
        "Pedra do Pontal": [2, "Moderada", "1h10", "1,5 km"],
        "Pedra do Quilombo": [3, "Difícil", "3h30", "6 km"],
        "Pedra do Ponto": [3, "Difícil", "3h", "5 km"]
    };
    trilhas.forEach(t => {
        [t.nivel, t.dificuldade, t.tempo, t.distancia] = percursos[t.nome];
    });

    const servicos = {
        "Guias de trilha": ["Guia de trilha", "Orientação durante o percurso e informações sobre a trilha."],
        "Consultoria de passeios": ["Consultoria para escolher o passeio", "Ajuda para comparar destinos e planejar um roteiro."],
        "Registro fotográfico": ["Registro fotográfico", "Possibilidade de registrar momentos do passeio."],
        "Agências de turismo": ["Agência de turismo", "Opções de roteiros organizados por empresas parceiras."]
    };

    const estilo = document.createElement("style");

    estilo.textContent = `
        #destinos .trilhas-carrossel{display:flex!important;align-items:center;gap:12px;width:100%}
        #destinos .trilhas-janela{flex:1;min-width:0;overflow:hidden}
        #destinos .lista-destinos{display:flex!important;flex-wrap:nowrap!important;gap:16px;width:100%;transition:transform .35s}
        #destinos .card-destino{flex:0 0 calc((100% - 32px)/3)!important;width:calc((100% - 32px)/3)!important;min-width:0;margin:0;text-align:left;cursor:pointer}
        #destinos .seta-trilhas{position:static!important;flex:0 0 42px;width:42px;height:42px;border:0;border-radius:50%;background:#286344;color:white;font-size:25px;cursor:pointer}
        #destinos .seta-trilhas:disabled{opacity:.35;cursor:default}

        .modal-trilha{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:15px;background:#000b}
        .modal-trilha[hidden]{display:none!important}
        .modal-trilha .modal-caixa{position:relative;width:100%;max-width:650px;max-height:90vh;overflow-y:auto;padding:28px;border-radius:18px;background:white;color:#333}
        .modal-trilha .modal-fechar{position:absolute;top:12px;right:18px;border:0;background:none;font-size:30px;cursor:pointer}
        .modal-trilha h3{margin:0 35px 18px 0;color:#286344;font-size:24px}
        .modal-trilha .modal-trilha-foto{width:100%;height:250px;object-fit:cover;border-radius:12px}
        .modal-trilha .descricao-trilha{margin:18px 0;line-height:1.7;color:#555}
        .modal-trilha .dificuldade-trilha{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:15px;border-radius:10px;background:#f1f6f2}

        .modal-trilha .bolinhas-trilha{font-size:20px;letter-spacing:3px}
        .modal-trilha .dificuldade-leve .bolinhas-trilha{color:#198754}
        .modal-trilha .dificuldade-moderada .bolinhas-trilha{color:#d69e00}
        .modal-trilha .dificuldade-dificil .bolinhas-trilha{color:#dc3545}
        .modal-trilha .dificuldade-sem-classificacao .bolinhas-trilha{color:#888888}

        .modal-trilha .nota-dificuldade{color:#777;font-size:13px;line-height:1.5}
        .modal-trilha .mapa-trilha{width:100%;height:240px;border-radius:12px;margin:12px 0;overflow:hidden}
        .modal-trilha .mapa-trilha iframe{width:100%;height:100%;border:0;border-radius:12px}
        .modal-trilha .link-mapa{display:inline-block;margin:0 0 15px;color:#286344;font-weight:bold}
        .modal-trilha .escolher-trilha{width:100%;padding:14px;border:0;border-radius:10px;background:#286344;color:white;font-weight:bold;cursor:pointer}

        @media(max-width:800px){#destinos .card-destino{flex-basis:calc((100% - 16px)/2)!important;width:calc((100% - 16px)/2)!important}}
        @media(max-width:560px){#destinos .card-destino{flex-basis:100%!important;width:100%!important}#destinos .seta-trilhas{flex-basis:34px;width:34px;height:34px}.modal-trilha .modal-caixa{padding:20px}.modal-trilha .modal-trilha-foto{height:190px}}
    `;

    document.head.appendChild(estilo);

    destino.innerHTML = '<option value="" disabled selected>Escolha um destino</option>';
    trilhas.forEach(t => destino.add(new Option(t.nome, t.nome)));

    const lista = secao.querySelector(".lista-destinos");
    if (!lista) return;

    const carrossel = document.createElement("div");
    carrossel.className = "trilhas-carrossel";

    const anterior = document.createElement("button");
    anterior.type = "button";
    anterior.className = "seta-trilhas";
    anterior.textContent = "‹";
    anterior.setAttribute("aria-label", "Trilhas anteriores");

    const proximo = document.createElement("button");
    proximo.type = "button";
    proximo.className = "seta-trilhas";
    proximo.textContent = "›";
    proximo.setAttribute("aria-label", "Próximas trilhas");

    const janela = document.createElement("div");
    janela.className = "trilhas-janela";

    lista.parentNode.insertBefore(carrossel, lista);
    janela.appendChild(lista);
    carrossel.append(anterior, janela, proximo);
    lista.innerHTML = "";

    let pagina = 0;
    let porPagina = 3;
    let trilhaAtual;
    let cardAtual;

    function atualizarCarrossel() {
        const card = lista.querySelector(".card-destino");
        if (!card) return;

        const largura = card.getBoundingClientRect().width + 16;
        lista.style.transform = `translateX(-${pagina * porPagina * largura}px)`;

        anterior.disabled = pagina === 0;
        proximo.disabled = pagina >= Math.ceil(trilhas.length / porPagina) - 1;
    }

    function ajustarCarrossel() {
        porPagina = innerWidth <= 560 ? 1 : innerWidth <= 800 ? 2 : 3;
        pagina = Math.min(pagina, Math.ceil(trilhas.length / porPagina) - 1);
        atualizarCarrossel();
    }

    anterior.addEventListener("click", () => {
        pagina = Math.max(0, pagina - 1);
        atualizarCarrossel();
    });

    proximo.addEventListener("click", () => {
        pagina = Math.min(Math.ceil(trilhas.length / porPagina) - 1, pagina + 1);
        atualizarCarrossel();
    });

    window.addEventListener("resize", ajustarCarrossel);

    const modalTrilha = document.createElement("div");
    modalTrilha.className = "modal-trilha";
    modalTrilha.hidden = true;

    modalTrilha.innerHTML = `
        <div class="modal-caixa" role="dialog" aria-modal="true">
            <button type="button" class="modal-fechar" aria-label="Fechar">&times;</button>
            <h3 class="titulo-trilha"></h3>
            <img class="modal-trilha-foto" alt="">
            <p class="descricao-trilha"></p>

            <div class="dificuldade-trilha">
                <strong>Dificuldade:</strong>
                <span class="bolinhas-trilha"></span>
                <span class="texto-dificuldade"></span>
            </div>

            <p class="duracao-trilha"><i class="fa-regular fa-clock" aria-hidden="true"></i> Tempo: <span class="tempo-trilha"></span> &nbsp; <i class="fa-solid fa-route" aria-hidden="true"></i> Distância: <span class="distancia-trilha"></span></p>
            <p class="nota-dificuldade">Classificação indicativa. Consulte um guia para confirmar o nível e as condições do percurso.</p>

            <div class="mapa-trilha"></div>
            <a class="link-mapa" target="_blank" rel="noopener noreferrer">Abrir no Google Maps</a>

            <button type="button" class="escolher-trilha">Escolher esta trilha</button>
        </div>`;

    secao.appendChild(modalTrilha);

    function mostrarMapa(trilha) {
        const area = modalTrilha.querySelector(".mapa-trilha");
        const link = modalTrilha.querySelector(".link-mapa");

        area.innerHTML = "";

        const pesquisa = encodeURIComponent(trilha.mapa);
        const urlMapa = `https://www.google.com/maps?q=${pesquisa}&output=embed`;
        const urlLink = `https://www.google.com/maps/search/?api=1&query=${pesquisa}`;

        const iframe = document.createElement("iframe");
        iframe.src = urlMapa;
        iframe.title = `Mapa de ${trilha.nome}`;
        iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.allowFullscreen = true;

        area.appendChild(iframe);

        link.href = urlLink;
    }

    function abrirDetalhes(t, card) {
        trilhaAtual = t;
        cardAtual = card;

        modalTrilha.querySelector(".titulo-trilha").textContent = t.nome;

        const foto = modalTrilha.querySelector(".modal-trilha-foto");
        foto.src = t.imagem;
        foto.alt = t.nome;

        modalTrilha.querySelector(".descricao-trilha").textContent = t.descricao;
        modalTrilha.querySelector(".texto-dificuldade").textContent = t.dificuldade;
        modalTrilha.querySelector(".tempo-trilha").textContent = t.tempo;
        modalTrilha.querySelector(".distancia-trilha").textContent = t.distancia;

        const dificuldade = modalTrilha.querySelector(".dificuldade-trilha");

        dificuldade.classList.remove(
            "dificuldade-leve",
            "dificuldade-moderada",
            "dificuldade-dificil",
            "dificuldade-sem-classificacao"
        );

        const coresDificuldade = {
            0: "dificuldade-sem-classificacao",
            1: "dificuldade-leve",
            2: "dificuldade-moderada",
            3: "dificuldade-dificil",
            4: "dificuldade-dificil"
        };

        dificuldade.classList.add(coresDificuldade[t.nivel]);

        const bolinhas = modalTrilha.querySelector(".bolinhas-trilha");
        bolinhas.className = `bolinhas-trilha indicador-dificuldade nivel-${t.nivel}`;
        bolinhas.replaceChildren();
        for (let i = 0; i < 4; i++) bolinhas.appendChild(document.createElement("i"));

        mostrarMapa(t);

        modalTrilha.hidden = false;
        document.body.style.overflow = "hidden";
        modalTrilha.querySelector(".modal-fechar").focus();
    }

    function fecharDetalhes() {
        modalTrilha.hidden = true;
        modalTrilha.querySelector(".mapa-trilha").innerHTML = "";

        document.body.style.overflow = "";
        cardAtual?.focus();
    }

    trilhas.forEach(t => {
        const card = document.createElement("article");
        card.className = "card-destino";
        card.tabIndex = 0;
        card.setAttribute("role", "button");

        const titulo = document.createElement("h3");
        titulo.textContent = t.nome;
        const descricao = document.createElement("p");
        descricao.textContent = t.descricao;

        const dados = document.createElement("div");
        dados.className = "dados-trilha";
        dados.innerHTML = `
            <div class="linha-dificuldade">
                <span class="rotulo-dificuldade">Dificuldade</span>
                <span class="indicador-dificuldade nivel-${t.nivel}" aria-label="${t.dificuldade}"><i></i><i></i><i></i><i></i></span>
                <span class="texto-nivel">${t.dificuldade}</span>
            </div>
            <div class="linha-percurso">
                <span><i class="fa-regular fa-clock" aria-hidden="true"></i> Tempo: ${t.tempo}</span>
                <span><i class="fa-solid fa-route" aria-hidden="true"></i> Distância: ${t.distancia}</span>
            </div>`;

        card.append(titulo, descricao, dados);
        lista.appendChild(card);

        card.addEventListener("click", () => abrirDetalhes(t, card));
        card.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.click();
            }
        });
    });

    modalTrilha.querySelector(".modal-fechar").addEventListener("click", fecharDetalhes);

    modalTrilha.addEventListener("click", e => {
        if (e.target === modalTrilha) fecharDetalhes();
    });

    modalTrilha.querySelector(".escolher-trilha").addEventListener("click", () => {
        destino.value = trilhaAtual.nome;
        destino.dispatchEvent(new Event("change", { bubbles: true }));
        fecharDetalhes();
        document.getElementById("orcamento").scrollIntoView({ behavior: "smooth" });
    });

    ajustarCarrossel();

    if (usuario) {
        const nome = document.getElementById("nome");
        const email = document.getElementById("email");

        if (nome && usuario.nome) {
            nome.value = usuario.nome;
            nome.readOnly = true;
        }

        if (email && usuario.email) {
            email.value = usuario.email;
            email.readOnly = true;
        }
    }

    const hoje = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const formatarData = d => d.split("-").reverse().join("/");
    data.min = hoje();

    function limparErros() {
        form.querySelectorAll(".erro").forEach(e => e.remove());
    }

    function mostrarErro(campo, mensagem) {
        const grupo = campo.closest(".campo") || campo.closest("fieldset");
        if (!grupo) return;

        let aviso = grupo.querySelector(".erro");

        if (!aviso) {
            aviso = document.createElement("span");
            aviso.className = "erro";
            aviso.setAttribute("role", "alert");
            grupo.appendChild(aviso);
        }

        aviso.textContent = mensagem;
    }

    function validar() {
        limparErros();

        const nome = document.getElementById("nome");
        const email = document.getElementById("email");
        const quantidade = document.getElementById("quantidade");

        let primeiro = null;

        const erro = (campo, mensagem) => {
            mostrarErro(campo, mensagem);
            primeiro ||= campo;
        };

        if (nome.value.trim().length < 3) erro(nome, "Digite seu nome completo.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) erro(email, "Digite um e-mail válido.");
        if (!destino.value) erro(destino, "Escolha um destino.");
        if (!data.value || data.value < hoje()) erro(data, "Escolha uma data válida.");
        if (!quantidade.value) erro(quantidade, "Informe a quantidade de pessoas.");

        primeiro?.focus();
        return !primeiro;
    }

    form.addEventListener("input", limparErros);
    form.addEventListener("change", limparErros);

    function coletarDados() {
        return {
            nome: document.getElementById("nome").value.trim(),
            email: document.getElementById("email").value.trim().toLowerCase(),
            destino: destino.value,
            data: data.value,
            quantidade: document.getElementById("quantidade").value,
            servicos: [...form.querySelectorAll('input[name="servicos[]"]:checked')].map(c => c.value),
            observacoes: document.getElementById("mensagem").value.trim(),
            usuarioId: usuario?.login || usuario?.email || usuario?.id || ""
        };
    }

    const botao = (texto, acao) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = texto;
        b.addEventListener("click", acao);
        return b;
    };

    function mostrarResumo(d) {
        document.getElementById("resumo-orcamento")?.remove();

        const resumo = document.createElement("div");
        resumo.id = "resumo-orcamento";

        const titulo = document.createElement("h3");
        titulo.textContent = "Confira sua solicitação";
        resumo.appendChild(titulo);

        const itens = [
            ["Nome", d.nome],
            ["E-mail", d.email],
            ["Destino", d.destino],
            ["Data", formatarData(d.data)],
            ["Pessoas", d.quantidade],
            ["Serviços", d.servicos.join(", ") || "Nenhum selecionado"],
            ["Observações", d.observacoes || "Nenhuma"]
        ];

        const listaResumo = document.createElement("dl");

        itens.forEach(([nome, valor]) => {
            const dt = document.createElement("dt");
            const dd = document.createElement("dd");

            dt.textContent = nome;
            dd.textContent = valor;

            listaResumo.append(dt, dd);
        });

        resumo.appendChild(listaResumo);

        resumo.appendChild(botao("Confirmar solicitação", () => {
            try {
                const pedidos = JSON.parse(localStorage.getItem(chave) || "[]");
                const agora = new Date().toISOString();
                const id = "EZ-" + Date.now();

                pedidos.push({
                    id,
                    ...d,
                    status: "Recebido",
                    criadoEm: agora,
                    historico: [{ status: "Recebido", data: agora }]
                });

                localStorage.setItem(chave, JSON.stringify(pedidos));
                resumo.innerHTML = "";

                const sucesso = document.createElement("h3");
                sucesso.textContent = "Solicitação registrada!";

                const mensagem = document.createElement("p");
                mensagem.textContent = `Código da solicitação: ${id}`;

                const aviso = document.createElement("p");
                aviso.textContent = "Esta solicitação foi salva neste navegador.";

                resumo.append(
                    sucesso,
                    mensagem,
                    aviso,
                    botao("Fazer outra solicitação", () => {
                        resumo.remove();
                        form.reset();
                        form.hidden = false;

                        if (usuario) {
                            document.getElementById("nome").value = usuario.nome || "";
                            document.getElementById("email").value = usuario.email || "";
                        }

                        document.querySelectorAll("#experiencias .servico")
                            .forEach(c => c.classList.remove("selecionado"));

                        form.scrollIntoView({ behavior: "smooth" });
                    })
                );
            } catch {
                alert("Não foi possível salvar a solicitação.");
            }
        }));

        resumo.appendChild(botao("Editar pedido", () => {
            resumo.remove();
            form.hidden = false;
            form.scrollIntoView({ behavior: "smooth" });
        }));

        form.hidden = true;
        form.parentNode.insertBefore(resumo, form.nextSibling);
        resumo.scrollIntoView({ behavior: "smooth" });
    }

    form.noValidate = true;

    form.addEventListener("submit", e => {
        e.preventDefault();
        if (validar()) mostrarResumo(coletarDados());
    });

    // Modal dos serviços.
    const modalServico = document.createElement("div");
    modalServico.className = "modal-trilha";
    modalServico.hidden = true;

    modalServico.innerHTML = `
        <div class="modal-caixa" role="dialog" aria-modal="true">
            <button type="button" class="modal-fechar" aria-label="Fechar">&times;</button>
            <h3></h3>
            <p></p>
            <button type="button" class="alternar-servico"></button>
        </div>`;

    document.body.appendChild(modalServico);

    let cardServico;
    let checkboxServico;

    function fecharServico() {
        modalServico.hidden = true;
        document.body.style.overflow = "";
        cardServico?.focus();
    }

    modalServico.querySelector(".modal-fechar").addEventListener("click", fecharServico);

    modalServico.addEventListener("click", e => {
        if (e.target === modalServico) fecharServico();
    });

    document.querySelectorAll("#experiencias .servico").forEach(card => {
        const titulo = card.querySelector("h3")?.textContent.trim();
        const info = servicos[titulo];

        if (!info) return;

        const checkbox = form.querySelector(`input[name="servicos[]"][value="${info[0]}"]`);
        if (!checkbox) return;

        card.tabIndex = 0;
        card.setAttribute("role", "button");

        function abrirServico() {
            cardServico = card;
            checkboxServico = checkbox;

            modalServico.querySelector("h3").textContent = titulo;
            modalServico.querySelector("p").textContent = info[1];

            modalServico.querySelector(".alternar-servico").textContent =
                checkbox.checked ? "Remover do orçamento" : "Adicionar ao orçamento";

            modalServico.hidden = false;
            document.body.style.overflow = "hidden";
        }

        card.addEventListener("click", abrirServico);

        card.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrirServico();
            }
        });

        checkbox.addEventListener("change", () =>
            card.classList.toggle("selecionado", checkbox.checked)
        );
    });

    modalServico.querySelector(".alternar-servico").addEventListener("click", () => {
        checkboxServico.checked = !checkboxServico.checked;
        cardServico.classList.toggle("selecionado", checkboxServico.checked);
        fecharServico();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            if (!modalTrilha.hidden) fecharDetalhes();
            if (!modalServico.hidden) fecharServico();
        }
    });

});