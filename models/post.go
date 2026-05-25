// ============================================================
// DRYFOUR NEXUS — models/post.go
// Model de Post/Artigo com suporte a DB e mock data
// ============================================================

package models

import (
	"context"
	"fmt"
	"time"

	"dryfour-nexus/database"
)

// Post representa um artigo do blog Dryfour NEXUS
type Post struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Excerpt     string    `json:"excerpt"`
	Content     string    `json:"content,omitempty"`
	Niche       string    `json:"niche"`
	Author      string    `json:"author"`
	ImgURL      string    `json:"img_url"`
	ReadTime    int       `json:"read_time"`
	Views       int       `json:"views"`
	Comments    int       `json:"comments"`
	IsFeatured  bool      `json:"is_featured"`
	IsPopular   bool      `json:"is_popular"`
	PublishedAt time.Time `json:"published_at"`
}

// ================================================================
// MOCK DATA — Usado quando DB não está disponível
// ================================================================

var mockPosts = []Post{
	{
		ID: 1, Niche: "ai", Author: "Felipe Lima",
		Title:    "GPT-5 na prática: 30 dias testando o modelo que raciocina como humanos",
		Slug:     "gpt5-na-pratica-30-dias",
		Excerpt:  "Benchmarks reais, casos de uso críticos e os limites que nenhum review te contou.",
		ImgURL:   "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
		ReadTime: 12, Views: 12400, Comments: 87, IsFeatured: true, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -3),
	},
	{
		ID: 2, Niche: "smarthome", Author: "Tech Editorial",
		Title:    "Smart Home 2026: 10 dispositivos que automatizam sua casa sem quebrar o orçamento",
		Slug:     "smart-home-2026-10-dispositivos",
		Excerpt:  "Do básico ao avançado: curadoria dos melhores gadgets IoT do momento.",
		ImgURL:   "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
		ReadTime: 7, Views: 8200, Comments: 54, IsFeatured: true, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -3),
	},
	{
		ID: 3, Niche: "architecture", Author: "Dryfour Construção",
		Title:    "Drywall 3.0: o sistema modular que vai mudar como você constrói no Brasil",
		Slug:     "drywall-3-sistema-modular-brasil",
		Excerpt:  "Inovação no sistema seco: leveza, velocidade e sustentabilidade em um único sistema.",
		ImgURL:   "https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=600&q=80",
		ReadTime: 5, Views: 5600, Comments: 32, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -5),
	},
	{
		ID: 4, Niche: "ai", Author: "NEXUS Editorial",
		Title:    "Robótica cognitiva: máquinas que aprendem sozinhas com IA generativa",
		Slug:     "robotica-cognitiva-ia-generativa",
		Excerpt:  "Como a IA generativa está criando robôs com consciência adaptativa.",
		ImgURL:   "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
		ReadTime: 15, Views: 9800, Comments: 103, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -6),
	},
	{
		ID: 5, Niche: "smarthome", Author: "Tech Editorial",
		Title:    "Câmeras IoT são hackeadas: como proteger sua rede doméstica em 2026",
		Slug:     "cameras-iot-hackeadas-proteger-rede",
		Excerpt:  "Após incidentes de segurança com câmeras IP, especialistas revelam as melhores práticas.",
		ImgURL:   "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&q=80",
		ReadTime: 6, Views: 7100, Comments: 61, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -7),
	},
	{
		ID: 6, Niche: "architecture", Author: "Dryfour Construção",
		Title:    "Steel Frame no Brasil: construtores migram da alvenaria para o sistema seco",
		Slug:     "steel-frame-brasil-migracao-alvenaria",
		Excerpt:  "Custo-benefício, velocidade de obra e resistência sísmica explicam a migração crescente.",
		ImgURL:   "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
		ReadTime: 9, Views: 4300, Comments: 28, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -8),
	},
	{
		ID: 7, Niche: "ai", Author: "NEXUS Editorial",
		Title:    "Computação Quântica para não-cientistas: o guia definitivo",
		Slug:     "computacao-quantica-guia-definitivo",
		Excerpt:  "Qubits, superposição e entrelaçamento: desmistificamos a próxima revolução tecnológica.",
		ImgURL:   "https://images.unsplash.com/photo-1655635643532-fa9ba2648cbe?w=600&q=80",
		ReadTime: 18, Views: 14200, Comments: 145, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -9),
	},
	{
		ID: 8, Niche: "sandbox", Author: "NEXUS Labs",
		Title:    "Construímos um modelo de IA local com hardware de R$ 3.500",
		Slug:     "modelo-ia-local-hardware-3500",
		Excerpt:  "Tutorial completo: do hardware à inferência local com modelos open-source.",
		ImgURL:   "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600&q=80",
		ReadTime: 25, Views: 11300, Comments: 167, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -10),
	},
}

