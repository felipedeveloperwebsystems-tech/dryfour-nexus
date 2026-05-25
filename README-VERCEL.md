# Dryfour NEXUS — Guia de Deploy no Vercel (Hobby Plan)

> **Stack:** Golang Serverless + Neon PostgreSQL + Vanilla JS  
> **Plano:** Vercel Hobby (gratuito)  
> **Repositório:** https://github.com/felipedeveloperwebsystems-tech/dryfour-nexus

---

## Arquitetura final após a reestruturação

```
dryfour-nexus/
│
├── vercel.json              ← Configuração do Vercel (rotas, CDN, runtime)
├── go.mod                   ← Módulo Go (sem alterações de dependência)
├── main.go                  ← MANTIDO para desenvolvimento local
│
├── api/
│   └── index.go             ← ✨ NOVO — Entry point Serverless para Vercel
│                               (substitui o http.ListenAndServe do main.go)
│
├── controllers/
│   └── news_controller.go   ← Mantido (usado apenas em dev local)
│
├── database/
│   └── connection.go        ← Mantido (sync.Once garante 1 conexão por container)
│
├── models/
│   └── post.go              ← Atualizado — 8 nichos + mock expandido
│
└── public/
    ├── index.html           ← Servido pelo CDN global do Vercel
    └── assets/
        ├── style.css
        └── app.js
```

### Por que dois entry points?

| Arquivo | Usado em | Responsável por |
|---|---|---|
| `main.go` | `go run main.go` (local) | `http.ListenAndServe`, carrega .env |
| `api/index.go` | Vercel (produção) | `func Handler(w, r)`, sem servidor persistente |

O Vercel **não executa** `main.go`. Ele detecta `api/index.go` com `func Handler` e o converte em Lambda automaticamente.

---

## Pré-requisitos

```powershell
# Verificar se Git está instalado
git --version

# Verificar se Go está instalado
go version

# Instalar Vercel CLI (global)
npm install -g vercel

# Verificar instalação
vercel --version
```

---

## FASE 1 — Reestruturar o projeto localmente

### Passo 1: Criar a pasta `api/` e o arquivo `api/index.go`

```powershell
# Navegar para a pasta do projeto
cd C:\Users\felipe\Desktop\99_ArquivoCode\Dinheiro_Projetos\testes\blog\dryfour-nexus

# Criar a pasta api/
New-Item -ItemType Directory -Path "api" -Force

# Copiar o api/index.go gerado para a pasta
# (cole o conteúdo do arquivo api/index.go fornecido neste guia)
# Ou use o editor de texto:
notepad api\index.go
```

### Passo 2: Criar o `vercel.json` na raiz

```powershell
# Na raiz do projeto (mesmo nível do go.mod)
notepad vercel.json
# (cole o conteúdo do vercel.json fornecido)
```

### Passo 3: Atualizar `models/post.go`

```powershell
# Substitui o post.go atual pelo v2.1 (8 nichos no mock)
notepad models\post.go
# (cole o conteúdo do models/post.go v2.1 fornecido)
```

### Passo 4: Verificar dependências Go

```powershell
# Atualiza go.sum com as dependências indiretas corretas
go mod tidy

# Verifica se compila sem erros
go build ./...
```

> ✅ Se nenhum erro aparecer, a estrutura está correta.

### Passo 5: Verificar a estrutura com tree

```powershell
tree /f
```

Saída esperada:
```
C:.
│   .env
│   .gitignore
│   go.mod
│   go.sum
│   main.go
│   README.md
│   vercel.json           ← deve aparecer aqui
│
├───api
│       index.go          ← deve aparecer aqui
│
├───controllers
│       news_controller.go
│
├───database
│       connection.go
│
├───models
│       post.go
│
└───public
    │   index.html
    │
    └───assets
            app.js
            style.css
```

---

## FASE 2 — Testar localmente antes do deploy

### Teste 1: Servidor local (main.go — sem alterações)

