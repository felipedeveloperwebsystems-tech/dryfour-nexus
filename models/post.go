// ============================================================
// DRYFOUR NEXUS — models/post.go  v2.1
// Model de Post/Artigo com suporte a DB e mock data
//
// ATUALIZAÇÃO v2.1:
//   - mockPosts expandido para cobrir todos os 8 nichos do
//     sistema (default, ai, smarthome, architecture, hardware,
//     space, culture, sandbox).
//   - validNiches no filtro atualizado para os 8 nichos.
//   - Fallback automático: se database.IsConnected() == false,
//     usa mockPosts sem nenhuma configuração adicional.
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
// MOCK DATA — Cobre os 8 nichos do sistema v2.1
// Usado quando DB não está disponível (desenvolvimento, Vercel sem DB).
// As imagens usam Unsplash com parâmetros de qualidade otimizados.
// ================================================================

var mockPosts = []Post{
	// ── NICHO: ai ────────────────────────────────────────────
	{
		ID: 1, Niche: "ai", Author: "Felipe Lima",
		Title:    "GPT-5 na prática: 30 dias testando o modelo que raciocina como humanos",
		Slug:     "gpt5-na-pratica-30-dias",
		Excerpt:  "Benchmarks reais, casos de uso críticos e os limites que nenhum review te contou sobre a IA mais avançada de 2026.",
		ImgURL:   "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
		ReadTime: 12, Views: 12400, Comments: 87, IsFeatured: true, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -3),
	},
	{
		ID: 2, Niche: "ai", Author: "NEXUS Editorial",
		Title:    "Claude 4 vs GPT-5: comparativo honesto das IAs mais poderosas de 2026",
		Slug:     "claude4-vs-gpt5-comparativo",
		Excerpt:  "Testamos ambos em 50 tarefas do mundo real. Performance de código, raciocínio e custo-benefício — os resultados vão te surpreender.",
		ImgURL:   "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
		ReadTime: 14, Views: 9800, Comments: 103, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -6),
	},
	{
		ID: 3, Niche: "ai", Author: "NEXUS Editorial",
		Title:    "Computação Quântica para não-cientistas: o guia definitivo",
		Slug:     "computacao-quantica-guia-definitivo",
		Excerpt:  "Qubits, superposição e entrelaçamento: desmistificamos a próxima revolução tecnológica em linguagem acessível.",
		ImgURL:   "https://images.unsplash.com/photo-1655635643532-fa9ba2648cbe?w=600&q=80",
		ReadTime: 18, Views: 14200, Comments: 145, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -9),
	},

	// ── NICHO: smarthome ─────────────────────────────────────
	{
		ID: 4, Niche: "smarthome", Author: "Tech Editorial",
		Title:    "Smart Home 2026: 10 dispositivos que automatizam sua casa sem quebrar o orçamento",
		Slug:     "smart-home-2026-10-dispositivos",
		Excerpt:  "Do básico ao avançado: curadoria dos melhores gadgets IoT do momento para todos os bolsos.",
		ImgURL:   "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
		ReadTime: 7, Views: 8200, Comments: 54, IsFeatured: true, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -3),
	},
	{
		ID: 5, Niche: "smarthome", Author: "Tech Editorial",
		Title:    "Câmeras IoT hackeadas: guia definitivo para blindar sua rede doméstica em 2026",
		Slug:     "cameras-iot-hackeadas-proteger-rede",
		Excerpt:  "Após incidentes de segurança com câmeras IP, especialistas revelam as melhores práticas para proteger sua casa inteligente.",
		ImgURL:   "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&q=80",
		ReadTime: 6, Views: 7100, Comments: 61, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -7),
	},
	{
		ID: 6, Niche: "smarthome", Author: "NEXUS Editorial",
		Title:    "Matter 2.0: o protocolo que finalmente vai unificar todos os seus dispositivos IoT",
		Slug:     "matter-20-protocolo-unificado-iot",
		Excerpt:  "Apple, Google e Amazon chegam a acordo histórico. Veja como isso transforma o ecossistema de casa inteligente.",
		ImgURL:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
		ReadTime: 9, Views: 6300, Comments: 48, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -12),
	},

	// ── NICHO: architecture ───────────────────────────────────
	{
		ID: 7, Niche: "architecture", Author: "Dryfour Construção",
		Title:    "Drywall 3.0: o sistema modular que vai mudar como você constrói no Brasil",
		Slug:     "drywall-3-sistema-modular-brasil",
		Excerpt:  "Inovação no sistema seco: leveza, velocidade e sustentabilidade que reduzem custo em 30% sem abrir mão da qualidade.",
		ImgURL:   "https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=600&q=80",
		ReadTime: 5, Views: 5600, Comments: 32, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -5),
	},
	{
		ID: 8, Niche: "architecture", Author: "Dryfour Construção",
		Title:    "Steel Frame no Brasil: construtores migram da alvenaria para o sistema seco",
		Slug:     "steel-frame-brasil-migracao-alvenaria",
		Excerpt:  "Custo-benefício, velocidade de obra e resistência sísmica explicam a migração crescente para o sistema leve.",
		ImgURL:   "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
		ReadTime: 9, Views: 4300, Comments: 28, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -8),
	},

	// ── NICHO: hardware ───────────────────────────────────────
	{
		ID: 9, Niche: "hardware", Author: "NEXUS Editorial",
		Title:    "Quantum GPUs: como os chips Blackwell Ultra da NVIDIA vão redesenhar a indústria de computação em 2027",
		Slug:     "quantum-gpus-blackwell-ultra-nvidia",
		Excerpt:  "Arquitetura híbrida quântica-clássica, memória HBM4 e suporte nativo a inferência de 100B+ parâmetros. Análise técnica completa.",
		ImgURL:   "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80",
		ReadTime: 18, Views: 9800, Comments: 112, IsFeatured: true, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -4),
	},
	{
		ID: 10, Niche: "hardware", Author: "NEXUS Editorial",
		Title:    "AMD Ryzen 9 9950X quebra todos os recordes de single-core: testamos o limite",
		Slug:     "amd-ryzen-9950x-recordes-single-core",
		Excerpt:  "16 núcleos, 5.7 GHz boost e TDP de 170W. Avaliamos o processador mais rápido do mercado em cargas de trabalho reais.",
		ImgURL:   "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
		ReadTime: 14, Views: 9200, Comments: 98, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -14),
	},

	// ── NICHO: space ─────────────────────────────────────────
	{
		ID: 11, Niche: "space", Author: "NEXUS Editorial",
		Title:    "Starlink v3: como 10 Gbps por satélite vai mudar a conectividade rural em 2027",
		Slug:     "starlink-v3-10gbps-conectividade-rural",
		Excerpt:  "A terceira geração do Starlink promete latência de 10ms e banda que rivaliza com fibra óptica — mas a que custo?",
		ImgURL:   "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80",
		ReadTime: 6, Views: 7100, Comments: 43, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -7),
	},
	{
		ID: 12, Niche: "space", Author: "NEXUS Editorial",
		Title:    "Artemis V: NASA vai instalar o primeiro datacenter na órbita lunar em 2028",
		Slug:     "artemis-v-datacenter-orbita-lunar",
		Excerpt:  "A NASA revelou o plano técnico completo. Latência de 1.3 segundos, 10 PB de armazenamento e processamento distribuído no espaço.",
		ImgURL:   "https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=600&q=80",
		ReadTime: 9, Views: 6800, Comments: 57, IsFeatured: false, IsPopular: false,
		PublishedAt: time.Now().AddDate(0, 0, -8),
	},

	// ── NICHO: culture ────────────────────────────────────────
	{
		ID: 13, Niche: "culture", Author: "Felipe Lima",
		Title:    "O Manifesto Cyberpunk 2026: por que a estética distópica virou o design language da Big Tech",
		Slug:     "manifesto-cyberpunk-2026-design-big-tech",
		Excerpt:  "De Silicon Valley às interfaces de produto das maiores empresas do mundo, o cyberpunk deixou de ser nicho e se tornou padrão.",
		ImgURL:   "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
		ReadTime: 11, Views: 11500, Comments: 134, IsFeatured: true, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -4),
	},
	{
		ID: 14, Niche: "culture", Author: "NEXUS Editorial",
		Title:    "Os 15 jogos de ficção científica que moldaram o imaginário tecnológico da nossa geração",
		Slug:     "15-jogos-sci-fi-imaginario-tecnologico",
		Excerpt:  "De Deus Ex a Cyberpunk 2077: como os games sci-fi previram o futuro e moldaram a maneira como pensamos sobre tecnologia.",
		ImgURL:   "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600&q=80",
		ReadTime: 10, Views: 8900, Comments: 89, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -10),
	},

	// ── NICHO: sandbox ────────────────────────────────────────
	{
		ID: 15, Niche: "sandbox", Author: "NEXUS Labs",
		Title:    "Construímos um modelo de IA local com hardware de R$ 3.500 — tutorial completo",
		Slug:     "modelo-ia-local-hardware-3500",
		Excerpt:  "Do hardware à inferência: Ollama, Llama 3.3, ComfyUI e LM Studio configurados em uma máquina acessível.",
		ImgURL:   "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
		ReadTime: 25, Views: 11300, Comments: 167, IsFeatured: true, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -10),
	},
	{
		ID: 16, Niche: "sandbox", Author: "NEXUS Labs",
		Title:    "Robótica cognitiva: máquinas que aprendem sozinhas com IA generativa",
		Slug:     "robotica-cognitiva-ia-generativa",
		Excerpt:  "Como a IA generativa está criando robôs com consciência adaptativa. Montamos e programamos um protótipo completo.",
		ImgURL:   "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
		ReadTime: 15, Views: 9100, Comments: 78, IsFeatured: false, IsPopular: true,
		PublishedAt: time.Now().AddDate(0, 0, -15),
	},
}