// ================================================================
// QUERIES
// ================================================================

// PostFilter define os filtros disponíveis
type PostFilter struct {
	Niche    string
	Page     int
	PerPage  int
	Sort     string // "recent" | "popular" | "oldest"
	Featured bool
}

// GetAll retorna posts com filtros e paginação
func GetAll(filter PostFilter) ([]Post, int, error) {
	if filter.Page < 1    { filter.Page = 1 }
	if filter.PerPage < 1 { filter.PerPage = 12 }

	// Modo mock (sem DB)
	if !database.IsConnected() {
		return getMockPosts(filter)
	}

	// Query PostgreSQL
	return getDBPosts(filter)
}

// GetByID retorna um post pelo ID
func GetByID(id int) (*Post, error) {
	if !database.IsConnected() {
		for _, p := range mockPosts {
			if p.ID == id {
				return &p, nil
			}
		}
		return nil, fmt.Errorf("post %d não encontrado", id)
	}
	return getDBPostByID(id)
}

// ================================================================
// MOCK IMPLEMENTATION
// ================================================================

func getMockPosts(f PostFilter) ([]Post, int, error) {
	filtered := []Post{}
	for _, p := range mockPosts {
		if f.Niche != "" && f.Niche != "all" && p.Niche != f.Niche { continue }
		if f.Featured && !p.IsFeatured { continue }
		filtered = append(filtered, p)
	}

	// Sort
	switch f.Sort {
	case "popular":
		// Já está parcialmente ordenado por views no mock
	case "oldest":
		for i, j := 0, len(filtered)-1; i < j; i, j = i+1, j-1 {
			filtered[i], filtered[j] = filtered[j], filtered[i]
		}
	}

	total := len(filtered)
	start := (f.Page - 1) * f.PerPage
	end   := start + f.PerPage
	if start >= total { return []Post{}, total, nil }
	if end > total    { end = total }
	return filtered[start:end], total, nil
}

// ================================================================
// DB IMPLEMENTATION (PostgreSQL / Neon)
// ================================================================

func getDBPosts(f PostFilter) ([]Post, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Query de contagem
	countQuery := `SELECT COUNT(*) FROM posts WHERE ($1 = '' OR niche = $1)`
	var total int
	if err := database.DB.QueryRow(ctx, countQuery, f.Niche).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count query: %w", err)
	}

	// Order by
	orderBy := "published_at DESC"
	switch f.Sort {
	case "popular": orderBy = "views DESC"
	case "oldest":  orderBy = "published_at ASC"
	}

	offset := (f.Page - 1) * f.PerPage
	query := fmt.Sprintf(`
		SELECT id, title, slug, excerpt, niche, author, img_url, read_time,
		       views, comments, is_featured, is_popular, published_at
		FROM posts
		WHERE ($1 = '' OR niche = $1)
		ORDER BY %s
		LIMIT $2 OFFSET $3
	`, orderBy)

	rows, err := database.DB.Query(ctx, query, f.Niche, f.PerPage, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("posts query: %w", err)
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var p Post
		if err := rows.Scan(
			&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Niche, &p.Author,
			&p.ImgURL, &p.ReadTime, &p.Views, &p.Comments,
			&p.IsFeatured, &p.IsPopular, &p.PublishedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scanning post: %w", err)
		}
		posts = append(posts, p)
	}
	return posts, total, nil
}

func getDBPostByID(id int) (*Post, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var p Post
	err := database.DB.QueryRow(ctx, `
		SELECT id, title, slug, excerpt, content, niche, author, img_url,
		       read_time, views, comments, is_featured, is_popular, published_at
		FROM posts WHERE id = $1
	`, id).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content, &p.Niche, &p.Author,
		&p.ImgURL, &p.ReadTime, &p.Views, &p.Comments,
		&p.IsFeatured, &p.IsPopular, &p.PublishedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get post by id: %w", err)
	}

	// Incrementa view count
	go func() {
		ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel2()
		_, _ = database.DB.Exec(ctx2, "UPDATE posts SET views = views + 1 WHERE id = $1", id)
	}()

	return &p, nil
}