```powershell
go run main.go
```

Abrir: http://localhost:8080

### Teste 2: Testar a API localmente

```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8080/api/health" | Select-Object -Expand Content

# Artigos (modo mock)
Invoke-WebRequest -Uri "http://localhost:8080/api/news" | Select-Object -Expand Content

# Filtrar por nicho
Invoke-WebRequest -Uri "http://localhost:8080/api/news?niche=ai&sort=popular" | Select-Object -Expand Content

# Artigo por ID
Invoke-WebRequest -Uri "http://localhost:8080/api/news/1" | Select-Object -Expand Content

# Categorias
Invoke-WebRequest -Uri "http://localhost:8080/api/categories" | Select-Object -Expand Content
```

### Teste 3: Simular ambiente Vercel localmente com `vercel dev`

```powershell
# Instalar Vercel CLI se ainda não instalou
npm install -g vercel

# Login no Vercel (abre o browser para autenticação)
vercel login

# Rodar em modo dev local (simula o ambiente Vercel)
vercel dev
```

> O `vercel dev` vai servir:
> - `api/index.go` em http://localhost:3000/api/...
> - `public/` em http://localhost:3000/

---

## FASE 3 — Configurar variáveis de ambiente no Vercel

### Via CLI (recomendado)

```powershell
# Adiciona a string de conexão do Neon (vai pedir o valor interativamente)
vercel env add NEON_DATABASE_URL

# Quando perguntar "Which environments?", selecione:
# ✓ Production
# ✓ Preview
# (Development é opcional — você usa o .env local)

# Verifica as variáveis configuradas
vercel env ls
```

### Via painel web (alternativa)

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `dryfour-nexus`
3. Vá em **Settings → Environment Variables**
4. Adicione:
   - **Key:** `NEON_DATABASE_URL`
   - **Value:** `postgresql://nexus_user:SUA_SENHA@ep-xxx.us-east-2.aws.neon.tech/dryfour_nexus?sslmode=require`
   - **Environment:** Production + Preview

> ⚠️ **NUNCA** suba o `.env` com valores reais para o GitHub.
> O `.gitignore` já exclui o `.env` — confirme antes do push.

---

## FASE 4 — Push para o GitHub

### Configurar o repositório (se ainda não fez)

```powershell
# Inicializa git (se ainda não inicializado)
git init

# Adiciona o remote do GitHub
git remote add origin https://github.com/felipedeveloperwebsystems-tech/dryfour-nexus.git

# Verifica o .gitignore — confirma que .env está excluído
Get-Content .gitignore
```

### Verificar o `.gitignore`

O arquivo deve conter pelo menos:

```
.env
.env.local
.env.*.local
*.exe
*.exe~
/bin/
/dist/
```

### Fazer o commit e push

```powershell
# Stage de todos os arquivos novos e modificados
git add .

# Verifica o que será commitado (confirma que .env NÃO está na lista)
git status

# Commit
git commit -m "feat: Vercel Serverless deploy — api/index.go + vercel.json + 8 nichos"

# Push para o branch main
git push -u origin main
```

---

## FASE 5 — Deploy no Vercel

### Opção A: Deploy via CLI (mais rápido)

```powershell
# Dentro da pasta do projeto
vercel

# Responder as perguntas:
# ? Set up and deploy? → Y
# ? Which scope? → Selecione sua conta
# ? Link to existing project? → N (primeira vez) ou Y (já existe)
# ? What's your project's name? → dryfour-nexus
# ? In which directory is your code located? → ./
# ? Want to override the settings? → N

# Deploy de produção (após testar o preview)
vercel --prod
```

### Opção B: Deploy automático via GitHub (CI/CD)

1. Acesse: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione `felipedeveloperwebsystems-tech/dryfour-nexus`
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (raiz)
   - **Build Command:** `go build ./...`
   - **Output Directory:** `public`
5. Clique em **"Deploy"**

