// Imagens, dificuldade e duração estimada de cada destino.
// Para adicionar uma foto: substitua "" por "imagens/nome-da-foto.jpg".
// O carrossel já tem três espaços para fotos em cada destino.
const informacoesDestinos = {
    "pedra-do-telegrafo": {
        nome: "Pedra do Telégrafo", dificuldade: "Fácil", nivel: 1, tempo: "1h30", distancia: "3 km",
        imagens: ["imagens/telegrafo.jpg", "imagens/telegrafo2.jpg", "imagens/telegrafo3.jpg"]
    },
    "mendanha": {
        nome: "Mendanha", dificuldade: "Moderada", nivel: 2, tempo: "2h", distancia: "4 km",
        imagens: ["imagens/cachoeiramendanha.jpg", "imagens/Mendanha2.jpg", "imagens/Mendanha3.jpg"]
    },
    "praias-selvagens": {
        nome: "Praias Selvagens", dificuldade: "Moderada", nivel: 2, tempo: "1h30", distancia: "3 km",
        imagens: ["imagens/selvagem1.jpg", "imagens/selvagem2.jpg", "imagens/selvagem3.jpg"]
    },
    "pedra-da-tartaruga": {
        nome: "Pedra da Tartaruga", dificuldade: "Moderada", nivel: 2, tempo: "1h40", distancia: "3 km",
        imagens: ["imagens/tartaruga1.jpg", "imagens/tartaruga2.jpg", "imagens/tartaruga3.jpg"]
    },
    "pico-da-pedra-branca": {
        nome: "Pico da Pedra Branca", dificuldade: "Muito difícil", nivel: 4, tempo: "5h", distancia: "9 km",
        imagens: ["imagens/branca1.jpg", "imagens/branca2.jpg", "imagens/branca3.jpg"]
    },
    "pedra-do-quilombo": {
        nome: "Pedra do Quilombo", dificuldade: "Difícil", nivel: 3, tempo: "3h30", distancia: "6 km",
        imagens: ["imagens/quilombo1.jpg", "imagens/quilombo2.jpg", "imagens/quilombo3.jpg"]
    },
    "pedra-do-osso": {
        nome: "Pedra do Osso", dificuldade: "Difícil", nivel: 3, tempo: "2h30", distancia: "4,5 km",
        imagens: ["imagens/osso1.jpg", "imagens/osso2.jpg", "imagens/osso3.jpg"]
    }
};

const janelaDestino = document.getElementById("janela-destino");
const faixaDestino = document.getElementById("janela-destino-faixa");
const contadorDestino = document.getElementById("janela-destino-contador");
let indiceImagem = 0;
let totalImagens = 0;
let mapaDaJanela = null;
let pontoDaJanela = null;
let elementoQueAbriuJanela = null;

function atualizarCarrossel() {
    faixaDestino.style.transform = `translateX(-${indiceImagem * 100}%)`;
    contadorDestino.textContent = `${indiceImagem + 1} / ${totalImagens}`;
}

function mostrarImagens(destino) {
    faixaDestino.replaceChildren();
    indiceImagem = 0;
    const imagens = destino.imagens.length ? destino.imagens : [""];
    totalImagens = imagens.length;

    imagens.forEach((caminho, indice) => {
        const slide = document.createElement("div");
        slide.className = "janela-destino-slide";
        if (caminho) {
            const imagem = document.createElement("img");
            imagem.src = caminho;
            imagem.alt = `${destino.nome} - foto ${indice + 1}`;
            slide.appendChild(imagem);
        } else {
            slide.textContent = `Espaço para imagem ${indice + 1}`;
        }
        faixaDestino.appendChild(slide);
    });
    atualizarCarrossel();
}

function mudarImagem(direcao) {
    if (!totalImagens) return;
    indiceImagem = (indiceImagem + direcao + totalImagens) % totalImagens;
    atualizarCarrossel();
}

function fecharJanelaDestino() {
    janelaDestino.hidden = true;
    document.body.classList.remove("janela-destino-aberta");
    if (elementoQueAbriuJanela) elementoQueAbriuJanela.focus();
}

// Função usada pelos cards e pelos marcadores do mapa da página.
window.abrirJanelaDestino = function(id) {
    const destino = informacoesDestinos[id];
    const marcadorOriginal = window.marcadoresDeDestino?.[id];
    if (!destino || !marcadorOriginal) return;

    elementoQueAbriuJanela = document.activeElement;
    document.getElementById("janela-destino-titulo").textContent = destino.nome;
    const campoDificuldade = document.getElementById("janela-destino-dificuldade");
    campoDificuldade.replaceChildren();
    const indicador = document.createElement("span");
    indicador.className = `indicador-dificuldade nivel-${destino.nivel}`;
    indicador.setAttribute("aria-label", destino.dificuldade);
    for (let i = 0; i < 4; i++) indicador.appendChild(document.createElement("i"));
    const textoNivel = document.createElement("span");
    textoNivel.textContent = destino.dificuldade;
    campoDificuldade.append(indicador, textoNivel);
    document.getElementById("janela-destino-tempo").textContent = destino.tempo;
    document.getElementById("janela-destino-distancia").textContent = destino.distancia;
    mostrarImagens(destino);

    janelaDestino.hidden = false;
    document.body.classList.add("janela-destino-aberta");
    document.getElementById("janela-destino-fechar").focus();

    const coordenadas = marcadorOriginal.getLatLng();
    if (!mapaDaJanela) {
        mapaDaJanela = L.map("mapa-janela-destino").setView(coordenadas, 14);
        L.tileLayer('https://tile.openstreetmap.bzh/ca/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(mapaDaJanela);
        pontoDaJanela = L.marker(coordenadas).addTo(mapaDaJanela);
    } else {
        mapaDaJanela.setView(coordenadas, 14);
        pontoDaJanela.setLatLng(coordenadas);
    }
    requestAnimationFrame(() => mapaDaJanela.invalidateSize());
};

// Cards em destaque e em "Outros destinos".
document.querySelectorAll("#indexmain .card-destino[data-destino], #indexmain .card-outro[data-destino]")
    .forEach(card => {
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.addEventListener("click", () => window.abrirJanelaDestino(card.dataset.destino));
        card.addEventListener("keydown", evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                window.abrirJanelaDestino(card.dataset.destino);
            }
        });
    });

document.getElementById("janela-destino-anterior").addEventListener("click", () => mudarImagem(-1));
document.getElementById("janela-destino-proximo").addEventListener("click", () => mudarImagem(1));
document.getElementById("janela-destino-fechar").addEventListener("click", fecharJanelaDestino);
janelaDestino.addEventListener("click", evento => {
    if (evento.target === janelaDestino) fecharJanelaDestino();
});
document.addEventListener("keydown", evento => {
    if (!janelaDestino.hidden && evento.key === "Escape") fecharJanelaDestino();
});
