// ============================================================
// DRYFOUR NEXUS — main.go
// Servidor Golang com roteamento nativo, static files e JSON API
// Compatível com Railway e Vercel deployments
// ============================================================

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"dryfour-nexus/database"
	"dryfour-nexus/controllers"

	"github.com/joho/godotenv"
)

// ================================================================
// MIDDLEWARE: CORS + Cache Headers
// ================================================================

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func jsonMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next(w, r)
	}
}

// ================================================================
// RESPONSE HELPERS
// ================================================================

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

type Meta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("[NEXUS] JSON encode error: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, APIResponse{Success: false, Error: msg})
}

// ================================================================
// STATIC FILE SERVER (public/ folder)
// Serve index.html para todas as rotas SPA não-API
// ================================================================

func staticFileServer(publicDir string) http.Handler {
	fs := http.FileServer(http.Dir(publicDir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Cache de assets estáticos
		ext := filepath.Ext(r.URL.Path)
		switch ext {
		case ".css", ".js":
			w.Header().Set("Cache-Control", "public, max-age=86400")
		case ".woff2", ".woff", ".ttf":
			w.Header().Set("Cache-Control", "public, max-age=604800")
		case ".jpg", ".jpeg", ".png", ".webp", ".svg", ".ico":
			w.Header().Set("Cache-Control", "public, max-age=604800")
		}

		// Se arquivo não existe, serve index.html (SPA fallback)
		fullPath := filepath.Join(publicDir, r.URL.Path)
		if _, err := os.Stat(fullPath); os.IsNotExist(err) && ext == "" {
			http.ServeFile(w, r, filepath.Join(publicDir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})
}

// ================================================================
// HEALTH CHECK
// ================================================================

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "online",
		"service":   "Dryfour NEXUS",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// ================================================================
// ROUTER SETUP
// ================================================================

func setupRouter(publicDir string) http.Handler {
	mux := http.NewServeMux()

	// --- API Routes ---
	mux.HandleFunc("/api/health",       jsonMiddleware(healthHandler))
	mux.HandleFunc("/api/news",         jsonMiddleware(controllers.GetNewsHandler))
	mux.HandleFunc("/api/news/",        jsonMiddleware(controllers.GetNewsByIDHandler))
	mux.HandleFunc("/api/categories",   jsonMiddleware(controllers.GetCategoriesHandler))

	// --- Static Files (SPA) ---
	mux.Handle("/", staticFileServer(publicDir))

	return corsMiddleware(mux)
}

// ================================================================
// MAIN
// ================================================================

func main() {
	// Carrega variáveis de ambiente do .env (ignora erro em produção)
	if err := godotenv.Load(); err != nil {
		log.Println("[NEXUS] .env não encontrado — usando variáveis de ambiente do sistema")
	}

	// Porta
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if _, err := strconv.Atoi(port); err != nil {
		log.Fatalf("[NEXUS] PORT inválida: %s", port)
	}

	// Diretório público
	publicDir := os.Getenv("PUBLIC_DIR")
	if publicDir == "" {
		publicDir = "./public"
	}
	if _, err := os.Stat(publicDir); os.IsNotExist(err) {
		log.Fatalf("[NEXUS] Diretório público não encontrado: %s", publicDir)
	}

	// Conecta ao banco de dados (Neon PostgreSQL)
	dbURL := os.Getenv("NEON_DATABASE_URL")
	if dbURL != "" {
		if err := database.Connect(dbURL); err != nil {
			log.Printf("[NEXUS] ⚠️  DB connection failed: %v — rodando sem banco", err)
		} else {
			log.Println("[NEXUS] ✅ Neon PostgreSQL conectado")
			defer database.Close()
		}
	} else {
		log.Println("[NEXUS] ℹ️  NEON_DATABASE_URL não definida — rodando em modo mock")
	}

	// Servidor
	addr := fmt.Sprintf(":%s", port)
	server := &http.Server{
		Addr:         addr,
		Handler:      setupRouter(publicDir),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("[NEXUS] 🚀 Servidor rodando em http://localhost%s", addr)
	log.Printf("[NEXUS] 📁 Servindo arquivos de: %s", publicDir)
	log.Printf("[NEXUS] 🔗 API disponível em: http://localhost%s/api/news", addr)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("[NEXUS] Erro fatal: %v", err)
	}
}