// ================================================================
// QUERIES
// ================================================================

// PostFilter define os filtros disponíveis para GetAll
type PostFilter struct {
	Niche    string // "" ou "all" = sem filtro
	Page     int
	PerPage  int
	Sort     string // "recent" | "popular" | "oldest"
	Featured bool
}

// GetAll retorna posts com filtros e paginação.
// Fallback automático para mock se DB não estiver conectado.
func GetAll(filter PostFilter) ([]Post, int, error) {
	if filter.Page < 1    { filter.Page = 1 }
	if filter.PerPage < 1 { filter.PerPage = 12 }

	// FALLBACK: usa mock se DB não está disponível
	if !database.IsConnected() {
		return getMockPosts(filter)
	}

	return getDBPosts(filter)
}

// GetByID retorna um post pelo ID.
// Fallback automático para mock se DB não estiver conectado.
func GetByID(id int) (*Post, error) {
	if !database.IsConnected() {
		for _, p := range mockPosts {
			if p.ID == id {
				post := p // cópia local para evitar ponteiro para slice
				return &post, nil
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
		if f.Niche != "" && f.Niche != "all" && p.Niche != f.Niche {
			continue
		}
		if f.Featured && !p.IsFeatured {
			continue
		}
		filtered = append(filtered, p)
	}

	// Ordenação
	switch f.Sort {
	case "popular":
		// Ordenação por views (bubble sort simples — mock tem poucos itens)
		for i := 0; i < len(filtered)-1; i++ {
			for j := 0; j < len(filtered)-1-i; j++ {
				if filtered[j].Views < filtered[j+1].Views {
					filtered[j], filtered[j+1] = filtered[j+1], filtered[j]
				}
			}
		}
	case "oldest":
		// Inverte a ordem (mockPosts já é decrescente por data)
		for i, j := 0, len(filtered)-1; i < j; i, j = i+1, j-1 {
			filtered[i], filtered[j] = filtered[j], filtered[i]
		}
	default: // "recent" — manter ordem original (mais recente primeiro)
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
	var total int
	countQuery := `SELECT COUNT(*) FROM posts WHERE ($1 = '' OR niche = $1)`
	if err := database.DB.QueryRow(ctx, countQuery, f.Niche).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count query: %w", err)
	}

	// Order by dinâmico (seguro pois validado antes de chegar aqui)
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

	// Incrementa view count de forma assíncrona (não bloqueia a response)
	go func() {
		ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel2()
		_, _ = database.DB.Exec(ctx2, "UPDATE posts SET views = views + 1 WHERE id = $1", id)
	}()

	return &p, nil
}

// GetBySlug retorna um post pelo slug único.
// Usado para URLs semânticas: /artigo.html?slug=drywall-3-sistema-modular-brasil
// Fallback automático para mock se DB não estiver conectado.
func GetBySlug(slug string) (*Post, error) {
	if slug == "" {
		return nil, fmt.Errorf("slug não pode ser vazio")
	}
	if !database.IsConnected() {
		for _, p := range mockPosts {
			if p.Slug == slug {
				post := p // cópia local para evitar ponteiro para slice
				return &post, nil
			}
		}
		return nil, fmt.Errorf("post com slug '%s' não encontrado", slug)
	}
	return getDBPostBySlug(slug)
}

func getDBPostBySlug(slug string) (*Post, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var p Post
	err := database.DB.QueryRow(ctx, `
		SELECT id, title, slug, excerpt, content, niche, author, img_url,
		       read_time, views, comments, is_featured, is_popular, published_at
		FROM posts WHERE slug = $1
	`, slug).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content, &p.Niche, &p.Author,
		&p.ImgURL, &p.ReadTime, &p.Views, &p.Comments,
		&p.IsFeatured, &p.IsPopular, &p.PublishedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get post by slug: %w", err)
	}

	// Incrementa view count de forma assíncrona (não bloqueia a response)
	go func() {
		ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel2()
		_, _ = database.DB.Exec(ctx2, "UPDATE posts SET views = views + 1 WHERE id = $1", p.ID)
	}()

	return &p, nil
}
