# MHM Farms — Plataforma Web

Site institucional + painel de gestão da **MHM Farms** (quinta e espaço de conservação animal em Boane, Moçambique).

- **Cliente:** React 18 + TypeScript + Vite + Tailwind CSS v4 (PT/EN/FR)
- **Servidor:** Node.js + Express 5 + TypeScript + Prisma
- **Base de dados:** SQLite por predefinição (compatível com PostgreSQL/MySQL)

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

A primeira vez (ou depois de `npm run db:reset`):

```bash
npm run db:setup    # gera o Prisma Client, aplica migrações e faz seed
```

Também pode aplicar migração e seed manualmente:

```bash
npm run db:migrate
npm run db:seed
```

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
- Backups: basta copiar o ficheiro `server/prisma/dev.db`.