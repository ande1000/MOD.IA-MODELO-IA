/**
 * script.js
 * ---------
 * Versão da Mod.iA conectada à API do Gemini (Google).
 *
 * A chave de API é guardada só no localStorage do seu navegador — nunca
 * passa por nenhum servidor além do próprio Google quando uma pergunta é
 * enviada. A API do Gemini aceita chamadas diretas do navegador via REST
 * (generateContent), usando o cabeçalho x-goog-api-key.
 *
 * Importante: como a chave fica no navegador, qualquer pessoa com acesso
 * ao DevTools desta aba consegue vê-la. Não é recomendado para uso público
 * com uma chave compartilhada — cada pessoa deve colar a própria.
 */

const CHAVE_STORAGE = "modia_gemini_key";
const MODELO_STORAGE = "modia_gemini_modelo";
const HISTORICO_MAXIMO = 12; // quantas mensagens (usuário+IA) mandar de contexto

const SYSTEM_PROMPT = `Você é a Mod.iA, uma assistente de IA especializada em programação e tecnologia.
Domínios fortes: HTML, CSS, JavaScript, Node.js, Python, PHP, criação de sites (institucionais, landing pages, e-commerce/sites de vendas), criação de APIs, arquitetura de sistemas, banco de dados, e também segurança digital e investigação digital.
Ao ajudar com segurança digital ou investigação digital, foque em uso ético, defensivo e legal (proteção de dados, boas práticas, resposta a incidentes, conscientização) — não ajude em invasão de sistemas de terceiros, criação de malware ou qualquer atividade ilegal.
Quando pedirem código, entregue código funcional, completo e comentado, no bloco de código markdown apropriado (com a linguagem indicada após os três acentos graves).
Responda sempre em português do Brasil, de forma direta e didática.`;

const chat = document.getElementById("chat");
const form = document.getElementById("form-entrada");
const campo = document.getElementById("campo-mensagem");
const botao = document.getElementById("botao-pesquisar");
const avisoChave = document.getElementById("aviso-chave");

const painelConfig = document.getElementById("painel-config");
const botaoConfig = document.getElementById("botao-config");
const botaoConfigAviso = document.getElementById("botao-config-aviso");
const campoChave = document.getElementById("campo-chave");
const campoModelo = document.getElementById("campo-modelo");
const botaoSalvarChave = document.getElementById("botao-salvar-chave");
const botaoLimparChave = document.getElementById("botao-limpar-chave");

// histórico no formato do Gemini: [{role: "user"|"model", parts: [{text: "..."}]}]
let historico = [];

// ---------- utilidades de armazenamento local ----------

function obterChave() {
  return localStorage.getItem(CHAVE_STORAGE) || "";
}

function obterModelo() {
  return localStorage.getItem(MODELO_STORAGE) || "gemini-2.5-flash";
}

function atualizarAvisoChave() {
  avisoChave.hidden = Boolean(obterChave());
}

