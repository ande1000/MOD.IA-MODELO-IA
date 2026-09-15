/**
 * script.js
 * ---------
 * Versão da Mod.iA conectada à API real do Claude.
 *
 * A chave de API é guardada só no localStorage do seu navegador — nunca
 * passa por nenhum servidor além da própria Anthropic quando uma pergunta
 * é enviada. Isso usa o modo oficial de acesso direto do navegador da
 * Anthropic (cabeçalho anthropic-dangerous-direct-browser-access), pensado
 * exatamente para ferramentas pessoais como esta, onde cada pessoa usa a
 * própria chave.
 *
 * Importante: como a chave fica no navegador, qualquer pessoa com acesso
 * ao DevTools desta aba consegue vê-la. Não é recomendado para uso público
 * com uma chave compartilhada — cada pessoa deve colar a própria.
 */

const CHAVE_STORAGE = "modia_api_key";
const MODELO_STORAGE = "modia_modelo";
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

let historico = []; // [{role: "user"|"assistant", content: "..."}]

// ---------- utilidades de armazenamento local ----------

function obterChave() {
  return localStorage.getItem(CHAVE_STORAGE) || "";
}

function obterModelo() {
  return localStorage.getItem(MODELO_STORAGE) || "claude-haiku-4-5-20251001";
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
  // partes alterna: [textoNormal, linguagem, codigo, textoNormal, linguagem, codigo, ...]
  let html = "";
  for (let i = 0; i < partes.length; i++) {
    if (i % 3 === 0) {
      let bloco = escaparHtml(partes[i]);
      bloco = bloco.replace(/`([^`]+)`/g, "<code>$1</code>");
      bloco = bloco.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      const paragrafos = bloco.split(/\n{2,}/).filter((p) => p.trim());
      html += paragrafos.map((p) => `<p>${p}</p>`).join("");
    } else if (i % 3 === 1) {
      // captura da linguagem, tratada junto com o código no próximo índice
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

// ---------- chamada à API ----------

async function chamarClaude(mensagemUsuario) {
  const chave = obterChave();
  const modelo = obterModelo();

  historico.push({ role: "user", content: mensagemUsuario });
  if (historico.length > HISTORICO_MAXIMO) {
    historico = historico.slice(-HISTORICO_MAXIMO);
  }

  const resposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": chave,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: historico,
    }),
  });

  if (!resposta.ok) {
    const erroTexto = await resposta.text();
    let mensagemErro = `Erro ${resposta.status} ao chamar a API.`;
    if (resposta.status === 401) {
      mensagemErro = "Chave de API inválida ou não configurada. Confira em ⚙ Configurações.";
    } else if (resposta.status === 429) {
      mensagemErro = "Limite de uso atingido no momento. Tente de novo em instantes.";
    } else if (resposta.status === 400) {
      mensagemErro = "A requisição não foi aceita pela API. Verifique se a chave e o modelo estão corretos.";
    }
    console.error("Erro da API:", erroTexto);
    throw new Error(mensagemErro);
  }

  const dados = await resposta.json();
  const textoResposta = dados.content
    .filter((bloco) => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("\n");

  historico.push({ role: "assistant", content: textoResposta });
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
    const respostaTexto = await chamarClaude(pergunta);
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
