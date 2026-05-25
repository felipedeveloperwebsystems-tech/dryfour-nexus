// ============================================================
// DRYFOUR NEXUS — go.mod  (Vercel-ready v2.1)
//
// MUDANÇAS vs versão local:
//   - Nenhuma mudança de dependência necessária.
//   - O Vercel usa o runtime vercel-community/go@1.0.0 que
//     já suporta go 1.22 nativamente.
//   - godotenv PERMANECE como dependência: em dev local ele
//     carrega o .env; em produção no Vercel, o import é seguro
//     pois o Load() falha silenciosamente se .env não existe,
//     e as env vars reais vêm do painel do Vercel.
//
// IMPORTANTE — PACKAGE RESOLUTION NO VERCEL:
//   O Vercel compila a partir do root do repositório.
//   O module name "dryfour-nexus" é resolvido corretamente desde
//   que go.mod esteja na raiz do projeto (✓ já está).
//   Os imports dentro de api/index.go:
//     "dryfour-nexus/database"  → database/connection.go  ✓
//     "dryfour-nexus/models"    → models/post.go          ✓
//   funcionam sem nenhuma alteração de path.
// ============================================================
module dryfour-nexus

go 1.22

require (
	github.com/jackc/pgx/v5 v5.5.4
	github.com/joho/godotenv v1.5.1
)

// As dependências indiretas abaixo são geradas pelo go mod tidy.
// Não editar manualmente — deixar o go mod tidy resolver.
require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20231201235250-de7065d787b8 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/sync v0.6.0 // indirect
	golang.org/x/text v0.14.0 // indirect
)
