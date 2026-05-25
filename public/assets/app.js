// ============================================================
// DRYFOUR NEXUS — app.js  v2.0
// Arquitetura Modular — Zero dependências externas
//
// MÓDULOS:
//   NexusState        — Estado global centralizado (8 nichos)
//   ThemeEngine       — Troca de temas, sincroniza sidebar + pills + nav
//   SidebarModule     — Drawer, accordion, overlay, ESC handler
//   TickerModule      — Ticker loop sem gap (fix: conteúdo duplicado)
//   HeroModule        — Hero dinâmico por nicho
//   GridModule        — Filtra bento-grid e renderiza latest feed
//   StoreModule       — Produtos do Dryfour Shopping por nicho
//   SandboxEngine     — Ferramentas isoladas (ROI, Drywall, IoT)
//   MonetizationEngine — Impression observer + click tracking
//   NewsletterModule  — Formulário com validação
//   HeaderModule      — Scroll shadow, search flyout
//   ToastSystem       — Notificações acessíveis
//
// BUGS CORRIGIDOS:
//   [1] Ticker: JS duplica → translateX(-50%) = loop perfeito
//   [2] Sidebar: accordion real (toggle + fechar ao abrir outro)
//   [3] Sidebar: ESC fecha, overlay fecha, focus-trap básico
//   [4] Theme: sidebar, pills e nav-links sincronizados via ThemeEngine
//   [5] Sandbox: módulo isolado sem side-effects no feed
//   [6] Mobile: nenhum scroll-hijacking
// ============================================================

'use strict';

/* ================================================================
   NEXUS STATE — Objeto de estado global centralizado
   Espelha o AppState do Dryfour Shopping, expandido para 8 nichos.
   ================================================================ */
const NexusState = {
  activeNiche:   'default',   // Um dos 8 nichos
  activeFilter:  'all',       // Sub-filtro dentro do nicho
  sidebarOpen:   false,       // Estado do sidebar drawer
  searchOpen:    false,       // Estado do search flyout (header)
  sortMode:      'recent',    // 'recent' | 'popular' | 'oldest'
  activeTool:    'calc',      // Ferramenta ativa no Sandbox
  searchQuery:   '',          // Termo de busca atual
  heroInterval:  null,        // Referência ao setInterval do hero
  monetization: {             // Rastreamento de monetização
    adImpressions:    0,
    adClicks:         0,
    affiliateViews:   0,
    affiliateClicks:  0,
    storeViews:       0,
    storeCTAs:        0,
    nicheChanges:     0,
  },
};

/* ================================================================
   CONFIGURAÇÃO DOS 8 NICHOS
   Usado por ThemeEngine, HeroModule, StoreModule e GridModule.
   ================================================================ */
const NICHES = {
  default: {
    label:    'NEXUS',
    tagLabel: 'DESTAQUE DO DIA',
    nicheTag: 'Global',
    bodyClass: 'niche-default',
    hero: {
      title:   'IA Quântica: o próximo salto na computação que vai redefinir a realidade digital',
      excerpt: 'Pesquisadores do MIT revelam processadores neurais que superam em 400x os modelos LLM atuais. O futuro da inteligência artificial nunca esteve tão próximo — e tão imprevisível.',
      img:     'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&q=80',
      readTime: 8,
    },
  },
  ai: {
    label:    'IA & SOFTWARE',
    tagLabel: 'ESPECIAL IA',
    nicheTag: 'Inteligência & Software',
    bodyClass: 'niche-ai',
    hero: {
      title:   'Claude 4 vs GPT-5: comparativo honesto das IAs mais poderosas de 2026',
      excerpt: 'Testamos ambos em 50 tarefas do mundo real. Performance de código, raciocínio, criatividade e custo-benefício — os resultados vão te surpreender.',
      img:     'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=80',
      readTime: 14,
    },
  },
  smarthome: {
    label:    'SMART HOME',
    tagLabel: 'IOT EM FOCO',
    nicheTag: 'Smart Home & Domótica',
    bodyClass: 'niche-smarthome',
    hero: {
      title:   'Matter 2.0: o protocolo que finalmente vai unificar todos os seus dispositivos IoT',
      excerpt: 'Apple, Google e Amazon chegam a acordo histórico. Veja como isso transforma o ecossistema de casa inteligente — e o que muda para o consumidor agora.',
      img:     'https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=80',
      readTime: 9,
    },
  },
  architecture: {
    label:    'ARQUITETURA',
    tagLabel: 'CONSTRUÇÃO 3.0',
    nicheTag: 'Arquitetura & Engenharia',
    bodyClass: 'niche-architecture',
    hero: {
      title:   'Revolução no canteiro: como o Drywall 3.0 está redesenhando a construção civil no Brasil',
      excerpt: 'Sistemas modulares inteligentes, integração IoT e sustentabilidade que reduzem custo em 30% sem abrir mão da qualidade estrutural.',
      img:     'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=900&q=80',
      readTime: 10,
    },
  },
  hardware: {
    label:    'HARDWARE',
    tagLabel: 'DEEP DIVE TÉCNICO',
    nicheTag: 'Hardware Extremo & Quantum',
    bodyClass: 'niche-hardware',
    hero: {
      title:   'Quantum GPUs: como os chips Blackwell Ultra da NVIDIA vão redesenhar toda a indústria de computação em 2027',
      excerpt: 'Arquitetura híbrida quântica-clássica, memória HBM4 e suporte nativo a inferência de 100B+ parâmetros. Análise técnica completa.',
      img:     'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=900&q=80',
      readTime: 18,
    },
  },
  space: {
    label:    'ESPAÇO',
    tagLabel: 'AEROESPACIAL',
    nicheTag: 'Espaço & Ciência Profunda',
    bodyClass: 'niche-space',
    hero: {
      title:   'Artemis V vai instalar o primeiro datacenter na órbita lunar — e muda tudo sobre conectividade espacial',
      excerpt: 'A NASA revelou o plano técnico completo. Latência de 1.3 segundos, armazenamento de 10 PB e processamento de missões diretamente na órbita lunar.',
      img:     'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=900&q=80',
      readTime: 12,
    },
  },
  culture: {
    label:    'CULTURA',
    tagLabel: 'ESPECIAL CYBERPUNK',
    nicheTag: 'Cultura Sci-Fi & Futurismo',
    bodyClass: 'niche-culture',
    hero: {
      title:   'O Manifesto Cyberpunk 2026: por que a estética distópica virou o design language da Big Tech',
      excerpt: 'De Silicon Valley às interfaces de produto das maiores empresas do mundo, o cyberpunk deixou de ser nicho e se tornou a linguagem visual da era da IA.',
      img:     'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
      readTime: 11,
    },
  },
  sandbox: {
    label:    'SANDBOX',
    tagLabel: 'LABORATÓRIO NEXUS',
    nicheTag: 'Sandbox Experimental',
    bodyClass: 'niche-sandbox',
    hero: {
      title:   'Construímos um modelo de IA local com hardware de R$ 3.500 — tutorial completo do zero',
      excerpt: 'Ollama, Llama 3.3, ComfyUI e LM Studio configurados em máquina acessível. Todos os comandos, todas as configurações, todos os resultados.',
      img:     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
      readTime: 25,
    },
  },
};

