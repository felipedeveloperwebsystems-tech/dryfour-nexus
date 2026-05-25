// ============================================================
// DRYFOUR NEXUS — controllers/news_controller.go
// Handlers JSON para a API de notícias
// Endpoint: GET /api/news?niche=ai&page=1&sort=popular
// ============================================================

package controllers

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"strings"

	"dryfour-nexus/models"
)

// APIResponse é o envelope padrão de resposta JSON
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

type CategoriesResponse struct {
	Categories []Category `json:"categories"`
}

type Category struct {
	Slug  string `json:"slug"`
	Label string `json:"label"`
	Icon  string `json:"icon"`
	Count int    `json:"count,omitempty"`
}

// ================================================================
// GET /api/news
// Query params: niche, page, per_page, sort, featured
// ================================================================

func GetNewsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	q := r.URL.Query()

	// Parse params
	niche   := strings.TrimSpace(q.Get("niche"))
	sort    := strings.TrimSpace(q.Get("sort"))
	page, _ := strconv.Atoi(q.Get("page"))
	per, _  := strconv.Atoi(q.Get("per_page"))

	if page < 1   { page = 1 }
	if per < 1    { per = 12 }
	if per > 50   { per = 50 }

	validNiches := map[string]bool{"": true, "all": true, "ai": true, "smarthome": true, "architecture": true, "sandbox": true}
	if !validNiches[niche] {
		writeError(w, http.StatusBadRequest, "Nicho inválido")
		return
	}

	validSorts := map[string]bool{"": true, "recent": true, "popular": true, "oldest": true}
	if !validSorts[sort] {
		sort = "recent"
	}

	filter := models.PostFilter{
		Niche:   niche,
		Page:    page,
		PerPage: per,
		Sort:    sort,
	}

	posts, total, err := models.GetAll(filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erro ao buscar artigos")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(per)))

	writeJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    posts,
		Meta: &Meta{
			Page:       page,
			PerPage:    per,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

// ================================================================
// GET /api/news/{id}
// ================================================================

func GetNewsByIDHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	// Extrai ID da URL: /api/news/42
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	id, err := strconv.Atoi(parts[2])
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	post, err := models.GetByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Artigo não encontrado")
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    post,
	})
}

// ================================================================
// GET /api/categories
// ================================================================

func GetCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Método não permitido")
		return
	}

	cats := []Category{
		{ Slug:"all",          Label:"Todos",          Icon:"fas fa-border-all" },
		{ Slug:"ai",           Label:"IA & Sci-Fi",    Icon:"fas fa-brain"      },
		{ Slug:"smarthome",    Label:"Smart Home",     Icon:"fas fa-house-signal" },
		{ Slug:"architecture", Label:"Arquitetura 3.0",Icon:"fas fa-building"   },
		{ Slug:"sandbox",      Label:"Sandbox",        Icon:"fas fa-flask"      },
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    CategoriesResponse{Categories: cats},
	})
}

// ================================================================
// HELPERS
// ================================================================

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, APIResponse{Success: false, Error: msg})
}
