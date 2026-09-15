# Mod.iA — versão com IA real (API do Claude)

Essa é a versão "de verdade" da Mod.iA: em vez da rede neural local (que só
reconhecia 15 assuntos fixos), aqui ela chama a API do Claude direto do seu
navegador. Isso significa que ela responde sobre **qualquer assunto**,
inclusive gerar código em qualquer linguagem, criar sites, APIs, sistemas,
e falar sobre segurança/investigação digital.

## Como funciona

Quando você abre a página pela primeira vez, ela pede sua chave de API
(gerada em [console.anthropic.com](https://console.anthropic.com)). Essa
chave fica guardada **só no seu navegador** (`localStorage`) — não existe
nenhum servidor no meio. Cada pergunta que você faz é enviada direto do seu
navegador para a Anthropic, usando um modo oficial de acesso via navegador.

```
Você digita → seu navegador → api.anthropic.com → resposta → seu navegador
```

## ⚠️ Sobre segurança da chave (leia antes de compartilhar o link)

Como a chave fica no navegador, ela fica visível pra quem tiver acesso ao
DevTools daquela aba. Isso é **seguro para uso pessoal** (só você usando, no
seu navegador, com sua própria chave) — é literalmente o padrão que a
Anthropic recomenda para esse tipo de ferramenta interna/pessoal.

**Não é recomendado** publicar esse site para múltiplas pessoas usarem com
uma chave sua compartilhada — cada pessoa que abrir o painel de
configurações (⚙) e colar uma chave vai usar a própria chave, guardada só
no navegador dela. Não existe uma chave "embutida" no código — o
`data-*`/arquivos que você sobe pro GitHub não contêm nenhuma chave seu.

## Como conseguir sua chave de API

1. Crie uma conta em [console.anthropic.com](https://console.anthropic.com)
2. Vá em **API Keys** → **Create Key**
3. Copie a chave (começa com `sk-ant-...`) — ela só aparece uma vez, guarde
   em um lugar seguro
4. Adicione um método de pagamento em **Billing** (a API é paga por uso,
   sem mensalidade — veja a tabela de preços no próprio console)

## Como usar

1. Abra a página (local ou já publicada)
2. Clique no ⚙ no canto superior direito
3. Cole sua chave, escolha o modelo (Haiku = mais barato e rápido; Sonnet =
   mais inteligente para tarefas complexas) e clique em Salvar
4. Pergunte o que quiser

## Testar localmente

```bash
cd mod-ia-ai
python3 -m http.server 8000
```

Abra `http://localhost:8000`.

## Hospedar no GitHub Pages

Mesmo processo da versão anterior:

```bash
cd mod-ia-ai
git init
git add .
git commit -m "Mod.iA com IA real"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/mod-ia.git
git push -u origin main --force
```

(Use `--force` se for substituir a versão antiga no mesmo repositório, ou
crie um repositório novo se preferir manter as duas versões separadas.)

Depois ative em **Settings → Pages**, branch `main`, pasta raiz.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Estrutura: chat, campo de mensagem, botão Pesquisar, painel de configuração |
| `style.css` | Visual (mesma identidade da versão anterior) + estilos do painel e blocos de código |
| `script.js` | Chama a API do Claude, gerencia a chave salva localmente, formata código nas respostas |

## Personalizar o comportamento dela

Dentro de `script.js`, a constante `SYSTEM_PROMPT` é onde você define a
"personalidade" e as instruções da Mod.iA (o que ela deve saber, como deve
responder, quais limites éticos seguir). Edite esse texto à vontade.

## Trocar de modelo

No painel de configuração dá pra escolher entre Haiku (mais barato/rápido)
e Sonnet (mais inteligente, mais caro). Isso é salvo junto com a chave.