/* ================================================================
   DATABASE DE ARTIGOS
   12 artigos cobrindo todos os 8 nichos.
   Em produção: substituir por AJAX call ao /api/news endpoint Golang.
   ================================================================ */
const ARTICLES_DB = [
  { id:1,  niche:'ai',           title:'GPT-5 na prática: 30 dias testando o modelo que raciocina como humanos',           img:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80', readTime:12, date:'22 Mai 2026', views:12400, popular:true  },
  { id:2,  niche:'smarthome',    title:'Smart Home 2026: 10 dispositivos que automatizam sua casa sem quebrar o orçamento', img:'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', readTime:7,  date:'22 Mai 2026', views:8200,  popular:true  },
  { id:3,  niche:'architecture', title:'Drywall 3.0: o sistema modular que vai mudar como você constrói no Brasil',         img:'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=600&q=80', readTime:5,  date:'20 Mai 2026', views:5600,  popular:false },
  { id:4,  niche:'hardware',     title:'Quantum GPUs: como Blackwell Ultra vai redesenhar toda a indústria de computação',  img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80', readTime:18, date:'19 Mai 2026', views:9800,  popular:true  },
  { id:5,  niche:'space',        title:'Starlink v3: como 10 Gbps por satélite muda a conectividade rural em 2027',         img:'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80', readTime:6,  date:'18 Mai 2026', views:7100,  popular:false },
  { id:6,  niche:'culture',      title:'Manifesto Cyberpunk 2026: a estética distópica virou o design language da Big Tech', img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', readTime:11, date:'17 Mai 2026', views:11500, popular:true  },
  { id:7,  niche:'space',        title:'Artemis V: NASA vai instalar o primeiro datacenter na órbita lunar em 2028',          img:'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=600&q=80', readTime:9,  date:'17 Mai 2026', views:6800,  popular:false },
  { id:8,  niche:'smarthome',    title:'Câmeras IoT hackeadas: guia definitivo para blindar sua rede doméstica em 2026',    img:'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&q=80', readTime:6,  date:'18 Mai 2026', views:7100,  popular:false },
  { id:9,  niche:'architecture', title:'Steel Frame no Brasil: por que construtores migram da alvenaria para o sistema seco',img:'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', readTime:9,  date:'17 Mai 2026', views:4300,  popular:false },
  { id:10, niche:'culture',      title:'Os 15 jogos sci-fi que moldaram o imaginário tecnológico da nossa geração',          img:'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600&q=80', readTime:10, date:'16 Mai 2026', views:8900,  popular:true  },
  { id:11, niche:'sandbox',      title:'Construímos um modelo de IA local com hardware de R$ 3.500 — tutorial completo',     img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80', readTime:25, date:'15 Mai 2026', views:11300, popular:true  },
  { id:12, niche:'hardware',     title:'AMD Ryzen 9 9950X quebra todos os recordes de single-core: testamos o limite',       img:'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', readTime:14, date:'14 Mai 2026', views:9200,  popular:true  },
];

/* ================================================================
   STORE PRODUCTS — Por nicho
   ================================================================ */
const STORE_PRODUCTS = {
  default:      [
    { name:'RTX 4090 24GB VRAM',   price:'R$ 10.499', img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' },
    { name:'Monitor 4K 144Hz IPS', price:'R$ 1.849',  img:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=200&q=80' },
    { name:'SSD NVMe 2TB Gen4',    price:'R$ 649',    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'  },
  ],
  ai:           [
    { name:'AMD Ryzen 9 7950X',    price:'R$ 4.199',  img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' },
    { name:'RAM DDR5 64GB 6000MHz',price:'R$ 1.299',  img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' },
    { name:'RTX 4090 24GB VRAM',   price:'R$ 10.499', img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' },
  ],
  smarthome:    [
    { name:'Hub Zigbee Smart',     price:'R$ 289',    img:'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&q=80'  },
    { name:'Câmera 360° WiFi IA', price:'R$ 549',    img:'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=200&q=80'  },
    { name:'Fechadura Biométrica', price:'R$ 549',    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'  },
  ],
  architecture: [
    { name:'Furadeira de Impacto 20V', price:'R$ 399', img:'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&q=80' },
    { name:'Kit Drywall Completo',     price:'R$ 1.299',img:'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=200&q=80' },
    { name:'Nível a Laser 360°',       price:'R$ 489',  img:'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&q=80' },
  ],
  hardware:     [
    { name:'RTX 4090 24GB VRAM',   price:'R$ 10.499', img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' },
    { name:'AMD Ryzen 9 9950X',    price:'R$ 5.499',  img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' },
    { name:'Cooler Liquid 360mm',  price:'R$ 849',    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'  },
  ],
  space:        [
    { name:'Telescópio Smart WiFi',price:'R$ 2.299',  img:'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=200&q=80' },
    { name:'Drone Profissional 4K',price:'R$ 3.499',  img:'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&q=80' },
    { name:'Antena Starlink Gen3', price:'R$ 2.799',  img:'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&q=80' },
  ],
  culture:      [
    { name:'Teclado Mecânico RGB', price:'R$ 649',    img:'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=200&q=80' },
    { name:'Headset 7.1 Surround', price:'R$ 799',    img:'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80' },
    { name:'Monitor Gamer 240Hz',  price:'R$ 1.299',  img:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=200&q=80' },
  ],
  sandbox:      [
    { name:'Raspberry Pi 5 8GB',   price:'R$ 549',    img:'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=200&q=80' },
    { name:'Arduino Mega Pro Kit', price:'R$ 189',    img:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80'  },
    { name:'Câmera USB 4K AI',     price:'R$ 349',    img:'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80' },
  ],
};

/* ================================================================
   TICKER DATA
   ================================================================ */
const TICKER_ITEMS = [
  { icon:'fas fa-brain',         text:'IA Quântica ultrapassa modelos LLM em 400x — MIT confirma' },
  { icon:'fas fa-house-signal',  text:'Matter 2.0 lançado — Apple, Google e Amazon unificados' },
  { icon:'fas fa-bolt',          text:'Dryfour Shopping: RTX 4090 com 19% off — oferta relâmpago' },
  { icon:'fas fa-building',      text:'Steel Frame cresce 340% em adoção no Brasil em 2026' },
  { icon:'fas fa-microchip',     text:'AMD Ryzen 9 9950X quebra recorde de single-core histórico' },
  { icon:'fas fa-satellite',     text:'SpaceX Starlink v3: 10 Gbps para residências previsto para 2027' },
  { icon:'fas fa-flask',         text:'Sandbox NEXUS: novo estimador de drywall disponível agora' },
  { icon:'fas fa-shield-alt',    text:'Vulnerabilidade crítica em câmeras IoT: atualize o firmware' },
  { icon:'fas fa-infinity',      text:'Manifesto Cyberpunk 2026: a estética que dominou o design da IA' },
  { icon:'fas fa-atom',          text:'IBM lança chip quântico de 1000 qubits para uso comercial' },
];

/* ================================================================
   THEME ENGINE
   Sincroniza: body class, sidebar items, cat pills, nav links,
   niche badge, hero e store showcase.
   ================================================================ */
const ThemeEngine = {
  /**
   * set(niche) — ponto central de troca de tema.
   * Chamado por NavModule, SidebarModule e cat pills.
   * Após a troca, despacha um CustomEvent 'nexus:niche-change'.
   */
  set(niche) {
    if (!NICHES[niche]) {
      console.warn(`[ThemeEngine] Nicho desconhecido: "${niche}"`);
      return;
    }

    const prev = NexusState.activeNiche;
    NexusState.activeNiche = niche;
    NexusState.monetization.nicheChanges++;

    // ── 1. Body class ──
    const allClasses = Object.values(NICHES).map(n => n.bodyClass);
    document.body.classList.remove(...allClasses);
    document.body.classList.add(NICHES[niche].bodyClass);

    // ── 2. Cat pills (horizontal filter bar) ──
    document.querySelectorAll('.cat-pill').forEach(pill => {
      const isActive = pill.dataset.niche === niche;
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      pill.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // ── 3. Nav links desktop ──
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active-nav', link.dataset.niche === niche);
    });

    // ── 4. Sidebar: highlight niche item ──
    document.querySelectorAll('.sniche-header').forEach(btn => {
      const item = btn.closest('.sniche-item');
      btn.classList.toggle('active-sniche', item?.dataset.niche === niche);
    });

    // ── 5. Sidebar sub-links: mark active niche sub-links ──
    document.querySelectorAll('.sub-link').forEach(link => {
      link.classList.toggle('active-sub', link.dataset.niche === niche);
    });

    // ── 6. Niche badge no header ──
    const badge = document.getElementById('nicheLabelBadge');
    if (badge) badge.textContent = NICHES[niche].label;

    // ── 7. Hero update ──
    HeroModule.update(niche);

    // ── 8. Store showcase ──
    StoreModule.render(niche);

    // ── 9. Grid filter ──
    GridModule.filter(niche);

    // ── 10. Toast notification ──
    const toastMap = {
      default: 'Feed global — todos os nichos',
      ai:      'Inteligência & Software ativado',
      smarthome: 'Smart Home & Domótica ativado',
      architecture: 'Arquitetura & Engenharia ativado',
      hardware: 'Hardware Extremo & Quantum ativado',
      space:   'Espaço & Ciência ativado',
      culture: 'Cultura Sci-Fi & Futurismo ativado',
      sandbox: 'Sandbox Experimental ativado',
    };
    if (prev !== niche) {
      showToast(toastMap[niche] || 'Tema alterado', 'info');
    }

    // ── 11. Custom Event (extensível) ──
    document.dispatchEvent(new CustomEvent('nexus:niche-change', {
      detail: { niche, prev },
    }));

    MonetizationEngine.track('niche-change', { niche, prev });
  },
};

/* ================================================================
   SIDEBAR MODULE
   Controla o drawer lateral: open/close, accordion, overlay,
   ESC interceptor, search filtering.
   ================================================================ */
const SidebarModule = {
  sidebar:  null,
  overlay:  null,
  hamBtn:   null,
  closeBtn: null,

  init() {
    this.sidebar  = document.getElementById('nexusSidebar');
    this.overlay  = document.getElementById('sidebarOverlay');
    this.hamBtn   = document.getElementById('hamburgerBtn');
    this.closeBtn = document.getElementById('sidebarCloseBtn');

    if (!this.sidebar) return;

    // Hamburger — abre
    this.hamBtn?.addEventListener('click', () => this.open());

    // Close button
    this.closeBtn?.addEventListener('click', () => this.close());

    // Overlay click — fecha
    this.overlay?.addEventListener('click', () => this.close());

    // ESC key — fecha
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && NexusState.sidebarOpen) this.close();
    });

    // Accordion dos nichos
    this._initAccordion();

    // Sub-links: muda nicho + fecha sidebar
    this._initSubLinks();

    // Search no sidebar
    this._initSearch();

    // Sort pills
    this._initSort();
  },

  open() {
    if (NexusState.sidebarOpen) return;
    NexusState.sidebarOpen = true;
    this.sidebar.classList.add('open');
    this.sidebar.setAttribute('aria-hidden', 'false');
    this.overlay?.classList.add('active');
    this.hamBtn?.classList.add('open');
    this.hamBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // previne scroll do body
    // Foca no close btn para acessibilidade
    setTimeout(() => this.closeBtn?.focus(), 50);
  },

  close() {
    if (!NexusState.sidebarOpen) return;
    NexusState.sidebarOpen = false;
    this.sidebar.classList.remove('open');
    this.sidebar.setAttribute('aria-hidden', 'true');
    this.overlay?.classList.remove('active');
    this.hamBtn?.classList.remove('open');
    this.hamBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // restaura scroll
    this.hamBtn?.focus(); // devolve foco ao hamburguer
  },

  /** Accordion: um item aberto por vez (comportamento real) */
  _initAccordion() {
    document.querySelectorAll('.sniche-header').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nicho = btn.closest('.sniche-item')?.dataset.niche;
        const subnav = document.getElementById(`sub-${nicho}`);
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Fecha todos os outros
        document.querySelectorAll('.sniche-header').forEach(b => {
          if (b !== btn) {
            b.setAttribute('aria-expanded', 'false');
            const otherNiche = b.closest('.sniche-item')?.dataset.niche;
            document.getElementById(`sub-${otherNiche}`)?.classList.remove('open');
          }
        });

        // Toggle este
        const newState = !isOpen;
        btn.setAttribute('aria-expanded', String(newState));
        subnav?.classList.toggle('open', newState);

        // Ativa o nicho correspondente ao clicar no header
        if (nicho) ThemeEngine.set(nicho);
      });
    });
  },

  /** Sub-links: mudam nicho, filter e fecham sidebar */
  _initSubLinks() {
    document.querySelectorAll('.sub-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const niche  = link.dataset.niche;
        const filter = link.dataset.filter || 'all';
        NexusState.activeFilter = filter;
        if (niche) ThemeEngine.set(niche);
        this.close();
        // Scroll suave para a grid
        document.getElementById('bentoSection')?.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });
  },

  /** Search dentro do sidebar filtra artigos em tempo real */
  _initSearch() {
    const input = document.getElementById('sidebarSearchInput');
    const clear = document.getElementById('sidebarSearchClear');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      NexusState.searchQuery = q;
      clear.style.display = q ? 'block' : 'none';
      GridModule.renderLatest(NexusState.activeNiche, q);
    });

    clear?.addEventListener('click', () => {
      input.value = '';
      NexusState.searchQuery = '';
      clear.style.display = 'none';
      GridModule.renderLatest(NexusState.activeNiche, '');
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this.close(); }
    });
  },

  /** Sort pills dentro do sidebar */
  _initSort() {
    document.querySelectorAll('.sort-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const sort = pill.dataset.sort;
        NexusState.sortMode = sort;
        document.querySelectorAll('.sort-pill').forEach(p => {
          p.classList.toggle('active', p.dataset.sort === sort);
          p.setAttribute('aria-pressed', p.dataset.sort === sort ? 'true' : 'false');
        });
        GridModule.renderLatest(NexusState.activeNiche, NexusState.searchQuery);
        showToast(`Ordenação: ${{ recent:'Recentes', popular:'Popular', oldest:'Antigos' }[sort]}`, 'info');
      });
    });
  },
};

/* ================================================================
   TICKER MODULE
   FIX CRÍTICO: duplica os itens no DOM antes de iniciar animação.
   translateX(-50%) move exatamente 1 set (metade) → loop seamless.
   ================================================================ */
const TickerModule = {
  init() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    const html = TICKER_ITEMS.map(item =>
      `<span class="ticker-item"><i class="${item.icon}" aria-hidden="true"></i>${item.text}</span>`
    ).join('');
    // Duplica: original + clone = translateX(-50%) funciona
    track.innerHTML = html + html;
  },
};

/* ================================================================
   HERO MODULE
   Atualiza título, excerpt, imagem, badges e data com base no nicho.
   ================================================================ */
const HeroModule = {
  update(niche) {
    const data = NICHES[niche]?.hero || NICHES.default.hero;
    const cfg  = NICHES[niche] || NICHES.default;

    // Texto
    const map = {
      heroTag:      cfg.tagLabel,
      heroTitle:    data.title,
      heroExcerpt:  data.excerpt,
      heroNicheTag: cfg.nicheTag,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    // hdgMin
    const hdgMin = document.getElementById('hdgMin');
    if (hdgMin) hdgMin.textContent = data.readTime;

    // Imagem — fade out/in para transição suave
    const img = document.getElementById('heroImg');
    if (img) {
      img.style.transition = 'opacity 0.25s ease';
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = data.img;
        img.alt = data.title;
        img.onload = () => { img.style.opacity = '1'; };
        // Fallback caso já esteja em cache
        setTimeout(() => { img.style.opacity = '1'; }, 150);
      }, 130);
    }

    // Data atual
    const dateEl = document.getElementById('heroDate');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
        day:'2-digit', month:'short', year:'numeric',
      });
    }
  },
};

