# AlteraÃ§Ãµes da Atividade 04 â€“ suporte a escape de placeholders

Fork de trabalho de [tldr-pages/tldr-node-client](https://github.com/tldr-pages/tldr-node-client)
(licenÃ§a MIT, versÃ£o base 3.5.0, commit `02a5ce2`). Esta alteraÃ§Ã£o **nÃ£o foi enviada ao projeto
original** (ver seÃ§Ã£o 1.1 do enunciado).

Issue de referÃªncia: [#432 â€“ Client specification v2.1 compliance: add placeholder escaping support](https://github.com/tldr-pages/tldr-node-client/issues/432).

## O que foi adicionado

Nas pÃ¡ginas tldr, `{{valor}}` marca um trecho que o usuÃ¡rio deve substituir. Algumas pÃ¡ginas
(por exemplo `docker inspect`) precisam mostrar `{{ ... }}` de verdade, e a
[especificaÃ§Ã£o de clientes v2.1](https://github.com/tldr-pages/tldr/blob/main/CLIENT-SPECIFICATION.md#page-structure)
define que isso Ã© escrito como `\{\{ ... \}\}`.

Antes, o cliente mostrava as barras e chaves como estavam (`\{\{.Name\}\}`). Agora segue a especificaÃ§Ã£o:

| Texto na pÃ¡gina | Antes | Agora |
| --- | --- | --- |
| `{{container}}` | `container` (destacado) | igual |
| `\{\{.Name\}\}` | `\{\{.Name\}\}` | `{{.Name}}` (literal, sem destaque) |
| `\}\}` sozinho | `\}\}` | `}}` |
| `\{` ou `\}` (uma chave sÃ³) | igual | igual (a barra Ã© mantida) |
| `\{{x}}` (sÃ³ a primeira chave escapada) | `\x` com `x` destacado | igual (nÃ£o Ã© escape: a barra Ã© mantida) |
| `{{a\}\}b}}` | `a\}\}b` destacado | `a}}b` destacado |

A regra da especificaÃ§Ã£o: o escape sÃ³ vale quando **as duas chaves** estÃ£o escapadas.

### Arquivos alterados

- `lib/render.js`: nova funÃ§Ã£o `unescapeBraces`, aplicada a cada trecho dentro de `highlight`
  (+9 linhas). Um par escapado (`\{\{`) nunca contÃ©m duas chaves seguidas, entÃ£o nÃ£o interfere na
  divisÃ£o por `{{ ... }}` que jÃ¡ existia.
- `test/render.spec.js`: 8 testes novos, em `describe('placeholder escaping ...')`.

O parser (`lib/parser.js`) nÃ£o precisou de mudanÃ§a: o `marked` nÃ£o aplica escapes dentro de
code spans, entÃ£o as barras chegam intactas ao renderizador.

## Como fazer o build

NÃ£o hÃ¡ etapa de build (Ã© JavaScript puro, sem transpilaÃ§Ã£o). Requisito: Node.js 22 ou superior.

```bash
git clone https://github.com/GSetteF/tldr-node-client.git
cd tldr-node-client
git checkout feat/placeholder-escaping
npm ci
```

## Como testar

```bash
npm test             # testes unitÃ¡rios: 103 (95 originais + 8 novos)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

`npm run test:all` tambÃ©m roda o teste funcional (`test/functional-test.sh`), que baixa as
pÃ¡ginas do tldr pela internet; ele precisa de acesso Ã  rede.

### Teste manual (sem rede)

Crie um arquivo `docker-inspect.md`:

````markdown
# docker inspect

> Return low-level information on Docker objects.

- Display information using a Go template:

`docker inspect --format '\{\{.Name\}\}' {{container}}`
````

e renderize-o:

```bash
node bin/tldr --render docker-inspect.md
```

Resultado esperado: `docker inspect --format '{{.Name}}' container`, com apenas `container`
destacado (sublinhado/itÃ¡lico no tema padrÃ£o).

## LimitaÃ§Ãµes conhecidas

- O teste funcional (`test:all`) nÃ£o foi executado no ambiente de desenvolvimento, por falta
  de acesso Ã  rede; lint, tipos e testes unitÃ¡rios passaram.
- SÃ³ o texto dos exemplos Ã© afetado. DescriÃ§Ãµes e a saÃ­da `--markdown` nÃ£o foram alteradas.