> Após isso, todo `git push` para `main` dispara um novo deploy automaticamente.

---

## FASE 6 — Verificar o deploy

```powershell
# Substitua SEU-PROJETO pelo nome do seu projeto no Vercel
$BASE = "https://dryfour-nexus.vercel.app"

# Health check
Invoke-WebRequest -Uri "$BASE/api/health" | Select-Object -Expand Content

# API de artigos
Invoke-WebRequest -Uri "$BASE/api/news" | Select-Object -Expand Content

# API filtrada
Invoke-WebRequest -Uri "$BASE/api/news?niche=ai&sort=popular" | Select-Object -Expand Content

# Categorias
Invoke-WebRequest -Uri "$BASE/api/categories" | Select-Object -Expand Content

# Frontend
Start-Process "https://dryfour-nexus.vercel.app"
```

---

## Troubleshooting

### Erro: `package handler: build constraints exclude all Go files`

**Causa:** O `api/index.go` tem `package handler` mas o Vercel espera exatamente isso.  
**Solução:** Confirme que o arquivo começa com `package handler` (não `package main`).

### Erro: `cannot find module "dryfour-nexus/database"`

**Causa:** O `go.mod` não está na raiz do projeto.  
**Solução:**
```powershell
# Confirmar localização do go.mod
Get-Item go.mod | Select-Object FullName
# Deve ser: C:\...\dryfour-nexus\go.mod (sem subpastas)
```

### Erro: `500 Internal Server Error` na API

**Causa:** Quase sempre é o banco de dados.  
**Diagnóstico:**
```powershell
# Testa se o endpoint de health mostra db:false (modo mock) ou db:true (conectado)
Invoke-WebRequest -Uri "https://dryfour-nexus.vercel.app/api/health" | Select-Object -Expand Content
```
Se `"db": false` e `"mode": "mock"` — está funcionando em modo mock (sem banco).  
Se `"db": true` — banco conectado, o erro é outro.

### Cold start lento (primeira request demora ~400ms)

**Causa:** Normal no Plano Hobby do Vercel para Go.  
**Solução:** O frontend JS pode mostrar um skeleton enquanto a API responde.  
Já implementado no `app.js` com `.nx-skeleton`.

### Erro CORS no browser

**Causa:** O `withCORS()` não está sendo aplicado.  
**Diagnóstico:** Abra o DevTools → Network → verifique se a response tem `Access-Control-Allow-Origin: *`.  
**Solução:** Confirme que `vercel.json` tem a rota OPTIONS e que `api/index.go` aplica `withCORS()`.

---

## URLs do projeto após deploy

| URL | Descrição |
|---|---|
| `https://dryfour-nexus.vercel.app` | Frontend (CDN global) |
| `https://dryfour-nexus.vercel.app/api/health` | Health check |
| `https://dryfour-nexus.vercel.app/api/news` | Todos os artigos |
| `https://dryfour-nexus.vercel.app/api/news?niche=ai` | Artigos de IA |
| `https://dryfour-nexus.vercel.app/api/news?sort=popular` | Mais populares |
| `https://dryfour-nexus.vercel.app/api/news/1` | Artigo ID 1 |
| `https://dryfour-nexus.vercel.app/api/categories` | 8 nichos |

---

## Próximos passos (pós-deploy)

1. **Conectar o domínio próprio:** `vercel domains add nexus.dryfour.com.br`
2. **Configurar Neon PostgreSQL:** Executar o schema SQL de `database/connection.go`
3. **Integrar a API no frontend:** Substituir `ARTICLES_DB` em `app.js` por `fetch('/api/news?niche='+niche)`
4. **Analytics:** Adicionar `gtag()` no `MonetizationEngine.track()` do `app.js`
5. **Monitoramento:** UptimeRobot gratuito apontando para `/api/health`

---

© 2026 Dryfour NEXUS — DRYFOUR DISTRIBUIDORA E EMPREENDIMENTOS LTDA.
