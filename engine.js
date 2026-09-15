/**
 * engine.js
 * ---------
 * Reimplementação em JavaScript puro (sem bibliotecas) do forward pass
 * da rede neural treinada em Python. Os pesos vêm de data.js.
 *
 * Mesma lógica de neural_network.py e vectorizer.py:
 *   texto -> tokenização -> vetor bag-of-words -> camada oculta (ReLU)
 *   -> camada de saída (Softmax) -> categoria prevista + confiança
 */

const LIMIAR_CONFIANCA = 0.50;

function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function tokenize(texto) {
  let t = texto.toLowerCase();
  t = removerAcentos(t);
  t = t.replace(/[^a-z0-9_\s]/g, " ");
  return t.split(/\s+/).filter(Boolean);
}

function vetorizarFrase(frase, vocab) {
  const vetor = new Array(vocab.length).fill(0);
  const tokens = tokenize(frase);
  const indice = {};
  vocab.forEach((palavra, i) => (indice[palavra] = i));
  for (const token of tokens) {
    if (token in indice) vetor[indice[token]] = 1;
  }
  return vetor;
}

// multiplicação vetor (1 x n) por matriz (n x m) => vetor (1 x m)
function vetorMatriz(vetor, matriz) {
  const linhas = matriz.length;
  const colunas = matriz[0].length;
  const resultado = new Array(colunas).fill(0);
  for (let j = 0; j < colunas; j++) {
    let soma = 0;
    for (let i = 0; i < linhas; i++) {
      soma += vetor[i] * matriz[i][j];
    }
    resultado[j] = soma;
  }
  return resultado;
}

function somarVies(vetor, vies) {
  return vetor.map((v, i) => v + vies[0][i]);
}

function relu(vetor) {
  return vetor.map((v) => Math.max(0, v));
}

function softmax(vetor) {
  const max = Math.max(...vetor);
  const exps = vetor.map((v) => Math.exp(v - max));
  const soma = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / soma);
}

function preverIntencao(frase) {
  const { W1, b1, W2, b2, vocab, labels } = MODEL_DATA;

  const x = vetorizarFrase(frase, vocab);
  const z1 = somarVies(vetorMatriz(x, W1), b1);
  const a1 = relu(z1);
  const z2 = somarVies(vetorMatriz(a1, W2), b2);
  const probs = softmax(z2);

  let melhorIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[melhorIdx]) melhorIdx = i;
  }

  return {
    tag: labels[melhorIdx],
    confianca: probs[melhorIdx],
  };
}

function responderPergunta(frase) {
  const { intents } = MODEL_DATA;
  const { tag, confianca } = preverIntencao(frase);

  const tagFinal = confianca < LIMIAR_CONFIANCA ? "desconhecido" : tag;
  const respostas = intents[tagFinal] || [
    "Ainda não aprendi sobre isso. Você pode me ensinar adicionando esse tópico na base de conhecimento!",
  ];
  const resposta = respostas[Math.floor(Math.random() * respostas.length)];

  return { resposta, tag: tagFinal, confianca };
}
