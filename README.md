# Mod.iA

Interface web para a rede neural feita do zero (veja o projeto `ia_do_zero`).
Roda 100% no navegador — o modelo treinado em Python foi "traduzido" para
JavaScript puro, então não precisa de servidor, backend nem internet depois
de carregada a página.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Estrutura da página: título, chat, campo de mensagem, botão "Pesquisar" |
| `style.css` | Identidade visual (tema escuro, inspirado em rede neural/terminal) |
| `data.js` | Os pesos da rede neural já treinada + a base de conhecimento (gerado a partir do `model.npz` treinado em Python) |
| `engine.js` | Reimplementação em JavaScript do forward pass da rede neural (tokenização, bag-of-words, ReLU, Softmax) |
| `script.js` | Liga a interface ao motor: captura sua pergunta, chama `engine.js`, mostra a resposta |

## Testar localmente

Não dá para simplesmente abrir `index.html` clicando duas vezes em alguns
navegadores (por causa de bloqueios de segurança ao carregar arquivos
locais). O jeito mais simples e confiável:

```bash
cd mod-ia
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador.

Se você tiver o VS Code, a extensão "Live Server" também funciona bem.

## Hospedar no GitHub Pages (grátis)

1. Crie um repositório novo no GitHub (ex: `mod-ia`)
2. Envie estes arquivos para o repositório:
   ```bash
   cd mod-ia
   git init
   git add .
   git commit -m "Mod.iA - primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/mod-ia.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**
4. Em "Source", selecione a branch `main` e a pasta `/root` (raiz)
5. Salve — em alguns minutos seu site estará em:
   `https://SEU_USUARIO.github.io/mod-ia/`

Pronto: link público, gratuito, e funcionando para sempre (ou até você
apagar o repositório).

## Como atualizar o "cérebro" da Mod.iA

Se você ensinar coisas novas para o modelo em Python (editando
`intents.json` e rodando `train.py` de novo, no projeto `ia_do_zero`),
é só rodar de novo o script de exportação para atualizar o `data.js`
aqui e depois enviar (`git push`) a atualização.

O script de exportação usado foi:

```python
import json
import numpy as np

data = np.load("model.npz")
payload = {
    "W1": data["W1"].tolist(), "b1": data["b1"].tolist(),
    "W2": data["W2"].tolist(), "b2": data["b2"].tolist(),
    "vocab": json.load(open("vocab.json", encoding="utf-8"))["vocab"],
    "labels": json.load(open("labels.json", encoding="utf-8")),
    "intents": {i["tag"]: i["responses"]
                for i in json.load(open("intents.json", encoding="utf-8"))["intents"]},
}

with open("data.js", "w", encoding="utf-8") as f:
    f.write("const MODEL_DATA = ")
    json.dump(payload, f, ensure_ascii=False)
    f.write(";\n")
```

## Limitações

Assim como o modelo em Python original, a Mod.iA só reconhece as categorias
(`intents`) que foram usadas no treino. Se a confiança da previsão for baixa,
ela admite que não sabe, em vez de inventar uma resposta.
