// ============================================================
// DRYFOUR NEXUS — api/index.go
// Ponto de entrada Serverless para Vercel (Hobby Plan)
//
// COMO FUNCIONA NO VERCEL:
//   O Vercel detecta qualquer arquivo dentro de api/ com uma
//   função exportada `Handler(w http.ResponseWriter, r *http.Request)`
//   e a transforma em um Lambda (AWS Lambda compatível) isolado.
//   NÃO há http.ListenAndServe — o Vercel gerencia o ciclo de vida.
//
// DIFERENÇA CRÍTICA vs main.go:
//   main.go:       http.ListenAndServe(":8080", mux)  ← servidor persistente
//   api/index.go:  func Handler(w, r) { router(w, r) } ← invocado por evento
//
// COLD START:
//   A primeira request após inatividade pode levar 200-400ms para Go.
//   Requests subsequentes dentro do mesmo container são rápidas (~5ms).
//   O banco Neon é inicializado com sync.Once para sobreviver warm calls.
//
// FALLBACK INTELIGENTE:
//   Se NEON_DATABASE_URL não está definida OU a conexão falha,
//   o sistema silenciosamente usa os mock data de models/post.go.
//   NUNCA retorna HTTP 500 por causa de banco indisponível.
//
// PACKAGE:
//   Deve ser `package handler` — convenção do Vercel Go runtime.
//   Isso NÃO conflita com os outros packages (controllers, models, database)
//   pois cada diretório é um package separado em Go.
// ============================================================

package handler

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	// Imports dos nossos packages internos
	// O Vercel resolve os imports relativos ao go.mod no root do projeto.
	"dryfour-nexus/database"
	"dryfour-nexus/models"
)

// ================================================================
// INICIALIZAÇÃO DO BANCO — sync.Once
// Garante que a conexão é tentada apenas UMA VEZ por container
// (warm starts reutilizam a mesma conexão sem overhead).
// ================================================================

var (
	dbOnce      sync.Once
	dbConnected bool
)

// initDB tenta conectar ao Neon PostgreSQL de forma segura.
// Em caso de falha (URL ausente, timeout, credencial errada),
// loga o aviso e define dbConnected=false → mock data será usado.
func initDB() {
	dbOnce.Do(func() {
		url := os.Getenv("NEON_DATABASE_URL")
		if url == "" {
			log.Println("[NEXUS] ℹ️  NEON_DATABASE_URL ausente — modo mock ativado")
			dbConnected = false
			return
		}

		// Tenta conectar com timeout de 8s (Vercel limita a 30s total)
		if err := database.Connect(url); err != nil {
			log.Printf("[NEXUS] ⚠️  Falha na conexão DB: %v — modo mock ativado", err)
			dbConnected = false
			return
		}

		dbConnected = true
		log.Println("[NEXUS] ✅ Neon PostgreSQL conectado (serverless)")
	})
}

// ================================================================
// API RESPONSE TYPES
// Definidos aqui para evitar dependência circular com controllers/
// ================================================================

type apiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Meta    *apiMeta    `json:"meta,omitempty"`
}

type apiMeta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// ================================================================
// CORS MIDDLEWARE
// Injeta os cabeçalhos CORS em todas as respostas da API.
// O vercel.json já trata OPTIONS, mas os cabeçalhos abaixo garantem
// que browsers não bloqueiem responses em qualquer cenário.
// ================================================================

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Content-Type", "application/json; charset=utf-8")

		// OPTIONS já foi tratado pelo vercel.json, mas por segurança:
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

// ================================================================
// HELPERS DE RESPOSTA JSON
// ================================================================

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("[NEXUS] JSON encode error: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, apiResponse{Success: false, Error: msg})
}

// ================================================================
// ROUTER INTERNO
// Distribui as requests pelo path sem depender de mux externo.
// O Vercel já roteou /api/* para esta função — aqui fazemos o
// sub-roteamento interno.
// ================================================================

func route(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	switch {
	// GET /api/health
	case path == "/api/health" || path == "/api/health/":
		handleHealth(w, r)

	// GET /api/categories
	case path == "/api/categories" || path == "/api/categories/":
		withCORS(handleCategories)(w, r)

	// GET /api/news/{id} — path com ID numérico
	case strings.HasPrefix(path, "/api/news/") && len(path) > len("/api/news/"):
		withCORS(handleNewsByID)(w, r)

	// GET /api/news (com ou sem trailing slash)
	case path == "/api/news" || path == "/api/news/":
		withCORS(handleNews)(w, r)

	// Rota não encontrada dentro de /api/
	default:
		writeError(w, http.StatusNotFound, "Endpoint não encontrado")
	}
}

// ================================================================
// HANDLER PRINCIPAL — EXPORTADO PARA O VERCEL
// Esta é a única função que o Vercel precisa enxergar.
// Naming convention obrigatória: `Handler` com H maiúsculo.
// ================================================================

// Handler é o entry point da Serverless Function do Vercel.
// O runtime vercel-community/go chama esta função para cada request
// que corresponde às rotas definidas em vercel.json.
func Handler(w http.ResponseWriter, r *http.Request) {
	// Inicializa DB na primeira invocação (sync.Once — thread-safe)
	initDB()

	// Log estruturado para o painel do Vercel
	log.Printf("[NEXUS] %s %s — UA: %s", r.Method, r.URL.Path, r.Header.Get("User-Agent"))

	// Distribui para o sub-router interno
	route(w, r)
}

