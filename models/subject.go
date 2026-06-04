// ============================================================
// DRYFOUR BLOG — models/subject.go
// Model para subjects (disciplinas/nichos) e edu_content
//
// Criado na Fase 1 para suportar os endpoints:
//   GET /api/subjects?category=aprender
//   GET /api/edu?subject=matematica&topic=Operações
//
// FALLBACK AUTOMÁTICO:
//   Assim como post.go, se o banco não estiver conectado,
//   retorna dados estáticos de mockSubjects / mockEduContent.
// ============================================================

package models

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"dryfour-nexus/database"
)

// ================================================================
// STRUCTS
// ================================================================

// Subject representa uma disciplina ou nicho do Aprender+
type Subject struct {
	ID          int             `json:"id"`
	CategoryID  int             `json:"category_id"`
	Name        string          `json:"name"`
	Slug        string          `json:"slug"`
	Description string          `json:"description"`
	Icon        string          `json:"icon"`
	ThemeClass  string          `json:"theme_class"`
	AccentHex   string          `json:"accent_hex"`
	SidebarJSON json.RawMessage `json:"sidebar_json"`
	SortOrder   int             `json:"sort_order"`
}

// EduContent representa um conteúdo educacional da seção Aprender+
type EduContent struct {
	ID           int       `json:"id"`
	SubjectID    int       `json:"subject_id"`
	Title        string    `json:"title"`
	Slug         string    `json:"slug"`
	Content      string    `json:"content"`
	Summary      string    `json:"summary"`
	Difficulty   string    `json:"difficulty"`
	DurationMin  int       `json:"duration_min"`
	SortOrder    int       `json:"sort_order"`
	SidebarGroup string    `json:"sidebar_group"`
	IsFree       bool      `json:"is_free"`
	PublishedAt  time.Time `json:"published_at"`
}

// ================================================================
// MOCK DATA — subjects Aprender+ (category = 2)
// Usado quando DB não está disponível.
// sidebar_json é o JSON bruto que o frontend usa para montar o accordion.
// ================================================================