// ---------- formatação de markdown simples (código, negrito, inline code) ----------

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function formatarMarkdown(texto) {
  const partes = texto.split(/```(\w*)\n([\s\S]*?)```/g);
  let html = "";
  for (let i = 0; i < partes.length; i++) {
    if (i % 3 === 0) {
      let bloco = escaparHtml(partes[i]);
      bloco = bloco.replace(/`([^`]+)`/g, "<code>$1</code>");
      bloco = bloco.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      const paragrafos = bloco.split(/\n{2,}/).filter((p) => p.trim());
      html += paragrafos.map((p) => `<p>${p}</p>`).join("");
    } else if (i % 3 === 1) {
      continue;
    } else {
      const linguagem = partes[i - 1] || "";
      const codigo = escaparHtml(partes[i].replace(/\n$/, ""));
      html += `<pre><code class="linguagem-${linguagem}">${codigo}</code></pre>`;
    }
  }
  return html || `<p>${escaparHtml(texto)}</p>`;
}

// ---------- chat UI ----------

function rolarParaFinal() {
  chat.scrollTop = chat.scrollHeight;
}

function adicionarMensagemUsuario(texto) {
  const div = document.createElement("div");
  div.className = "msg msg--usuario";
  const p = document.createElement("p");
  p.textContent = texto;
  div.appendChild(p);
  chat.appendChild(div);
  rolarParaFinal();
}

function adicionarMensagemIA(texto, { erro = false } = {}) {
  const div = document.createElement("div");
  div.className = erro ? "msg msg--ia msg--erro" : "msg msg--ia";
  div.innerHTML = formatarMarkdown(texto);
  chat.appendChild(div);
  rolarParaFinal();
  return div;
}

function adicionarMensagemPensando() {
  const div = document.createElement("div");
  div.className = "msg msg--ia msg--pensando";
  div.innerHTML = '<p>pensando<span class="pontos"></span></p>';
  chat.appendChild(div);
  rolarParaFinal();
  return div;
}

// ---------- chamada à API do Gemini ----------

async function chamarGemini(mensagemUsuario) {
  const chave = obterChave();
  const modelo = obterModelo();

  historico.push({ role: "user", parts: [{ text: mensagemUsuario }] });
  if (historico.length > HISTORICO_MAXIMO) {
    historico = historico.slice(-HISTORICO_MAXIMO);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": chave,
    },
    body: JSON.stringify({
      contents: historico,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { maxOutputTokens: 1500 },
    }),
  });

  if (!resposta.ok) {
    const erroTexto = await resposta.text();
    let mensagemErro = `Erro ${resposta.status} ao chamar a API.`;
    if (resposta.status === 400) {
      mensagemErro = "Chave de API inválida, ou a requisição foi rejeitada. Confira em ⚙ Configurações.";
    } else if (resposta.status === 403) {
      mensagemErro = "Chave de API inválida ou sem permissão. Confira em ⚙ Configurações.";
    } else if (resposta.status === 429) {
      mensagemErro = "Limite de uso atingido no momento. Tente de novo em instantes.";
    }
    console.error("Erro da API:", erroTexto);
    throw new Error(mensagemErro);
  }

  const dados = await resposta.json();
  const candidato = dados.candidates && dados.candidates[0];
  const textoResposta = candidato && candidato.content && candidato.content.parts
    ? candidato.content.parts.map((p) => p.text || "").join("\n")
    : "Não recebi uma resposta válida do modelo. Tente reformular a pergunta.";

  historico.push({ role: "model", parts: [{ text: textoResposta }] });
  return textoResposta;
}

// ---------- envio de mensagem ----------

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const pergunta = campo.value.trim();
  if (!pergunta) return;

  if (!obterChave()) {
    abrirPainelConfig();
    return;
  }

  adicionarMensagemUsuario(pergunta);
  campo.value = "";
  campo.focus();
  botao.disabled = true;

  const mensagemPensando = adicionarMensagemPensando();

  try {
    const respostaTexto = await chamarGemini(pergunta);
    mensagemPensando.remove();
    adicionarMensagemIA(respostaTexto);
  } catch (erro) {
    mensagemPensando.remove();
    adicionarMensagemIA(erro.message, { erro: true });
  } finally {
    botao.disabled = false;
    rolarParaFinal();
  }
});

// ---------- painel de configuração ----------

function abrirPainelConfig() {
  campoChave.value = obterChave();
  campoModelo.value = obterModelo();
  painelConfig.hidden = false;
  campoChave.focus();
}

function fecharPainelConfig() {
  painelConfig.hidden = true;
}

botaoConfig.addEventListener("click", abrirPainelConfig);
botaoConfigAviso.addEventListener("click", abrirPainelConfig);

painelConfig.addEventListener("click", (evento) => {
  if (evento.target === painelConfig) fecharPainelConfig();
});

botaoSalvarChave.addEventListener("click", () => {
  const chave = campoChave.value.trim();
  if (chave) {
    localStorage.setItem(CHAVE_STORAGE, chave);
  }
  localStorage.setItem(MODELO_STORAGE, campoModelo.value);
  atualizarAvisoChave();
  fecharPainelConfig();
});

botaoLimparChave.addEventListener("click", () => {
  localStorage.removeItem(CHAVE_STORAGE);
  campoChave.value = "";
  atualizarAvisoChave();
});

// ---------- inicialização ----------

atualizarAvisoChave();
if (!obterChave()) {
  abrirPainelConfig();
} else {
  campo.focus();
}