/* ================================================================
   GRID MODULE
   Filtra o bento-grid por nicho e renderiza o feed "Latest".
   Isolado: não interfere com o SandboxEngine.
   ================================================================ */
const GridModule = {
  filter(niche) {
    // Bento grid principal
    document.querySelectorAll('.bento-card[data-niche]').forEach(card => {
      const show = niche === 'default' || card.dataset.niche === niche;
      card.style.display = show ? '' : 'none';
    });
    // Latest feed
    this.renderLatest(niche, NexusState.searchQuery);
  },

  renderLatest(niche, query = '') {
    const grid = document.getElementById('latestGrid');
    if (!grid) return;

    // Remove skeletons
    grid.querySelectorAll('.nx-skeleton').forEach(s => s.remove());

    // Filtra por nicho
    let articles = niche === 'default'
      ? [...ARTICLES_DB]
      : ARTICLES_DB.filter(a => a.niche === niche);

    // Filtra por busca
    if (query) {
      const q = query.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.niche.toLowerCase().includes(q)
      );
    }

    // Ordena
    if      (NexusState.sortMode === 'popular') articles.sort((a, b) => b.views - a.views);
    else if (NexusState.sortMode === 'oldest')  articles.sort((a, b) => a.id - b.id);
    else                                         articles.sort((a, b) => b.id - a.id); // recent

    // Limita a 6
    articles = articles.slice(0, 6);

    const nicheLabels = {
      ai:'IA & Software', smarthome:'Smart Home', architecture:'Arquitetura',
      hardware:'Hardware', space:'Espaço', culture:'Cultura', sandbox:'Sandbox',
    };

    if (!articles.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim)">
          <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;color:var(--accent-mid)"></i>
          Nenhum artigo encontrado${query ? ` para "<strong>${query}</strong>"` : ' neste nicho'}.
        </div>`;
      return;
    }

    grid.innerHTML = articles.map(a => `
      <article class="latest-card" role="article" data-id="${a.id}" data-niche="${a.niche}" tabindex="0">
        <div class="latest-card-img">
          <img src="${a.img}" alt="${a.title}" loading="lazy" width="600" height="300">
        </div>
        <div class="latest-card-body">
          <span class="latest-card-niche">${nicheLabels[a.niche] || a.niche}</span>
          <h3 class="latest-card-title">${a.title}</h3>
          <div class="latest-card-foot">
            <span>${a.date}</span>
            <span><i class="fas fa-clock" aria-hidden="true"></i> ${a.readTime} min</span>
            <span><i class="fas fa-eye" aria-hidden="true"></i> ${(a.views / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </article>
    `).join('');

    // Click + keyboard handlers nos cards
    grid.querySelectorAll('.latest-card').forEach(card => {
      const openArticle = () => {
        const art = ARTICLES_DB.find(a => a.id === +card.dataset.id);
        if (art) showToast(`Abrindo: "${art.title.slice(0, 45)}…"`, 'info');
        MonetizationEngine.track('article-click', { id: card.dataset.id });
      };
      card.addEventListener('click', openArticle);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openArticle(); } });
    });
  },
};

/* ================================================================
   STORE MODULE — Produtos do Dryfour Shopping por nicho
   ================================================================ */
const StoreModule = {
  render(niche) {
    const grid = document.getElementById('storeMiniGrid');
    if (!grid) return;
    const products = STORE_PRODUCTS[niche] || STORE_PRODUCTS.default;
    grid.innerHTML = products.map(p => `
      <div class="store-product-mini">
        <img src="${p.img}" alt="${p.name}" loading="lazy" width="40" height="40">
        <div class="spm-info">
          <div class="spm-name">${p.name}</div>
          <div class="spm-price">${p.price}</div>
        </div>
      </div>
    `).join('');
    NexusState.monetization.storeViews++;
  },
};

/* ================================================================
   SANDBOX ENGINE
   Encapsulado: não polui o namespace global nem afeta GridModule.
   Ferramentas: ROI Calculator, Drywall Estimator, IoT Map.
   ================================================================ */
const SandboxEngine = {
  init() {
    // Tabs de ferramentas
    document.querySelectorAll('.sandbox-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tool = tab.dataset.tool;
        document.querySelectorAll('.sandbox-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tool === tool);
          t.setAttribute('aria-selected', t.dataset.tool === tool ? 'true' : 'false');
        });
        document.querySelectorAll('.sandbox-tool').forEach(p => {
          p.classList.toggle('active', p.id === `tool-${tool}`);
        });
        NexusState.activeTool = tool;
        MonetizationEngine.track('sandbox-tool-open', { tool });
      });
    });

    // Botões de cálculo
    document.getElementById('calcRunBtn')?.addEventListener('click', () => this._runROI());
    document.getElementById('dwRunBtn')?.addEventListener('click',   () => this._runDrywall());
    document.getElementById('iotRunBtn')?.addEventListener('click',  () => this._runIoT());
  },

  /** ── ROI Calculator ── */
  _runROI() {
    const emp   = +document.getElementById('calcEmp')?.value   || 0;
    const hours = +document.getElementById('calcHours')?.value || 0;
    const rate  = +document.getElementById('calcRate')?.value  || 0;
    const cost  = +document.getElementById('calcCost')?.value  || 0;

    if (!emp || !hours || !rate) {
      showToast('Preencha todos os campos para calcular.', 'warn');
      return;
    }
    const weeklySave  = emp * hours * rate;
    const monthlySave = weeklySave * 4.33;
    const annualSave  = monthlySave * 12;
    const annualCost  = cost * 12;
    const netROI      = annualSave - annualCost;
    const roiPct      = annualCost > 0 ? ((netROI / annualCost) * 100).toFixed(0) : '∞';
    const payback     = (cost > 0 && monthlySave > 0) ? (annualCost / monthlySave).toFixed(1) : '0';

    document.getElementById('calcResult').innerHTML = `
      <div class="calc-result-display">
        <h3><i class="fas fa-chart-line"></i> Resultado do ROI</h3>
        <div class="result-metric highlight">
          <span class="rm-label">ROI Anual</span>
          <span class="rm-value">${roiPct}%</span>
          <span class="rm-desc">Retorno sobre o investimento na IA</span>
        </div>
        <div class="result-metric">
          <span class="rm-label">Economia Anual</span>
          <span class="rm-value">R$ ${annualSave.toLocaleString('pt-BR')}</span>
        </div>
        <div class="result-metric">
          <span class="rm-label">Custo Anual da IA</span>
          <span class="rm-value">R$ ${annualCost.toLocaleString('pt-BR')}</span>
        </div>
        <div class="result-metric highlight">
          <span class="rm-label">Lucro Líquido Anual</span>
          <span class="rm-value">R$ ${netROI.toLocaleString('pt-BR')}</span>
        </div>
        <div class="result-metric">
          <span class="rm-label">Payback (meses)</span>
          <span class="rm-value">${payback} meses</span>
        </div>
      </div>`;
    MonetizationEngine.track('sandbox-calc-run', { tool:'roi', roiPct });
    showToast('Cálculo de ROI concluído!', 'success');
  },

  /** ── Drywall Estimator ── */
  _runDrywall() {
    const area   = +document.getElementById('dwArea')?.value   || 0;
    const height = +document.getElementById('dwHeight')?.value || 2.8;
    const type   = document.getElementById('dwType')?.value;
    if (!area) { showToast('Informe a área das paredes.', 'warn'); return; }

    const mult = { standard:1, wet:1.2, acoustic:1.5 }[type] || 1;
    const chapas     = Math.ceil((area / 2.88) * mult);
    const perfisGuia = Math.ceil((area / height) * 1.1 * mult);
    const perfisMont = Math.ceil((area / 0.6) * mult);
    const parafusos  = Math.ceil(chapas * 32);
    const massaKg    = Math.ceil(area * 0.8 * mult);
    const fita       = Math.ceil(area * 1.1);
    const typeLabels = { standard:'ST (padrão)', wet:'RU (úmida)', acoustic:'AR (acústica)' };

    document.getElementById('dwResult').innerHTML = `
      <div class="calc-result-display">
        <h3><i class="fas fa-layer-group"></i> Material Estimado</h3>
        <div class="dw-result-grid">
          <div class="result-metric highlight">
            <span class="rm-label">Chapas — ${typeLabels[type]}</span>
            <span class="rm-value">${chapas} un</span>
            <span class="rm-desc">120 × 240 cm</span>
          </div>
          <div class="result-metric">
            <span class="rm-label">Perfis Guia</span>
            <span class="rm-value">${perfisGuia} un</span>
          </div>
          <div class="result-metric">
            <span class="rm-label">Perfis Montante</span>
            <span class="rm-value">${perfisMont} un</span>
          </div>
          <div class="result-metric">
            <span class="rm-label">Parafusos</span>
            <span class="rm-value">${parafusos} un</span>
          </div>
          <div class="result-metric">
            <span class="rm-label">Massa (kg)</span>
            <span class="rm-value">${massaKg} kg</span>
          </div>
          <div class="result-metric">
            <span class="rm-label">Fita telada (m)</span>
            <span class="rm-value">${fita} m</span>
          </div>
        </div>
        <p style="font-size:11px;color:var(--text-dim);margin-top:10px;font-family:var(--font-m)">* +10% reserva técnica. Consulte um engenheiro ou arquiteto.</p>
      </div>`;
    MonetizationEngine.track('sandbox-calc-run', { tool:'drywall', area });
    showToast('Estimativa de materiais gerada!', 'success');
  },

  /** ── IoT Map ── */
  _runIoT() {
    const devices = [];
    document.querySelectorAll('#iotDeviceList input:checked').forEach(cb => {
      devices.push(cb.dataset.device);
    });
    if (!devices.length) { showToast('Selecione pelo menos um dispositivo.', 'warn'); return; }

    const cfg = {
      router:     { label:'Router',      emoji:'📡', color:'#00E5FF', x:200, y:160 },
      camera:     { label:'Câmera',      emoji:'📷', color:'#7A00FF', x:90,  y:70  },
      lights:     { label:'Lâmpadas',    emoji:'💡', color:'#FF9F1C', x:310, y:70  },
      thermostat: { label:'Termostato',  emoji:'🌡️', color:'#00F5D4', x:90,  y:250 },
      speaker:    { label:'Speaker',     emoji:'🔊', color:'#00FF66', x:310, y:250 },
      lock:       { label:'Fechadura',   emoji:'🔒', color:'#FF0055', x:200, y:310 },
    };

    const cx = cfg.router.x, cy = cfg.router.y;
    let lines = '', nodes = '';

    devices.forEach(d => {
      const c = cfg[d];
      if (!c) return;
      if (d !== 'router') {
        lines += `<line x1="${cx}" y1="${cy}" x2="${c.x}" y2="${c.y}" stroke="${c.color}" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.55"/>`;
      }
      nodes += `
        <g transform="translate(${c.x},${c.y})">
          <circle r="26" fill="white" stroke="${c.color}" stroke-width="2.5" filter="url(#glow)"/>
          <text y="5" text-anchor="middle" font-size="16">${c.emoji}</text>
          <text y="44" text-anchor="middle" font-size="9" fill="#475569" font-family="IBM Plex Mono">${c.label}</text>
        </g>`;
    });

    // Adiciona router se não estiver selecionado mas há outros devices
    if (!devices.includes('router') && devices.length > 0) {
      const c = cfg.router;
      nodes = `<g transform="translate(${cx},${cy})">
        <circle r="26" fill="white" stroke="${c.color}" stroke-width="2.5"/>
        <text y="5" text-anchor="middle" font-size="16">${c.emoji}</text>
        <text y="44" text-anchor="middle" font-size="9" fill="#475569" font-family="IBM Plex Mono">${c.label}</text>
      </g>` + nodes;
    }

    document.getElementById('iotResult').innerHTML = `
      <div class="iot-map-display">
        <div class="iot-svg-wrap">
          <svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de dispositivos IoT" style="width:100%;max-height:260px;background:var(--bg2);border-radius:12px;border:1px solid var(--border2)">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            ${lines}${nodes}
          </svg>
        </div>
        <div class="iot-legend">
          ${devices.map(d => cfg[d] ? `<span class="iot-leg-item"><span class="iot-leg-dot" style="background:${cfg[d].color}"></span>${cfg[d].label}</span>` : '').join('')}
        </div>
        <p style="font-size:11px;color:var(--text-dim);margin-top:8px;font-family:var(--font-m)">${devices.length} dispositivo(s) • Topologia estrela via Router Central</p>
      </div>`;
    MonetizationEngine.track('sandbox-calc-run', { tool:'iot', count: devices.length });
    showToast('Mapa IoT gerado com sucesso!', 'success');
  },
};

