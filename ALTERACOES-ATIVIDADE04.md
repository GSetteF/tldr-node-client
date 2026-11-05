# Alterações da Atividade 04 – suporte a escape de placeholders

Fork de trabalho de [tldr-pages/tldr-node-client](https://github.com/tldr-pages/tldr-node-client)
(licença MIT, versão base 3.5.0, commit `02a5ce2`). Esta alteração **não foi enviada ao projeto
original** (ver seção 1.1 do enunciado).

Issue de referência: [#432 – Client specification v2.1 compliance: add placeholder escaping support](https://github.com/tldr-pages/tldr-node-client/issues/432).

## O que foi adicionado

Nas páginas tldr, `{{valor}}` marca um trecho que o usuário deve substituir. Algumas páginas
(por exemplo `docker inspect`) precisam mostrar `{{ ... }}` de verdade, e a
[especificação de clientes v2.1](https://github.com/tldr-pages/tldr/blob/main/CLIENT-SPECIFICATION.md#page-structure)
define que isso é escrito como `\{\{ ... \}\}`.

Antes, o cliente mostrava as barras e chaves como estavam (`\{\{.Name\}\}`). Agora segue a especificação:

| Texto na página | Antes | Agora |
| --- | --- | --- |
| `{{container}}` | `container` (destacado) | igual |
| `\{\{.Name\}\}` | `\{\{.Name\}\}` | `{{.Name}}` (literal, sem destaque) |
| `\}\}` sozinho | `\}\}` | `}}` |
| `\{` ou `\}` (uma chave só) | igual | igual (a barra é mantida) |
| `\{{x}}` (só a primeira chave escapada) | `\x` com `x` destacado | igual (não é escape: a barra é mantida) |
| `{{a\}\}b}}` | `a\}\}b` destacado | `a}}b` destacado |

A regra da especificação: o escape só vale quando **as duas chaves** estão escapadas.

### Arquivos alterados

- `lib/render.js`: nova função `unescapeBraces`, aplicada a cada trecho dentro de `highlight`
  (+9 linhas). Um par escapado (`\{\{`) nunca contém duas chaves seguidas, então não interfere na
  divisão por `{{ ... }}` que já existia.
- `test/render.spec.js`: 8 testes novos, em `describe('placeholder escaping ...')`.

O parser (`lib/parser.js`) não precisou de mudança: o `marked` não aplica escapes dentro de
code spans, então as barras chegam intactas ao renderizador.

## Como fazer o build

Não há etapa de build (é JavaScript puro, sem transpilação). Requisito: Node.js 22 ou superior.

```bash
git clone <URL-do-fork>
cd tldr-node-client
git checkout feat/placeholder-escaping
npm ci
```

## Como testar

```bash
npm test             # testes unitários: 103 (95 originais + 8 novos)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

`npm run test:all` também roda o teste funcional (`test/functional-test.sh`), que baixa as
páginas do tldr pela internet; ele precisa de acesso à rede.

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
destacado (sublinhado/itálico no tema padrão).

## Limitações conhecidas

- O teste funcional (`test:all`) não foi executado no ambiente de desenvolvimento, por falta
  de acesso à rede; lint, tipos e testes unitários passaram.
- Só o texto dos exemplos é afetado. Descrições e a saída `--markdown` não foram alteradas.