// ================================================================
// HANDLER: GET /api/health
// Endpoint de verificação de saúde — sem autenticação, sem DB.
// Útil para o Vercel e para monitoramento externo (UptimeRobot etc).
// ================================================================

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "online",
		"service":   "Dryfour NEXUS",
		"version":   "2.1.0",
		"db":        dbConnected,
		"mode":      map[bool]string{true: "postgresql", false: "mock"}[dbConnected],
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// ================================================================
// HANDLER: GET /api/news
// Parâmetros: niche, page, per_page, sort, featured
//
// FALLBACK GARANTIDO:
//   models.GetAll() verifica internamente database.IsConnected().
//   Se false → usa mockPosts de models/post.go automaticamente.
//   O handler aqui nunca precisa checar o estado do banco.
// ================================================================

func handleNews(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	q := r.URL.Query()

	// Parse e sanitização de parâmetros
	niche := strings.ToLower(strings.TrimSpace(q.Get("niche")))
	sort  := strings.ToLower(strings.TrimSpace(q.Get("sort")))

	page, err := strconv.Atoi(q.Get("page"))
	if err != nil || page < 1 { page = 1 }

	perPage, err := strconv.Atoi(q.Get("per_page"))
	if err != nil || perPage < 1 { perPage = 12 }
	if perPage > 50              { perPage = 50 }

	// Validação de nicho (agora suporta os 8 nichos)
	validNiches := map[string]bool{
		"":             true,
		"all":          true,
		"default":      true,
		"ai":           true,
		"smarthome":    true,
		"architecture": true,
		"hardware":     true,
		"space":        true,
		"culture":      true,
		"sandbox":      true,
	}
	if !validNiches[niche] {
		writeError(w, http.StatusBadRequest, "Nicho inválido. Use: ai, smarthome, architecture, hardware, space, culture, sandbox")
		return
	}
	// Normaliza "all" e "default" → string vazia (sem filtro)
	if niche == "all" || niche == "default" {
		niche = ""
	}

	// Validação de ordenação
	validSorts := map[string]bool{"": true, "recent": true, "popular": true, "oldest": true}
	if !validSorts[sort] {
		sort = "recent"
	}

	filter := models.PostFilter{
		Niche:   niche,
		Page:    page,
		PerPage: perPage,
		Sort:    sort,
	}

	// GetAll usa mock se DB não estiver conectado — NUNCA retorna 500 por DB
	posts, total, err := models.GetAll(filter)
	if err != nil {
		log.Printf("[NEXUS] GetAll error: %v", err)
		writeError(w, http.StatusInternalServerError, "Erro interno ao buscar artigos")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(perPage)))
	if totalPages < 1 { totalPages = 1 }

	writeJSON(w, http.StatusOK, apiResponse{
		Success: true,
		Data:    posts,
		Meta: &apiMeta{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

// ================================================================
// HANDLER: GET /api/news/{id}
// Extrai o ID da URL e busca o artigo.
// Fallback automático para mock se DB indisponível.
// ================================================================

func handleNewsByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	// Extrai ID do path: /api/news/42 → "42"
	// Garante que trailing slashes não quebram o parse
	rawID := strings.TrimPrefix(r.URL.Path, "/api/news/")
	rawID  = strings.Trim(rawID, "/")

	id, err := strconv.Atoi(rawID)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "ID inválido — deve ser um número inteiro positivo")
		return
	}

	post, err := models.GetByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Artigo não encontrado")
		return
	}

	writeJSON(w, http.StatusOK, apiResponse{
		Success: true,
		Data:    post,
	})
}

// ================================================================
// HANDLER: GET /api/categories
// Lista os 8 nichos do sistema com metadados para o frontend.
// Estático — não precisa de DB.
// ================================================================

func handleCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	type category struct {
		Slug      string `json:"slug"`
		Label     string `json:"label"`
		Icon      string `json:"icon"`
		AccentHex string `json:"accent_hex"`
		BodyClass string `json:"body_class"`
	}

	cats := []category{
		{Slug: "default",      Label: "Página Inicial",          Icon: "fas fa-border-all",    AccentHex: "#00E5FF", BodyClass: "niche-default"},
		{Slug: "ai",           Label: "Inteligência & Software",  Icon: "fas fa-brain",         AccentHex: "#7A00FF", BodyClass: "niche-ai"},
		{Slug: "smarthome",    Label: "Smart Home & Domótica",    Icon: "fas fa-house-signal",  AccentHex: "#00F5D4", BodyClass: "niche-smarthome"},
		{Slug: "architecture", Label: "Arquitetura & Engenharia", Icon: "fas fa-building",      AccentHex: "#FF9F1C", BodyClass: "niche-architecture"},
		{Slug: "hardware",     Label: "Hardware Extremo & Quantum",Icon: "fas fa-microchip",    AccentHex: "#FF0055", BodyClass: "niche-hardware"},
		{Slug: "space",        Label: "Espaço & Ciência Profunda", Icon: "fas fa-satellite",    AccentHex: "#0049FF", BodyClass: "niche-space"},
		{Slug: "culture",      Label: "Cultura Sci-Fi & Futurismo",Icon: "fas fa-infinity",     AccentHex: "#FF00C8", BodyClass: "niche-culture"},
		{Slug: "sandbox",      Label: "Sandbox Experimental",     Icon: "fas fa-flask",         AccentHex: "#00FF66", BodyClass: "niche-sandbox"},
	}

	writeJSON(w, http.StatusOK, apiResponse{
		Success: true,
		Data:    cats,
	})
}
