# Mod.iA — versão com Gemini (Google)

Mesma interface e identidade visual do projeto Mod.iA, mas o motor por
baixo agora chama a **API do Gemini** (Google) direto do navegador, em vez
da rede neural local ou do Claude.

## Como funciona

Quando você abre a página pela primeira vez, ela pede sua chave de API do
Gemini. Essa chave fica guardada **só no seu navegador** (`localStorage`).
Cada pergunta é enviada direto do seu navegador para o Google.

```
Você digita → seu navegador → generativelanguage.googleapis.com → resposta
```

## Como conseguir sua chave de API (tem opção gratuita)

1. Acesse [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Faça login com uma conta Google
3. Clique em **Create API Key**
4. Copie a chave (começa com `AIza...`)

Os modelos **Flash** e **Flash-Lite** têm uso gratuito no Google AI Studio
(com limite de requisições por minuto/dia — sem precisar cadastrar
cartão). Só os modelos **Pro** são pagos. Por isso o seletor de modelo já
vem com o Flash marcado por padrão.

⚠️ No plano gratuito, o Google pode usar as conversas para melhorar os
produtos deles — se isso for um problema para você (dados sensíveis,
código proprietário), ative uma conta paga no AI Studio antes de usar.

## ⚠️ Sobre segurança da chave

A chave fica visível para quem tiver acesso ao DevTools do navegador. Isso
é **seguro para uso pessoal** — cada pessoa que for usar essa ferramenta
deve colar a própria chave nas configurações (⚙), nunca compartilhar uma
chave dentro do código.

## Como usar

1. Abra a página
2. Clique no ⚙ no canto superior direito
3. Cole sua chave, escolha o modelo e clique em Salvar
4. Pergunte o que quiser — código, sites, APIs, sistemas, segurança digital

## Testar localmente

```bash
cd mod-ia-gemini
python3 -m http.server 8000
```

Abra `http://localhost:8000`.

## Hospedar no GitHub Pages

```bash
cd mod-ia-gemini
git init
git add .
git commit -m "Mod.iA com Gemini"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/mod-ia.git
git push -u origin main --force
```

Depois ative em **Settings → Pages**, branch `main`, pasta raiz.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Estrutura: chat, campo de mensagem, botão Pesquisar, painel de configuração |
| `style.css` | Visual (mesma identidade das versões anteriores) |
| `script.js` | Chama a API do Gemini, gerencia a chave salva localmente, formata código nas respostas |

## Trocar o comportamento dela

A constante `SYSTEM_PROMPT` dentro de `script.js` define as instruções e o
tom da Mod.iA. Edite à vontade.

## Diferença em relação à versão com Claude

Tecnicamente, a única mudança de verdade está em `script.js`: o endpoint
chamado (`generativelanguage.googleapis.com` em vez de
`api.anthropic.com`), o cabeçalho de autenticação (`x-goog-api-key` em vez
de `x-api-key`), e o formato dos dados de entrada/saída (`contents`/`parts`
em vez de `messages`/`content`). O restante (HTML, CSS, lógica de chat) é
o mesmo.
