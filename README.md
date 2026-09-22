# MHM Farms — Plataforma Web

Site institucional + painel de gestão da **MHM Farms** (quinta e espaço de conservação animal em Boane, Moçambique).

- **Cliente:** React 18 + TypeScript + Vite + Tailwind CSS v4 (PT/EN/FR)
- **Servidor:** Node.js + Express 5 + TypeScript + Prisma
- **Base de dados:** MySQL/MariaDB (ex.: XAMPP) — compatível também com SQLite/PostgreSQL

---

## Requisitos

- Node.js ≥ 18 (testado com Node 24)
- npm ≥ 9

## Instalação

```bash
npm install
```

## Arranque rápido (desenvolvimento)

```bash
cp server/.env.example server/.env
npm run dev
```

Isto executa em paralelo:

- API em `http://localhost:4000`
- Front-end (Vite, com proxy `/api`) em `http://localhost:5173`

## Base de dados

### MySQL (configuração atual)

1. Tenha MySQL/MariaDB a correr (ex.: XAMPP → painel → Start MySQL). A porta predefinida é 3306.
2. Defina `DATABASE_URL` no `server/.env`. Exemplo local (XAMPP `root` sem palavra-passe):
   `DATABASE_URL="mysql://root@localhost:3306/mhm_farms"`
3. A primeira vez (ou depois de `npm run db:reset`):

   ```bash
   npm run db:setup    # gera o Prisma Client, aplica migrações e faz seed
   npm run db:sync     # espelha o conteúdo do content.json para o MySQL
   ```

### SQLite / PostgreSQL

Para desenvolvimento sem MySQL, mude o `provider` do `datasource db` em `server/prisma/schema.prisma` para `sqlite` ou `postgresql` e ajuste `DATABASE_URL`.

## Conteúdo em ficheiro JSON (fonte de verdade)

O conteúdo publicável (animais, experiências, eventos, notícias, galeria, FAQ e definições de preços/horários/contactos/SEO) vive em **`server/data/content.json`** e é **a fonte de verdade**.

| Comando            | O que faz                                                        |
| ------------------ | ---------------------------------------------------------------- |
| `npm run db:sync`  | Sincroniza `content.json` → MySQL (uma vez)                      |
| `npm run json:watch` | Watcher em **tempo real**: guardou o ficheiro, o MySQL é atualizado automaticamente |
| `npm run json:export` | Gera `content.json` a partir do estado atual da base de dados  |

Fluxos de trabalho:

- **Editar conteúdo pelo ficheiro:** altere `server/data/content.json`, guarde e o `json:watch` aplica tudo no MySQL em segundos. O site continua a ler tudo do MySQL.
- **Manter o watcher sempre ligado em dev:** `npm run dev` + `npm run json:watch` (janelas separadas), ou apenas `npm run json:watch` quando quiser sincronizar em tempo real.
- **Cuidado:** como o JSON é a fonte de verdade, edições feitas pelo painel nas áreas de conteúdo são substituídas na próxima sincronização. Dados operacionais (utilizadores, reservas, visitas escolares, mensagens, avaliações) **não** fazem parte do JSON e ficam apenas no MySQL.

### Contas de demonstração (seed)

| Função        | Email                  | Senha      |
| ------------- | ---------------------- | ---------- |
| Administrador | admin@mhmfarms.com     | Admin123!  |
| Gestor        | gestor@mhmfarms.com    | Gestor123! |

> Mude as senhas antes de ir para produção.

### Usar PostgreSQL/MySQL

1. Edite `server/prisma/schema.prisma` — campo `provider` do `datasource db`:
   - `postgresql` (ex.: `postgresql://user:pass@localhost:5432/mhmfarms`)
   - ou `mysql` (`mysql://user:pass@localhost:3306/mhmfarms`)
2. Defina `DATABASE_URL` no `server/.env`.
3. `npm run db:migrate` e `npm run db:seed`.

## Scripts

| Comando             | Descrição                                          |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | API (tsx watch) + Vite em paralelo                 |
| `npm run build`     | Compila server e faz build de produção do client   |
| `npm run start`     | Inicia a API servindo o build (`server/dist`)      |
| `npm run typecheck` | Verificação de tipos (server + client)             |
| `npm run db:setup`  | generate + migrate + seed                          |
| `npm run db:reset`  | Apaga e recria a base com seed                     |
| `npm run db:studio` | Prisma Studio (editor visual da BD)                |
| `npm run db:sync`   | Sincroniza `content.json` → MySQL                  |
| `npm run json:watch`| Watcher em tempo real do `content.json`            |
| `npm run json:export`| Gera `content.json` a partir da base de dados     |

## Primeiro acesso ao painel

1. Entre em `/admin` com a conta de Administrador (seed acima).
2. Na **Definições** (`/admin/definicoes`):
   - **Preços** — categorias e valores usados pela página `Preços` e pelas reservas.
   - **Horários** — dias/horas de funcionamento e aviso.
   - **Contactos / Redes Sociais / Mapas** — dados do rodapé e da página `Como Chegar`.
   - **Página Inicial** e **Sobre Nós** — textos do hero e da página `Sobre`.
   - **SEO** — `<title>` e `<meta description>` globais.
3. **Animais / Experiências / Eventos / Notícias / Galeria / FAQ** — listagens, criação, edição, ativar/desativar e eliminação.
4. **Reservas** — filtra por estado, vê detalhes, muda estado (Pendente/Confirmada/Cancelada/Concluída) e exporta CSV.
5. **Visitas Escolares**, **Mensagens**, **Utilizadores** e **Dashboard** — gestão restante e métricas.

Imagens são inseridas por URL (o painel não faz upload de ficheiros).

## Anotações de implementação

- Rotas protegidas: `/admin` exige login; ações de escrita exigem `ADMIN` ou `MANAGER`.
- As reservas geram códigos `MHM-AAAA-NNNNNN` e calculam o preço a partir da definição `prices` (+ preço de experiência, se selecionada).
- Sitemap (`/sitemap.xml`), `robots.txt` e dados `schema.org` estão em `client/public` — atualize os URLs se o domínio real for diferente de `mhmfarms.com`.
- Conteúdo do site: edite `server/data/content.json` (o MySQL sincroniza em tempo real com `npm run json:watch`).
- Backups: `server/data/content.json` (conteúdo) + dump da base MySQL (dados operacionais).