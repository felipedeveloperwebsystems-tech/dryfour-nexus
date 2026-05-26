// ============================================================
// DRYFOUR NEXUS — main.go
// Servidor local (go run main.go / go build)
// NO VERCEL: este arquivo é ignorado — o Vercel usa api/index.go
// ============================================================

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"dryfour-nexus/controllers"
	"dryfour-nexus/database"

	"github.com/joho/godotenv"
)

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

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "online",
		"service":   "Dryfour NEXUS",
		"version":   "2.1.0",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func staticFileServer(publicDir string) http.Handler {
	fs := http.FileServer(http.Dir(publicDir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ext := filepath.Ext(r.URL.Path)
		switch ext {
		case ".css", ".js":
			w.Header().Set("Cache-Control", "public, max-age=86400")
		case ".woff2", ".woff", ".ttf":
			w.Header().Set("Cache-Control", "public, max-age=604800")
		case ".jpg", ".jpeg", ".png", ".webp", ".svg", ".ico":
			w.Header().Set("Cache-Control", "public, max-age=604800")
		}
		fullPath := filepath.Join(publicDir, r.URL.Path)
		if _, err := os.Stat(fullPath); os.IsNotExist(err) && ext == "" {
			http.ServeFile(w, r, filepath.Join(publicDir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})
}

func setupRouter(publicDir string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health",     jsonMiddleware(healthHandler))
	mux.HandleFunc("/api/news",       jsonMiddleware(controllers.GetNewsHandler))
	mux.HandleFunc("/api/news/",      jsonMiddleware(controllers.GetNewsByIDHandler))
	mux.HandleFunc("/api/categories", jsonMiddleware(controllers.GetCategoriesHandler))
	mux.Handle("/", staticFileServer(publicDir))
	return corsMiddleware(mux)
}

func main() {
	// Carrega .env apenas em desenvolvimento local
	if err := godotenv.Load(); err != nil {
		log.Println("[NEXUS] .env não encontrado — usando variáveis de ambiente do sistema")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	publicDir := os.Getenv("PUBLIC_DIR")
	if publicDir == "" {
		publicDir = "./public"
	}

	// CORREÇÃO: log.Printf em vez de log.Fatalf
	// Sem pasta public/ → avisa mas não trava o processo
	if _, err := os.Stat(publicDir); os.IsNotExist(err) {
		log.Printf("[NEXUS] ⚠️  Diretório público não encontrado: %s (modo API-only)", publicDir)
		publicDir = ""
	}

	dbURL := os.Getenv("NEON_DATABASE_URL")
	if dbURL != "" {
		if err := database.Connect(dbURL); err != nil {
			log.Printf("[NEXUS] ⚠️  DB connection failed: %v — rodando sem banco", err)
		} else {
			log.Println("[NEXUS] ✅ Neon PostgreSQL conectado")
			defer database.Close()
		}
	} else {
		log.Println("[NEXUS] ℹ️  NEON_DATABASE_URL não definida — modo mock")
	}

	var handler http.Handler
	if publicDir != "" {
		handler = setupRouter(publicDir)
	} else {
		// Modo API-only sem pasta public/
		mux := http.NewServeMux()
		mux.HandleFunc("/api/health",     jsonMiddleware(healthHandler))
		mux.HandleFunc("/api/news",       jsonMiddleware(controllers.GetNewsHandler))
		mux.HandleFunc("/api/news/",      jsonMiddleware(controllers.GetNewsByIDHandler))
		mux.HandleFunc("/api/categories", jsonMiddleware(controllers.GetCategoriesHandler))
		handler = corsMiddleware(mux)
	}

	addr := fmt.Sprintf(":%s", port)
	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("[NEXUS] 🚀 Servidor rodando em http://localhost%s", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("[NEXUS] Erro fatal: %v", err)
	}
}