/* ================================================================
   MONETIZATION ENGINE
   IntersectionObserver para impressões + click tracking global.
   Em produção: substituir console.debug por gtag() / fb pixel.
   ================================================================ */
const MonetizationEngine = {
  track(event, data = {}) {
    console.debug(`[NEXUS:MON] ${event}`, data);
    if (event === 'ad-click')           NexusState.monetization.adClicks++;
    if (event === 'ad-impression')      NexusState.monetization.adImpressions++;
    if (event === 'affiliate-click')    NexusState.monetization.affiliateClicks++;
    if (event === 'affiliate-view')     NexusState.monetization.affiliateViews++;
    if (event === 'store-cta')          NexusState.monetization.storeCTAs++;
  },

  initObserver() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const type = e.target.dataset.track;
        if (type === 'ad-impression')   this.track('ad-impression');
        if (type === 'affiliate-view')  this.track('affiliate-view');
        if (type === 'store-view')      this.track('store-impression');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-track]').forEach(el => obs.observe(el));
  },

  initClickTracking() {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-track]');
      if (el) this.track(el.dataset.track, { href: el.href || '' });
    });
  },
};

/* ================================================================
   HEADER MODULE — Scroll shadow + search flyout desktop
   ================================================================ */
const HeaderModule = {
  init() {
    const header   = document.getElementById('siteHeader');
    const toggle   = document.getElementById('searchToggle');
    const flyout   = document.getElementById('searchFlyout');
    const closeBtn = document.getElementById('searchClose');
    const input    = document.getElementById('searchInput');
    const overlay  = document.getElementById('siteOverlay');

    // Scroll shadow
    window.addEventListener('scroll', () => {
      header?.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Search flyout
    const openSearch = () => {
      flyout?.classList.add('open');
      toggle?.setAttribute('aria-expanded', 'true');
      overlay?.classList.add('active');
      NexusState.searchOpen = true;
      setTimeout(() => input?.focus(), 50);
    };
    const closeSearch = () => {
      flyout?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      overlay?.classList.remove('active');
      NexusState.searchOpen = false;
    };

    toggle?.addEventListener('click', () => NexusState.searchOpen ? closeSearch() : openSearch());
    closeBtn?.addEventListener('click', closeSearch);
    input?.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

    // Overlay fecha tudo (exceto sidebar — tem overlay próprio)
    overlay?.addEventListener('click', () => {
      closeSearch();
    });
  },
};

/* ================================================================
   NAVIGATION MODULE — cat pills + nav links + sort button top
   ================================================================ */
const NavModule = {
  init() {
    // Cat pills (horizontal filter bar)
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        ThemeEngine.set(pill.dataset.niche);
        // Scroll suave para a grid após a seleção
        document.getElementById('bentoSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Nav links desktop
    document.querySelectorAll('.nav-link[data-niche]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        ThemeEngine.set(link.dataset.niche);
        document.getElementById('bentoSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Footer niche links
    document.querySelectorAll('.footer-col a[data-niche]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        ThemeEngine.set(link.dataset.niche);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Sort button (top bar)
    const sortMap = [
      { mode:'recent',  label:'Recentes',  icon:'fa-clock' },
      { mode:'popular', label:'Popular',   icon:'fa-fire' },
      { mode:'oldest',  label:'Antigos',   icon:'fa-arrow-up-a-z' },
    ];
    let sortIdx = 0;
    const sortBtn   = document.getElementById('sortBtnTop');
    const sortLabel = document.getElementById('sortLabelTop');
    sortBtn?.addEventListener('click', () => {
      sortIdx = (sortIdx + 1) % sortMap.length;
      const { mode, label, icon } = sortMap[sortIdx];
      NexusState.sortMode = mode;
      if (sortLabel) sortLabel.textContent = label;
      const iconEl = sortBtn.querySelector('i');
      if (iconEl) iconEl.className = `fas ${icon}`;
      GridModule.renderLatest(NexusState.activeNiche, NexusState.searchQuery);
    });
  },
};

/* ================================================================
   NEWSLETTER MODULE
   ================================================================ */
const NewsletterModule = {
  init() {
    const form    = document.getElementById('newsletterForm');
    const success = document.getElementById('nlSuccess');
    form?.addEventListener('submit', e => {
      e.preventDefault();
      const name  = document.getElementById('nlName')?.value.trim();
      const email = document.getElementById('nlEmail')?.value.trim();
      if (!name) { showToast('Informe seu nome.', 'warn'); return; }
      if (!email || !email.includes('@')) { showToast('E-mail inválido.', 'warn'); return; }
      form.style.display = 'none';
      if (success) success.style.display = 'block';
      showToast(`Sinal conectado, ${name}!`, 'success');
      MonetizationEngine.track('newsletter-signup', { name, email });
    });
  },
};

/* ================================================================
   LOAD MORE
   ================================================================ */
const LoadMoreModule = {
  page: 1,
  init() {
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
      this.page++;
      showToast(`Carregando página ${this.page}…`, 'info');
      MonetizationEngine.track('load-more', { page: this.page });
      // Em produção: fetch('/api/news?page=' + this.page)
      setTimeout(() => showToast('Todos os artigos foram carregados.', 'success'), 1400);
    });
  },
};

/* ================================================================
   BENTO CARD INTERACTIONS
   ================================================================ */
function initCardInteractions() {
  document.querySelectorAll('.bento-card[data-id]').forEach(card => {
    const open = () => {
      const title = card.querySelector('.card-title')?.textContent || 'Artigo';
      showToast(`Abrindo: "${title.slice(0, 48)}…"`, 'info');
      MonetizationEngine.track('bento-card-click', { id: card.dataset.id });
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  document.getElementById('heroCta')?.addEventListener('click', () => {
    showToast('Abrindo artigo em destaque…', 'info');
    MonetizationEngine.track('hero-cta-click');
  });

  document.getElementById('heroShare')?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: 'Dryfour NEXUS', url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Link copiado para a área de transferência!', 'success');
    }
  });
}

/* ================================================================
   TOAST SYSTEM
   Acessível: aria-live="polite" no container.
   ================================================================ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons  = { success:'fa-circle-check', warn:'fa-triangle-exclamation', info:'fa-circle-info', error:'fa-circle-xmark' };
  const colors = { success:'#00c9ad', warn:'#FF9F1C', info: null, error:'#FF0055' };
  const color  = colors[type] || 'var(--accent)';

  const toast = document.createElement('div');
  toast.className   = 'toast';
  toast.style.borderLeftColor = color;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}" style="color:${color};flex-shrink:0" aria-hidden="true"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 380);
  }, 3800);
}

/* ================================================================
   INIT — DOMContentLoaded
   Ordem garante que módulos sem dependências rodam primeiro.
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Ticker (sem dependências)
  TickerModule.init();

  // 2. Header behaviors
  HeaderModule.init();

  // 3. Sidebar drawer (antes do NavModule para evitar conflito de eventos)
  SidebarModule.init();

  // 4. Navigation (pills, nav-links, sort)
  NavModule.init();

  // 5. Hero inicial
  HeroModule.update('default');

  // 6. Store showcase inicial
  StoreModule.render('default');

  // 7. Latest feed inicial
  GridModule.renderLatest('default');

  // 8. Sandbox (módulo isolado)
  SandboxEngine.init();

  // 9. Newsletter
  NewsletterModule.init();

  // 10. Load more
  LoadMoreModule.init();

  // 11. Monetization observers
  MonetizationEngine.initObserver();
  MonetizationEngine.initClickTracking();

  // 12. Card interactions
  initCardInteractions();

  // 13. Welcome toast
  setTimeout(() => {
    showToast('NEXUS v2.0 — 8 nichos ativos. Bem-vindo ao futuro.', 'success');
  }, 900);

  // Debug info
  console.log(
    '%c🚀 DRYFOUR NEXUS v2.0',
    'color:var(--accent,#00E5FF);font-weight:bold;font-size:16px;'
  );
  console.log(
    '%c8 nichos | Sidebar Drawer | ThemeEngine | SandboxEngine | MonetizationEngine',
    'color:#475569;font-size:11px;'
  );
  console.log('%cNexusState:', 'color:#94A3B8', NexusState);
});