var mockSubjects = []Subject{
	{ID: 8,  CategoryID: 2, Name: "Português",              Slug: "portugues",    Icon: "fas fa-book-open",    ThemeClass: "niche-culture",      AccentHex: "#FF00C8", SortOrder: 1,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Gramática","topicos":["Ortografia","Acentuação","Classes de Palavras","Sintaxe","Pontuação"]},{"nome":"Redação","topicos":["Dissertação","Argumentação","Coesão e Coerência","ENEM"]},{"nome":"Literatura","topicos":["Modernismo","Realismo","Romantismo","Barroco"]}]}`)},
	{ID: 9,  CategoryID: 2, Name: "Inglês",                 Slug: "ingles",       Icon: "fas fa-language",     ThemeClass: "niche-space",        AccentHex: "#0049FF", SortOrder: 2,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Gramática","topicos":["Verb Tenses","Modal Verbs","Conditionals","Passive Voice","Articles"]},{"nome":"Vocabulário","topicos":["Business English","Phrasal Verbs","Collocations","Idioms"]},{"nome":"Habilidades","topicos":["Speaking","Listening","Reading","Writing","Pronunciation"]}]}`)},
	{ID: 10, CategoryID: 2, Name: "Espanhol",               Slug: "espanhol",     Icon: "fas fa-globe-americas",ThemeClass: "niche-smarthome",    AccentHex: "#00F5D4", SortOrder: 3,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Gramática","topicos":["Verbos","Subjuntivo","Pronombres","Ser vs Estar","Género"]},{"nome":"Conversação","topicos":["Saludos","En el Restaurante","Viajes","Trabajo"]},{"nome":"Cultura","topicos":["Países hispanos","Música","Literatura"]}]}`)},
	{ID: 11, CategoryID: 2, Name: "Alemão",                 Slug: "alemao",       Icon: "fas fa-flag",         ThemeClass: "niche-hardware",     AccentHex: "#FF0055", SortOrder: 4,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Fundamentos","topicos":["Alphabet","Zahlen","Artikel","Kasus","Verben"]},{"nome":"Comunicação","topicos":["Begrüßung","Im Café","Reisen","Arbeit"]},{"nome":"Gramática","topicos":["Nominativ","Akkusativ","Dativ","Präpositionen"]}]}`)},
	{ID: 12, CategoryID: 2, Name: "Matemática",             Slug: "matematica",   Icon: "fas fa-calculator",   ThemeClass: "niche-architecture", AccentHex: "#FF9F1C", SortOrder: 5,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Básico","topicos":["Operações","Frações","Porcentagem","Regra de Três","Geometria Plana"]},{"nome":"Intermediário","topicos":["Funções","Equações","Trigonometria","Geometria Espacial","Progressões"]},{"nome":"Avançado","topicos":["Cálculo","Álgebra Linear","Estatística","Probabilidade"]}]}`)},
	{ID: 13, CategoryID: 2, Name: "Física",                 Slug: "fisica",       Icon: "fas fa-atom",         ThemeClass: "niche-ai",           AccentHex: "#7A00FF", SortOrder: 6,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Mecânica","topicos":["Cinemática","Dinâmica","Trabalho e Energia","Gravitação","Oscilações"]},{"nome":"Eletromagnetismo","topicos":["Eletrostática","Eletrodinâmica","Magnetismo","Ondas EM"]},{"nome":"Moderna","topicos":["Relatividade","Física Quântica","Óptica","Termodinâmica"]}]}`)},
	{ID: 14, CategoryID: 2, Name: "Química",                Slug: "quimica",      Icon: "fas fa-flask-vial",   ThemeClass: "niche-sandbox",      AccentHex: "#00FF66", SortOrder: 7,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Geral","topicos":["Tabela Periódica","Ligações Químicas","Soluções","Reações","Estequiometria"]},{"nome":"Orgânica","topicos":["Hidrocarbonetos","Funções Orgânicas","Isomeria","Polímeros"]},{"nome":"Físico-Química","topicos":["Termoquímica","Cinética","Equilíbrio","Eletroquímica"]}]}`)},
	{ID: 15, CategoryID: 2, Name: "Programação",            Slug: "programacao",  Icon: "fas fa-code",         ThemeClass: "niche-ai",           AccentHex: "#7A00FF", SortOrder: 8,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Fundamentos","topicos":["Lógica de Programação","Algoritmos","Estruturas de Dados","Git"]},{"nome":"Linguagens","topicos":["Python","JavaScript","Go","TypeScript","SQL"]},{"nome":"Avançado","topicos":["APIs REST","Banco de Dados","Docker","Cloud","IA com Python"]}]}`)},
	{ID: 16, CategoryID: 2, Name: "Eletrônica",             Slug: "eletronica",   Icon: "fas fa-microchip",    ThemeClass: "niche-hardware",     AccentHex: "#FF0055", SortOrder: 9,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Básico","topicos":["Componentes","Lei de Ohm","Resistores","Capacitores","Transistores"]},{"nome":"Prático","topicos":["Arduino","Raspberry Pi","Sensores","Motores","PWM"]},{"nome":"Robótica","topicos":["Servos","Controladores","Sensores IR","Bluetooth","Projetos"]}]}`)},
	{ID: 17, CategoryID: 2, Name: "Hobbies & Curiosidades", Slug: "hobbies",      Icon: "fas fa-puzzle-piece", ThemeClass: "niche-culture",      AccentHex: "#FF00C8", SortOrder: 10,
		SidebarJSON: json.RawMessage(`{"grupos":[{"nome":"Estratégia","topicos":["Xadrez Básico","Aberturas","Táticas","Finais","Gambitos"]},{"nome":"Cubo Mágico","topicos":["Método Iniciante","CFOP","OLL","PLL","Speedcubing"]},{"nome":"Outros","topicos":["Origami","Fotografia","Música","Pintura Digital","3D Printing"]}]}`)},
}

// mockEduContent — conteúdos educacionais de fallback
// Indexados por [subject_slug][topic_name]
var mockEduContent = map[string]map[string]EduContent{
	"matematica": {
		"Frações": {
			ID: 1, SubjectID: 12, Title: "Frações: do básico ao avançado",
			Slug: "fracoes-basico-avancado", Difficulty: "iniciante", DurationMin: 15,
			SidebarGroup: "Básico", IsFree: true,
			Summary: "Aprenda frações do zero: tipos, operações e aplicações no dia a dia.",
			Content: `<h2>O que são frações?</h2>
<p>Uma fração representa uma ou mais partes de um todo. É escrita na forma <strong>a/b</strong>, onde <strong>a</strong> é o numerador e <strong>b</strong> o denominador (b ≠ 0).</p>
<h3>Tipos de frações</h3>
<ul>
  <li><strong>Própria:</strong> numerador menor que denominador (ex: 3/4)</li>
  <li><strong>Imprópria:</strong> numerador maior que denominador (ex: 5/3)</li>
  <li><strong>Aparente:</strong> resultado é inteiro (ex: 6/2 = 3)</li>
  <li><strong>Mista:</strong> número inteiro + fração (ex: 1 2/3)</li>
</ul>
<h2>Operações com frações</h2>
<h3>Adição com denominadores iguais</h3>
<p>Some os numeradores e mantenha o denominador: <code>3/8 + 2/8 = 5/8</code></p>
<h3>Adição com denominadores diferentes</h3>
<pre>1/2 + 1/3 = 3/6 + 2/6 = 5/6</pre>
<h3>Multiplicação</h3>
<pre>3/4 × 2/5 = 6/20 = 3/10</pre>
<h3>Divisão</h3>
<pre>3/4 ÷ 2/5 = 3/4 × 5/2 = 15/8</pre>`,
		},
	},
	"programacao": {
		"Python": {
			ID: 2, SubjectID: 15, Title: "Python: primeiros passos",
			Slug: "python-primeiros-passos", Difficulty: "iniciante", DurationMin: 30,
			SidebarGroup: "Linguagens", IsFree: true,
			Summary: "Aprenda Python do zero com exemplos práticos.",
			Content: `<h2>Por que Python?</h2>
<p>Python é usada em IA, automação, web e muito mais. Sintaxe clara e acessível.</p>
<h3>Primeiro programa</h3>
<pre>print("Olá, mundo!")</pre>
<h3>Variáveis</h3>
<pre>nome = "Felipe"
idade = 25
print(f"Nome: {nome}, Idade: {idade}")</pre>`,
		},
	},
	"ingles": {
		"Verb Tenses": {
			ID: 3, SubjectID: 9, Title: "Verb Tenses: todos os tempos verbais",
			Slug: "verb-tenses-completo", Difficulty: "intermediario", DurationMin: 25,
			SidebarGroup: "Gramática", IsFree: true,
			Summary: "Domine os tempos verbais em inglês de forma clara e prática.",
			Content: `<h2>Why are Verb Tenses important?</h2>
<p>Verb tenses tell us <strong>when</strong> an action happens.</p>
<h3>Simple Present</h3>
<pre>I study English every day.
She works at Dryfour.</pre>
<h3>Simple Past</h3>
<pre>I studied yesterday.</pre>`,
		},
	},
}

// ================================================================
// PUBLIC API
// ================================================================

// GetSubjectsByCategory retorna subjects filtrados por category slug.
// Fallback automático para mock se DB não estiver conectado.
func GetSubjectsByCategory(categorySlug string) ([]Subject, error) {
	if !database.IsConnected() {
		return getMockSubjects(categorySlug), nil
	}
	return getDBSubjectsByCategory(categorySlug)
}

// GetEduContent retorna um conteúdo educacional por subject slug e topic name.
// Fallback automático para mock se DB não estiver conectado.
func GetEduContent(subjectSlug, topic string) (*EduContent, error) {
	if !database.IsConnected() {
		return getMockEduContent(subjectSlug, topic)
	}
	return getDBEduContent(subjectSlug, topic)
}

// ================================================================
// MOCK IMPLEMENTATIONS
// ================================================================

func getMockSubjects(categorySlug string) []Subject {
	// "aprender" → retorna todos os subjects educacionais
	// "" ou "noticias" → retorna slice vazio (nichos do blog são gerenciados em handleCategories)
	if categorySlug == "aprender" || categorySlug == "" {
		return mockSubjects
	}
	return []Subject{}
}

func getMockEduContent(subjectSlug, topic string) (*EduContent, error) {
	if subMap, ok := mockEduContent[subjectSlug]; ok {
		if edu, ok := subMap[topic]; ok {
			result := edu // cópia local
			return &result, nil
		}
	}
	// Retorna conteúdo placeholder — nunca retorna erro para não quebrar o frontend
	placeholder := EduContent{
		Title:       topic,
		Slug:        topic,
		Difficulty:  "iniciante",
		DurationMin: 10,
		IsFree:      true,
		Summary:     fmt.Sprintf("Conteúdo sobre %s em breve.", topic),
		Content:     fmt.Sprintf("<h2>%s</h2><p>Este conteúdo está sendo preparado. Em breve estará disponível!</p>", topic),
	}
	return &placeholder, nil
}

// ================================================================
// DB IMPLEMENTATIONS
// ================================================================

func getDBSubjectsByCategory(categorySlug string) ([]Subject, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT s.id, s.category_id, s.name, s.slug, COALESCE(s.description,''),
		       s.icon, s.theme_class, s.accent_hex,
		       COALESCE(s.sidebar_json::text, '{}'),
		       s.sort_order
		FROM subjects s
		JOIN categories c ON c.id = s.category_id
		WHERE ($1 = '' OR c.slug = $1)
		  AND s.is_active = true
		ORDER BY s.sort_order ASC
	`

	rows, err := database.DB.Query(ctx, query, categorySlug)
	if err != nil {
		return nil, fmt.Errorf("subjects query: %w", err)
	}
	defer rows.Close()

	subjects := []Subject{}
	for rows.Next() {
		var s Subject
		var sidebarRaw string
		if err := rows.Scan(
			&s.ID, &s.CategoryID, &s.Name, &s.Slug, &s.Description,
			&s.Icon, &s.ThemeClass, &s.AccentHex, &sidebarRaw, &s.SortOrder,
		); err != nil {
			return nil, fmt.Errorf("scanning subject: %w", err)
		}
		s.SidebarJSON = json.RawMessage(sidebarRaw)
		subjects = append(subjects, s)
	}

	if len(subjects) == 0 {
		// Banco conectado mas sem dados → usa mock como fallback seguro
		return getMockSubjects(categorySlug), nil
	}

	return subjects, nil
}

func getDBEduContent(subjectSlug, topic string) (*EduContent, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var edu EduContent
	err := database.DB.QueryRow(ctx, `
		SELECT e.id, e.subject_id, e.title, e.slug,
		       COALESCE(e.content,''), COALESCE(e.summary,''),
		       e.difficulty, e.duration_min, e.sort_order,
		       COALESCE(e.sidebar_group,''), e.is_free, e.published_at
		FROM edu_content e
		JOIN subjects s ON s.id = e.subject_id
		WHERE s.slug = $1
		  AND (e.title = $2 OR e.slug = $2)
		LIMIT 1
	`, subjectSlug, topic).Scan(
		&edu.ID, &edu.SubjectID, &edu.Title, &edu.Slug,
		&edu.Content, &edu.Summary, &edu.Difficulty, &edu.DurationMin,
		&edu.SortOrder, &edu.SidebarGroup, &edu.IsFree, &edu.PublishedAt,
	)
	if err != nil {
		// Conteúdo não encontrado no banco → placeholder em vez de 404
		return getMockEduContent(subjectSlug, topic)
	}

	// Incrementa views de forma assíncrona
	go func() {
		ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel2()
		_, _ = database.DB.Exec(ctx2, "UPDATE edu_content SET views = views + 1 WHERE id = $1", edu.ID)
	}()

	return &edu, nil
}
