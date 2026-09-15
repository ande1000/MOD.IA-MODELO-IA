/**
 * script.js
 * ---------
 * Liga a interface (index.html) ao motor de inferência (engine.js).
 * Não depende de nenhum servidor: tudo roda no navegador.
 */

const chat = document.getElementById("chat");
const form = document.getElementById("form-entrada");
const campo = document.getElementById("campo-mensagem");
const botao = document.getElementById("botao-pesquisar");

function rolarParaFinal() {
  chat.scrollTop = chat.scrollHeight;
}

function adicionarMensagem(texto, autor) {
  const div = document.createElement("div");
  div.className = autor === "usuario" ? "msg msg--usuario" : "msg msg--ia";
  const p = document.createElement("p");
  p.textContent = texto;
  div.appendChild(p);
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

function formatarConfianca(valor) {
  return (valor * 100).toFixed(0) + "%";
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const pergunta = campo.value.trim();
  if (!pergunta) return;

  adicionarMensagem(pergunta, "usuario");
  campo.value = "";
  campo.focus();
  botao.disabled = true;

  const mensagemPensando = adicionarMensagemPensando();

  // pequeno atraso simulado para dar sensação de processamento
  // (a inferência em si é praticamente instantânea)
  setTimeout(() => {
    const { resposta, tag, confianca } = responderPergunta(pergunta);

    mensagemPensando.remove();
    const bolha = adicionarMensagem(resposta, "ia");

    const meta = document.createElement("span");
    meta.className = "msg-meta";
    meta.textContent = `intenção: ${tag} · confiança: ${formatarConfianca(confianca)}`;
    bolha.appendChild(meta);

    rolarParaFinal();
    botao.disabled = false;
  }, 450);
});

campo.focus();
