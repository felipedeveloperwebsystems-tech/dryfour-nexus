// ============================================================
// DRYFOUR NEXUS — app.js  v2.1  (CORRIGIDO)
// Arquitetura Modular — Zero dependências externas
//
// MÓDULOS:
//   NexusState         — Estado global centralizado (8 nichos)
//   ThemeEngine        — Troca de temas, sincroniza todos os elementos
//   SidebarModule      — Drawer, accordion v2.1, overlay, ESC, focus-trap
//   TickerModule       — Loop seamless (conteúdo duplicado no DOM)
//   HeroModule         — Hero dinâmico por nicho com fade
//   GridModule         — Filtra bento-grid + renderiza latest feed
//   StoreModule        — Produtos Dryfour Shopping por nicho
//   SandboxEngine      — ROI, Drywall, IoT (isolado, sem side-effects)
//   MonetizationEngine — IntersectionObserver + click tracking global
//   NewsletterModule   — Formulário com validação
//   HeaderModule       — Scroll shadow + search flyout
//   NavModule          — Pills, nav-links desktop, sort top-bar
//   LoadMoreModule     — Paginação lazy
//
// CORREÇÕES v2.1 (sincronizadas com style.css v2.1):
//   [1] Accordion: _initAccordion usa classList.toggle('open') na <ul>
//       O CSS v2.1 anima via grid-template-rows:0fr→1fr, não display:none/flex.
//       O inner <div> dentro do <ul> absorve overflow — nenhuma manipulação de
//       display no JS é necessária ou permitida.
//   [2] Accordion: fechar todos antes de abrir outro é feito removendo .open
//       dos <ul> irmãos — sem tocar em display, height ou style.
//   [3] SidebarModule.close(): não restaura display em nenhum subnav.
//   [4] ThemeEngine: dispara CustomEvent 'nexus:niche-change' para
//       extensões externas (Analytics, etc).
//   [5] GridModule.filter(): usa style.display='' (limpa) e style.display='none'
//       apenas nos .bento-card[data-niche] do bento-grid — nunca nos subnavs.
//   [6] initAccordion: verifica se o <ul> existe antes de manipular.
//   [7] HeroModule: atualiza hero-read span via heroReadSpan (novo id).
//   [8] showToast: borderLeftColor sempre tem fallback para var(--accent).
// ============================================================

'use strict';

/* ================================================================
   NEXUS STATE — Estado global centralizado
   Espelha AppState do Dryfour Shopping, expandido para 8 nichos.
   ================================================================ */
const NexusState = {
  activeNiche:  'default',  // Um dos 8 nichos válidos
  activeFilter: 'all',      // Sub-filtro dentro do nicho ativo
  sidebarOpen:  false,      // Estado do drawer lateral
  searchOpen:   false,      // Estado do search flyout no header
  sortMode:     'recent',   // 'recent' | 'popular' | 'oldest'
  activeTool:   'calc',     // Ferramenta ativa no Sandbox
  searchQuery:  '',         // Termo de busca atual (sidebar + header)
  monetization: {
    adImpressions:   0,
    adClicks:        0,
    affiliateViews:  0,
    affiliateClicks: 0,
    storeViews:      0,
    storeCTAs:       0,
    nicheChanges:    0,
  },
};

/* ================================================================
   CONFIGURAÇÃO DOS 8 NICHOS
   Fonte de verdade para ThemeEngine, HeroModule, StoreModule.
   ================================================================ */
const NICHES = {
  default: {
    label:     'NEXUS',
    tagLabel:  'DESTAQUE DO DIA',
    nicheTag:  'Global',
    bodyClass: 'niche-default',
    hero: {
      title:    'IA Quântica: o próximo salto na computação que vai redefinir a realidade digital',
      excerpt:  'Pesquisadores do MIT revelam processadores neurais que superam em 400x os modelos LLM atuais. O futuro da inteligência artificial nunca esteve tão próximo — e tão imprevisível.',
      img:      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&q=80',
      readTime: 8,
    },
  },
  ai: {
    label:     'IA & SOFTWARE',
    tagLabel:  'ESPECIAL IA',
    nicheTag:  'Inteligência & Software',
    bodyClass: 'niche-ai',
    hero: {
      title:    'Claude 4 vs GPT-5: comparativo honesto das IAs mais poderosas de 2026',
      excerpt:  'Testamos ambos em 50 tarefas do mundo real. Performance de código, raciocínio, criatividade e custo-benefício — os resultados vão te surpreender.',
      img:      'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=80',
      readTime: 14,
    },
  },
  smarthome: {
    label:     'SMART HOME',
    tagLabel:  'IOT EM FOCO',
    nicheTag:  'Smart Home & Domótica',
    bodyClass: 'niche-smarthome',
    hero: {
      title:    'Matter 2.0: o protocolo que finalmente vai unificar todos os seus dispositivos IoT',
      excerpt:  'Apple, Google e Amazon chegam a acordo histórico. Veja como isso transforma o ecossistema de casa inteligente — e o que muda para o consumidor agora.',
      img:      'https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=80',
      readTime: 9,
    },
  },
  architecture: {
    label:     'ARQUITETURA',
    tagLabel:  'CONSTRUÇÃO 3.0',
    nicheTag:  'Arquitetura & Engenharia',
    bodyClass: 'niche-architecture',
    hero: {
      title:    'Revolução no canteiro: como o Drywall 3.0 está redesenhando a construção civil no Brasil',
      excerpt:  'Sistemas modulares inteligentes, integração IoT e sustentabilidade que reduzem custo em 30% sem abrir mão da qualidade estrutural.',
      img:      'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=900&q=80',
      readTime: 10,
    },
  },
  hardware: {
    label:     'HARDWARE',
    tagLabel:  'DEEP DIVE TÉCNICO',
    nicheTag:  'Hardware Extremo & Quantum',
    bodyClass: 'niche-hardware',
    hero: {
      title:    'Quantum GPUs: como os chips Blackwell Ultra da NVIDIA vão redesenhar toda a indústria de computação em 2027',
      excerpt:  'Arquitetura híbrida quântica-clássica, memória HBM4 e suporte nativo a inferência de 100B+ parâmetros. Análise técnica completa.',
      img:      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=900&q=80',
      readTime: 18,
    },
  },
  space: {
    label:     'ESPAÇO',
    tagLabel:  'AEROESPACIAL',
    nicheTag:  'Espaço & Ciência Profunda',
    bodyClass: 'niche-space',
    hero: {
      title:    'Artemis V vai instalar o primeiro datacenter na órbita lunar — e muda tudo sobre conectividade espacial',
      excerpt:  'A NASA revelou o plano técnico completo. Latência de 1.3 segundos, armazenamento de 10 PB e processamento de missões diretamente na órbita lunar.',
      img:      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=900&q=80',
      readTime: 12,
    },
  },
  culture: {
    label:     'CULTURA',
    tagLabel:  'ESPECIAL CYBERPUNK',
    nicheTag:  'Cultura Sci-Fi & Futurismo',
    bodyClass: 'niche-culture',
    hero: {
      title:    'O Manifesto Cyberpunk 2026: por que a estética distópica virou o design language da Big Tech',
      excerpt:  'De Silicon Valley às interfaces de produto das maiores empresas do mundo, o cyberpunk deixou de ser nicho e se tornou a linguagem visual da era da IA.',
      img:      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
      readTime: 11,
    },
  },
  sandbox: {
    label:     'SANDBOX',
    tagLabel:  'LABORATÓRIO NEXUS',
    nicheTag:  'Sandbox Experimental',
    bodyClass: 'niche-sandbox',
    hero: {
      title:    'Construímos um modelo de IA local com hardware de R$ 3.500 — tutorial completo do zero',
      excerpt:  'Ollama, Llama 3.3, ComfyUI e LM Studio configurados em máquina acessível. Todos os comandos, todas as configurações, todos os resultados.',
      img:      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
      readTime: 25,
    },
  },
};

/* ================================================================
   DATABASE DE ARTIGOS — mock local
   Em produção: fetch('/api/news?niche='+niche) no GridModule.
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
   STORE PRODUCTS — por nicho
   ================================================================ */
const STORE_PRODUCTS = {
  default:      [ { name:'RTX 4090 24GB VRAM',    price:'R$ 10.499', img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' }, { name:'Monitor 4K 144Hz IPS',  price:'R$ 1.849',  img:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=200&q=80' }, { name:'SSD NVMe 2TB Gen4',     price:'R$ 649',    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80' } ],
  ai:           [ { name:'AMD Ryzen 9 7950X',      price:'R$ 4.199',  img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' }, { name:'RAM DDR5 64GB 6000MHz', price:'R$ 1.299',  img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' }, { name:'RTX 4090 24GB VRAM',    price:'R$ 10.499', img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' } ],
  smarthome:    [ { name:'Hub Zigbee Smart',        price:'R$ 289',    img:'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&q=80' },  { name:'Câmera 360° WiFi IA',  price:'R$ 549',    img:'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=200&q=80' },  { name:'Fechadura Biométrica',  price:'R$ 549',    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80' }  ],
  architecture: [ { name:'Furadeira de Impacto 20V',price:'R$ 399',    img:'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&q=80' }, { name:'Kit Drywall Completo',  price:'R$ 1.299',  img:'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=200&q=80' }, { name:'Nível a Laser 360°',    price:'R$ 489',    img:'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&q=80' } ],
  hardware:     [ { name:'RTX 4090 24GB VRAM',      price:'R$ 10.499', img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' }, { name:'AMD Ryzen 9 9950X',     price:'R$ 5.499',  img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' }, { name:'Cooler Liquid 360mm',   price:'R$ 849',    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80' }  ],
  space:        [ { name:'Telescópio Smart WiFi',    price:'R$ 2.299',  img:'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=200&q=80' }, { name:'Drone Profissional 4K', price:'R$ 3.499',  img:'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&q=80' }, { name:'Antena Starlink Gen3',  price:'R$ 2.799',  img:'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=200&q=80' } ],
  culture:      [ { name:'Teclado Mecânico RGB',     price:'R$ 649',    img:'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=200&q=80' }, { name:'Headset 7.1 Surround', price:'R$ 799',    img:'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80' }, { name:'Monitor Gamer 240Hz',   price:'R$ 1.299',  img:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=200&q=80' } ],
  sandbox:      [ { name:'Raspberry Pi 5 8GB',       price:'R$ 549',    img:'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=200&q=80' }, { name:'Arduino Mega Pro Kit', price:'R$ 189',    img:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80' },  { name:'Câmera USB 4K AI',      price:'R$ 349',    img:'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80' } ],
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
  { icon:'fas fa-graduation-cap', text:'Aprender+ — Matemática, Inglês, Programação e muito mais agora no Dryfour Blog' },
];

/* ================================================================
   THEME ENGINE
   Ponto central de troca de tema — sincroniza TUDO.
   Chamado por NavModule, SidebarModule e bento card clicks.
   ================================================================ */
const ThemeEngine = {
  set(niche) {
    if (!NICHES[niche]) {
      console.warn(`[ThemeEngine] Nicho inválido: "${niche}"`);
      return;
    }

    const prev = NexusState.activeNiche;
    NexusState.activeNiche = niche;
    NexusState.monetization.nicheChanges++;

    // 1. body class
    const allClasses = Object.values(NICHES).map(n => n.bodyClass);
    document.body.classList.remove(...allClasses);
    document.body.classList.add(NICHES[niche].bodyClass);

    // 2. Cat pills — horizontal filter bar
    document.querySelectorAll('.cat-pill').forEach(pill => {
      const active = pill.dataset.niche === niche;
      pill.classList.toggle('active', active);
      pill.setAttribute('aria-selected', active ? 'true' : 'false');
      pill.setAttribute('tabindex', active ? '0' : '-1');
    });

    // 3. Nav links desktop
    document.querySelectorAll('.nav-link[data-niche]').forEach(link => {
      link.classList.toggle('active-nav', link.dataset.niche === niche);
    });

    // 4. Sidebar — header do nicho ativo
    document.querySelectorAll('.sniche-header').forEach(btn => {
      const item = btn.closest('.sniche-item');
      btn.classList.toggle('active-sniche', item?.dataset.niche === niche);
    });

    // 5. Sidebar — sub-links ativos
    document.querySelectorAll('.sub-link').forEach(link => {
      link.classList.toggle('active-sub', link.dataset.niche === niche);
    });

    // 6. Niche badge no header
    const badge = document.getElementById('nicheLabelBadge');
    if (badge) badge.textContent = NICHES[niche].label;

    // 7. Hero
    HeroModule.update(niche);

    // 8. Store showcase
    StoreModule.render(niche);

    // 9. Grid + latest feed
    GridModule.filter(niche);

    // 10. Toast
    if (prev !== niche) {
      const labels = {
        default:'Feed global — todos os nichos', ai:'Inteligência & Software ativado',
        smarthome:'Smart Home & Domótica ativado', architecture:'Arquitetura & Engenharia ativado',
        hardware:'Hardware Extremo ativado', space:'Espaço & Ciência ativado',
        culture:'Cultura Sci-Fi ativado', sandbox:'Sandbox Experimental ativado',
      };
      showToast(labels[niche] || 'Tema alterado', 'info');
    }

    // 11. CustomEvent para Analytics externos
    document.dispatchEvent(new CustomEvent('nexus:niche-change', { detail: { niche, prev } }));
    MonetizationEngine.track('niche-change', { niche, prev });
  },
};

/* ================================================================
   SIDEBAR MODULE
   CORREÇÃO [1][2][3]: accordion usa grid-template-rows via .open.
   Nunca manipula display, height ou style dos subnavs.
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

    this.hamBtn?.addEventListener('click',    () => this.open());
    this.closeBtn?.addEventListener('click',  () => this.close());
    this.overlay?.addEventListener('click',   () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && NexusState.sidebarOpen) this.close();
    });

    this._initAccordion();
    this._initSubLinks();
    this._initSearch();
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
    document.body.style.overflow = 'hidden';
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
    document.body.style.overflow = '';
    this.hamBtn?.focus();
  },

  /**
   * CORREÇÃO [1][2]: accordion usando grid-template-rows.
   * O CSS v2.1 define:
   *   .sniche-subnav            { grid-template-rows: 0fr }
   *   .sniche-subnav.open       { grid-template-rows: 1fr }
   * O JS apenas adiciona/remove a classe .open — NUNCA toca em display.
   */
  _initAccordion() {
    document.querySelectorAll('.sniche-header').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        const item    = btn.closest('.sniche-item');
        const niche   = item?.dataset.niche;
        const subnavId = btn.getAttribute('aria-controls');
        const subnav   = subnavId ? document.getElementById(subnavId) : null;
        const isOpen   = btn.getAttribute('aria-expanded') === 'true';

        // Fecha TODOS os outros subnavs — só remove .open, sem tocar em display
        document.querySelectorAll('.sniche-header').forEach(b => {
          if (b === btn) return;
          b.setAttribute('aria-expanded', 'false');
          const otherId = b.getAttribute('aria-controls');
          if (otherId) document.getElementById(otherId)?.classList.remove('open');
        });

        // Toggle deste
        const newState = !isOpen;
        btn.setAttribute('aria-expanded', String(newState));
        // CORREÇÃO [1]: apenas classList — o CSS v2.1 anima via grid-template-rows
        if (subnav) subnav.classList.toggle('open', newState);

        // Ativa o nicho ao clicar no header
        if (niche) ThemeEngine.set(niche);
      });
    });
  },

  /** Sub-links: nicho + filter + fecha sidebar + scroll para grid */
  _initSubLinks() {
    document.querySelectorAll('.sub-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const niche  = link.dataset.niche;
        const filter = link.dataset.filter || 'all';
        NexusState.activeFilter = filter;
        if (niche) ThemeEngine.set(niche);
        this.close();
        document.getElementById('bentoSection')?.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });
  },

  /** Search em tempo real — filtra o latest grid */
  _initSearch() {
    const input = document.getElementById('sidebarSearchInput');
    const clear = document.getElementById('sidebarSearchClear');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      NexusState.searchQuery = q;
      if (clear) clear.style.display = q ? 'block' : 'none';
      GridModule.renderLatest(NexusState.activeNiche, q);
    });

    clear?.addEventListener('click', () => {
      input.value = '';
      NexusState.searchQuery = '';
      if (clear) clear.style.display = 'none';
      GridModule.renderLatest(NexusState.activeNiche, '');
      input.focus();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close();
    });
  },

  /** Sort pills dentro do sidebar */
  _initSort() {
    document.querySelectorAll('.sort-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const sort = pill.dataset.sort;
        if (!sort) return;
        NexusState.sortMode = sort;
        document.querySelectorAll('.sort-pill').forEach(p => {
          p.classList.toggle('active', p.dataset.sort === sort);
          p.setAttribute('aria-pressed', p.dataset.sort === sort ? 'true' : 'false');
        });
        GridModule.renderLatest(NexusState.activeNiche, NexusState.searchQuery);
        const sortLabels = { recent:'Recentes', popular:'Popular', oldest:'Antigos' };
        showToast(`Ordenação: ${sortLabels[sort] || sort}`, 'info');
      });
    });
  },
};

/* ================================================================
   TICKER MODULE
   Duplica o conteúdo no DOM antes da animação iniciar.
   CSS anima translateX(-50%) = desloca exatamente 1 set (metade).
   pointer-events:none no .ticker-bar previne scroll-hijacking.
   ================================================================ */
const TickerModule = {
  init() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    const html = TICKER_ITEMS.map(item =>
      `<span class="ticker-item"><i class="${item.icon}" aria-hidden="true"></i>${item.text}</span>`
    ).join('');
    track.innerHTML = html + html; // duplica: translateX(-50%) = loop perfeito
  },
};

/* ================================================================
   HERO MODULE
   Fade out/in na imagem ao trocar de nicho.
   ================================================================ */
const HeroModule = {
  update(niche) {
    const data = NICHES[niche]?.hero || NICHES.default.hero;
    const cfg  = NICHES[niche]       || NICHES.default;

    // Campos de texto
    const textMap = {
      heroTag:      cfg.tagLabel,
      heroTitle:    data.title,
      heroExcerpt:  data.excerpt,
      heroNicheTag: cfg.nicheTag,
    };
    Object.entries(textMap).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    // Tempo de leitura
    const hdgMin = document.getElementById('hdgMin');
    if (hdgMin) hdgMin.textContent = data.readTime;

    // Imagem — fade out → troca src → fade in
    const img = document.getElementById('heroImg');
    if (img) {
      img.style.transition = 'opacity 0.25s ease';
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = data.img;
        img.alt = data.title;
        img.onload = () => { img.style.opacity = '1'; };
        setTimeout(() => { img.style.opacity = '1'; }, 150); // fallback cache
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
   GRID MODULE v3.0
   - filter(): bento-grid principal usa ARTICLES_DB mock (inalterado)
   - renderLatest(): busca da API /api/news e MESCLA com ARTICLES_DB mock
     Artigos reais do banco aparecem PRIMEIRO com badge "Conteúdo real"
     Artigos fictícios completam o feed para visualização do layout
   - ArticleModal abre página de leitura ao clicar em card real
   ================================================================ */
const GridModule = {
  filter(niche) {
    document.querySelectorAll('.bento-card[data-niche]').forEach(card => {
      const show = niche === 'default' || card.dataset.niche === niche;
      card.style.display = show ? '' : 'none';
    });
    this.renderLatest(niche, NexusState.searchQuery);
  },

  async renderLatest(niche, query = '') {
    const grid = document.getElementById('latestGrid');
    if (!grid) return;

    // Skeletons enquanto carrega
    grid.innerHTML = Array(6).fill('<div class="nx-skeleton"></div>').join('');

    // 1. Busca artigos reais da API
    let apiArticles = [];
    try {
      const nicheParam = (niche && niche !== 'default') ? `?niche=${niche}` : '';
      const res = await fetch(`/api/news${nicheParam}`);
      if (res.ok) {
        const json = await res.json();
        apiArticles = (json.data || []).map(a => ({
          id:       'api_' + a.id,
          niche:    a.niche,
          title:    a.title,
          img:      a.img_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
          readTime: a.read_time,
          date:     new Date(a.published_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }),
          views:    a.views || 0,
          excerpt:  a.excerpt || '',
          content:  a.content || '',
          author:   a.author || 'Dryfour Blog Editorial',
          slug:     a.slug,
          isReal:   true,
        }));
      }
    } catch(e) {
      console.warn('[DRYFOUR-BLOG] API indisponível — usando apenas mock', e);
    }

    // 2. Mock filtrado por nicho
    let mockArticles = niche === 'default'
      ? [...ARTICLES_DB]
      : ARTICLES_DB.filter(a => a.niche === niche);

    // Filtra por busca
    if (query) {
      const q = query.toLowerCase();
      const fn = a => a.title.toLowerCase().includes(q) || a.niche.toLowerCase().includes(q);
      apiArticles  = apiArticles.filter(fn);
      mockArticles = mockArticles.filter(fn);
    }

    // 3. Remove do mock slugs que já existem na API
    const apiSlugs = new Set(apiArticles.map(a => a.slug));
    mockArticles = mockArticles.filter(a => !apiSlugs.has(a.slug));

    // 4. Mescla: reais primeiro, mock depois
    let articles = [...apiArticles, ...mockArticles];

    if (NexusState.sortMode === 'popular') articles.sort((a, b) => b.views - a.views);
    else if (NexusState.sortMode === 'oldest') articles.sort((a, b) => a.isReal ? -1 : 1);

    articles = articles.slice(0, 9);

    const nicheLabels = {
      ai:'IA & Software', smarthome:'Smart Home', architecture:'Arquitetura',
      hardware:'Hardware', space:'Espaço', culture:'Cultura', sandbox:'Sandbox',
    };

    if (!articles.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim)">
          <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;color:var(--accent-mid)" aria-hidden="true"></i>
          Nenhum artigo encontrado${query ? ` para "<strong>${query}</strong>"` : ' neste nicho'}.
        </div>`;
      return;
    }

    grid.innerHTML = articles.map(a => `
      <article class="latest-card${a.isReal ? ' latest-card--real' : ''}"
               role="article" data-id="${a.id}" data-niche="${a.niche}"
               data-real="${a.isReal ? '1' : '0'}" tabindex="0">
        ${a.isReal ? '<span class="real-badge"><i class="fas fa-database" aria-hidden="true"></i> Conteúdo real</span>' : ''}
        <div class="latest-card-img">
          <img src="${a.img}" alt="${a.title}" loading="lazy" width="600" height="300">
        </div>
        <div class="latest-card-body">
          <span class="latest-card-niche">${nicheLabels[a.niche] || a.niche}</span>
          <h3 class="latest-card-title">${a.title}</h3>
          ${a.isReal && a.excerpt ? `<p class="latest-card-excerpt">${a.excerpt}</p>` : ''}
          <div class="latest-card-foot">
            <span>${a.author || ''}</span>
            <span>${a.date}</span>
            <span><i class="fas fa-clock" aria-hidden="true"></i> ${a.readTime} min</span>
          </div>
        </div>
      </article>
    `).join('');

    // Event listeners
    grid.querySelectorAll('.latest-card').forEach(card => {
      const open = () => {
        if (card.dataset.real === '1') {
          // Navega para a página dedicada do artigo
          window.location.href = `/artigo.html?id=${card.dataset.id.replace('api_', '')}`;
        } else {
          const art = ARTICLES_DB.find(a => String(a.id) === card.dataset.id);
          if (art) showToast(`Abrindo: "${art.title.slice(0, 45)}…"`, 'info');
        }
        MonetizationEngine.track('article-click', { id: card.dataset.id });
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  },
};

/* ================================================================
   ARTICLE MODAL — Página de leitura do artigo real
   Abre sobre o layout existente, fecha com ESC, X ou overlay.
   ================================================================ */
const ArticleModal = {
  el: null,

  init() {
    const div = document.createElement('div');
    div.id = 'articleModal';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-label', 'Leitura do artigo');
    div.innerHTML = `
      <div class="am-overlay" id="amOverlay"></div>
      <div class="am-panel" role="document">
        <button class="am-close" id="amClose" aria-label="Fechar artigo">
          <i class="fas fa-xmark"></i>
        </button>
        <div class="am-content" id="amContent"></div>
      </div>
    `;
    document.body.appendChild(div);
    this.el = div;
    document.getElementById('amClose').addEventListener('click', () => this.close());
    document.getElementById('amOverlay').addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  },

  open(article) {
    if (!article) return;
    const nicheLabels = {
      ai:'IA & Software', smarthome:'Smart Home & Domótica',
      architecture:'Arquitetura & Engenharia', hardware:'Hardware Extremo',
      space:'Espaço & Ciência', culture:'Cultura Sci-Fi', sandbox:'Sandbox',
    };
    document.getElementById('amContent').innerHTML = `
      <div class="am-hero">
        <img src="${article.img}" alt="${article.title}" class="am-hero-img">
        <div class="am-hero-overlay"></div>
      </div>
      <div class="am-body">
        <div class="am-meta-top">
          <span class="am-niche-tag">${nicheLabels[article.niche] || article.niche}</span>
          <span class="am-date">${article.date}</span>
          <span class="am-read"><i class="fas fa-clock" aria-hidden="true"></i> ${article.readTime} min de leitura</span>
        </div>
        <h1 class="am-title">${article.title}</h1>
        <div class="am-author-row">
          <div class="am-avatar">${(article.author || 'D').charAt(0)}</div>
          <div>
            <span class="am-author-name">${article.author || 'Dryfour Blog Editorial'}</span>
            <span class="am-author-label">Dryfour Blog</span>
          </div>
        </div>
        <p class="am-excerpt">${article.excerpt || ''}</p>
        <div class="am-text">${(article.content || '<p>Conteúdo em breve.</p>').replace(/\n/g, '<br>')}</div>
        <div class="am-footer">
          <a href="https://www.dryfour.com.br" target="_blank" rel="noopener" class="am-cta">
            <i class="fas fa-helmet-safety" aria-hidden="true"></i> Conhecer a Dryfour Construção
          </a>
          <a href="https://www.dryfourshopping.com.br" target="_blank" rel="noopener" class="am-cta am-cta--shop">
            <i class="fas fa-bag-shopping" aria-hidden="true"></i> Dryfour Shopping
          </a>
        </div>
      </div>
    `;
    this.el.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('amClose').focus();
  },

  close() {
    this.el.classList.remove('open');
    document.body.style.overflow = '';
  },
};


/* ================================================================
   STORE MODULE — produtos do Dryfour Shopping por nicho
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
   Módulo isolado — sem side-effects no feed ou no accordion.
   Ferramentas: ROI Calculator | Drywall Estimator | IoT Map
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

    document.getElementById('calcRunBtn')?.addEventListener('click', () => this._runROI());
    document.getElementById('dwRunBtn')?.addEventListener('click',   () => this._runDrywall());
    document.getElementById('iotRunBtn')?.addEventListener('click',  () => this._runIoT());
  },

  _runROI() {
    const emp   = +document.getElementById('calcEmp')?.value   || 0;
    const hours = +document.getElementById('calcHours')?.value || 0;
    const rate  = +document.getElementById('calcRate')?.value  || 0;
    const cost  = +document.getElementById('calcCost')?.value  || 0;

    if (!emp || !hours || !rate) {
      showToast('Preencha todos os campos para calcular.', 'warn');
      return;
    }
    const monthlySave = emp * hours * rate * 4.33;
    const annualSave  = monthlySave * 12;
    const annualCost  = cost * 12;
    const netROI      = annualSave - annualCost;
    const roiPct      = annualCost > 0 ? ((netROI / annualCost) * 100).toFixed(0) : '∞';
    const payback     = (cost > 0 && monthlySave > 0) ? (annualCost / monthlySave).toFixed(1) : '0';

    document.getElementById('calcResult').innerHTML = `
      <div class="calc-result-display">
        <h3><i class="fas fa-chart-line" aria-hidden="true"></i> Resultado do ROI</h3>
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
          <span class="rm-label">Payback</span>
          <span class="rm-value">${payback} meses</span>
        </div>
      </div>`;
    MonetizationEngine.track('sandbox-calc-run', { tool:'roi', roiPct });
    showToast('Cálculo de ROI concluído!', 'success');
  },

  _runDrywall() {
    const area   = +document.getElementById('dwArea')?.value   || 0;
    const height = +document.getElementById('dwHeight')?.value || 2.8;
    const type   = document.getElementById('dwType')?.value    || 'standard';
    if (!area) { showToast('Informe a área das paredes.', 'warn'); return; }

    const mult        = { standard:1, wet:1.2, acoustic:1.5 }[type] || 1;
    const chapas      = Math.ceil((area / 2.88) * mult);
    const perfisGuia  = Math.ceil((area / height) * 1.1 * mult);
    const perfisMont  = Math.ceil((area / 0.6) * mult);
    const parafusos   = Math.ceil(chapas * 32);
    const massaKg     = Math.ceil(area * 0.8 * mult);
    const fita        = Math.ceil(area * 1.1);
    const typeLabels  = { standard:'ST (padrão)', wet:'RU (úmida)', acoustic:'AR (acústica)' };

    document.getElementById('dwResult').innerHTML = `
      <div class="calc-result-display">
        <h3><i class="fas fa-layer-group" aria-hidden="true"></i> Material Estimado</h3>
        <div class="dw-result-grid">
          <div class="result-metric highlight">
            <span class="rm-label">Chapas — ${typeLabels[type]}</span>
            <span class="rm-value">${chapas} un</span>
            <span class="rm-desc">120 × 240 cm</span>
          </div>
          <div class="result-metric"><span class="rm-label">Perfis Guia</span><span class="rm-value">${perfisGuia} un</span></div>
          <div class="result-metric"><span class="rm-label">Perfis Montante</span><span class="rm-value">${perfisMont} un</span></div>
          <div class="result-metric"><span class="rm-label">Parafusos</span><span class="rm-value">${parafusos} un</span></div>
          <div class="result-metric"><span class="rm-label">Massa (kg)</span><span class="rm-value">${massaKg} kg</span></div>
          <div class="result-metric"><span class="rm-label">Fita telada (m)</span><span class="rm-value">${fita} m</span></div>
        </div>
        <p style="font-size:11px;color:var(--text-dim);margin-top:10px;font-family:var(--font-m)">* +10% reserva técnica. Consulte um engenheiro ou arquiteto.</p>
      </div>`;
    MonetizationEngine.track('sandbox-calc-run', { tool:'drywall', area });
    showToast('Estimativa de materiais gerada!', 'success');
  },

  _runIoT() {
    const devices = [];
    document.querySelectorAll('#iotDeviceList input:checked').forEach(cb => devices.push(cb.dataset.device));
    if (!devices.length) { showToast('Selecione pelo menos um dispositivo.', 'warn'); return; }

    const cfg = {
      router:     { label:'Router',     emoji:'📡', color:'#00E5FF', x:200, y:160 },
      camera:     { label:'Câmera',     emoji:'📷', color:'#7A00FF', x:90,  y:70  },
      lights:     { label:'Lâmpadas',   emoji:'💡', color:'#FF9F1C', x:310, y:70  },
      thermostat: { label:'Termostato', emoji:'🌡️', color:'#00F5D4', x:90,  y:250 },
      speaker:    { label:'Speaker',    emoji:'🔊', color:'#00FF66', x:310, y:250 },
      lock:       { label:'Fechadura',  emoji:'🔒', color:'#FF0055', x:200, y:310 },
    };
    const cx = cfg.router.x, cy = cfg.router.y;
    let lines = '', nodes = '';

    devices.forEach(d => {
      const c = cfg[d]; if (!c) return;
      if (d !== 'router')
        lines += `<line x1="${cx}" y1="${cy}" x2="${c.x}" y2="${c.y}" stroke="${c.color}" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.55"/>`;
      nodes += `<g transform="translate(${c.x},${c.y})"><circle r="26" fill="white" stroke="${c.color}" stroke-width="2.5" filter="url(#iotGlow)"/><text y="5" text-anchor="middle" font-size="16">${c.emoji}</text><text y="44" text-anchor="middle" font-size="9" fill="#475569" font-family="IBM Plex Mono">${c.label}</text></g>`;
    });

    if (!devices.includes('router') && devices.length > 0) {
      const c = cfg.router;
      nodes = `<g transform="translate(${cx},${cy})"><circle r="26" fill="white" stroke="${c.color}" stroke-width="2.5"/><text y="5" text-anchor="middle" font-size="16">${c.emoji}</text><text y="44" text-anchor="middle" font-size="9" fill="#475569" font-family="IBM Plex Mono">${c.label}</text></g>` + nodes;
    }

    document.getElementById('iotResult').innerHTML = `
      <div class="iot-map-display">
        <div class="iot-svg-wrap">
          <svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa IoT" style="width:100%;max-height:260px;background:var(--bg2);border-radius:12px;border:1px solid var(--border2)">
            <defs><filter id="iotGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            ${lines}${nodes}
          </svg>
        </div>
        <div class="iot-legend">${devices.map(d => cfg[d] ? `<span class="iot-leg-item"><span class="iot-leg-dot" style="background:${cfg[d].color}"></span>${cfg[d].label}</span>` : '').join('')}</div>
        <p style="font-size:11px;color:var(--text-dim);margin-top:8px;font-family:var(--font-m)">${devices.length} dispositivo(s) • Topologia estrela via Router Central</p>
      </div>`;
    MonetizationEngine.track('sandbox-calc-run', { tool:'iot', count:devices.length });
    showToast('Mapa IoT gerado com sucesso!', 'success');
  },
};

/* ================================================================
   MONETIZATION ENGINE
   IntersectionObserver: registra impressões de ads/affiliates.
   Click tracking: delegação global via data-track.
   Em produção: trocar console.debug por gtag() / Meta Pixel.
   ================================================================ */
const MonetizationEngine = {
  track(event, data = {}) {
    console.debug(`[NEXUS:MON] ${event}`, data);
    const m = NexusState.monetization;
    if (event === 'ad-click')        m.adClicks++;
    if (event === 'ad-impression')   m.adImpressions++;
    if (event === 'affiliate-click') m.affiliateClicks++;
    if (event === 'affiliate-view')  m.affiliateViews++;
    if (event === 'store-cta')       m.storeCTAs++;
  },

  initObserver() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const type = e.target.dataset.track;
        if (type === 'ad-impression')  this.track('ad-impression');
        if (type === 'affiliate-view') this.track('affiliate-view');
        if (type === 'store-view')     this.track('store-impression');
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
   HEADER MODULE — scroll shadow + search flyout desktop
   ================================================================ */
const HeaderModule = {
  init() {
    const header   = document.getElementById('siteHeader');
    const toggle   = document.getElementById('searchToggle');
    const flyout   = document.getElementById('searchFlyout');
    const closeBtn = document.getElementById('searchClose');
    const input    = document.getElementById('searchInput');
    const overlay  = document.getElementById('siteOverlay');

    window.addEventListener('scroll', () => {
      header?.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

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
    overlay?.addEventListener('click', closeSearch);
  },
};

/* ================================================================
   NAV MODULE — cat pills, nav links desktop, sort top-bar, footer links
   ================================================================ */
const NavModule = {
  init() {
    // Cat pills horizontal
    document.querySelectorAll('.cat-pill[data-niche]').forEach(pill => {
      pill.addEventListener('click', () => {
        ThemeEngine.set(pill.dataset.niche);
        document.getElementById('bentoSection')?.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });

    // Nav links desktop
    document.querySelectorAll('.nav-link[data-niche]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        ThemeEngine.set(link.dataset.niche);
        document.getElementById('bentoSection')?.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });

    // Footer niche links
    document.querySelectorAll('.footer-col a[data-niche]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        ThemeEngine.set(link.dataset.niche);
        window.scrollTo({ top:0, behavior:'smooth' });
      });
    });

    // Sort button — top bar (cicla entre 3 modos)
    const sortMap = [
      { mode:'recent',  label:'Recentes', icon:'fa-clock' },
      { mode:'popular', label:'Popular',  icon:'fa-fire'  },
      { mode:'oldest',  label:'Antigos',  icon:'fa-arrow-up-a-z' },
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
      if (!name)                       { showToast('Informe seu nome.', 'warn'); return; }
      if (!email || !email.includes('@')) { showToast('E-mail inválido.', 'warn'); return; }
      if (form)    form.style.display = 'none';
      if (success) success.style.display = 'block';
      showToast(`Sinal conectado, ${name}!`, 'success');
      MonetizationEngine.track('newsletter-signup', { name, email });
    });
  },
};

/* ================================================================
   LOAD MORE MODULE
   ================================================================ */
const LoadMoreModule = {
  page: 1,
  init() {
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
      this.page++;
      showToast(`Carregando página ${this.page}…`, 'info');
      MonetizationEngine.track('load-more', { page: this.page });
      // Em produção: fetch('/api/news?page=' + this.page + '&niche=' + NexusState.activeNiche)
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
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  document.getElementById('heroCta')?.addEventListener('click', () => {
    showToast('Abrindo artigo em destaque…', 'info');
    MonetizationEngine.track('hero-cta-click');
  });

  document.getElementById('heroShare')?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title:'Dryfour NEXUS', url:window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Link copiado para a área de transferência!', 'success');
    }
  });
}

/* ================================================================
   TOAST SYSTEM
   CORREÇÃO [8]: fallback para var(--accent) quando color é null.
   ================================================================ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons  = { success:'fa-circle-check', warn:'fa-triangle-exclamation', info:'fa-circle-info', error:'fa-circle-xmark' };
  const colors = { success:'#00c9ad', warn:'#FF9F1C', error:'#FF0055' };
  // CORREÇÃO [8]: type 'info' não tem hex fixo — usa var(--accent) dinamicamente
  const color  = colors[type] || 'var(--accent)';

  const toast = document.createElement('div');
  toast.className = 'toast';
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
   Ordem de init garante que módulos sem dependências rodam primeiro.
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Ticker — sem dependências
  TickerModule.init();

  // 2. Header scroll + search flyout
  HeaderModule.init();

  // 3. Sidebar drawer (antes de NavModule para evitar conflito de eventos)
  SidebarModule.init();

  // 4. Nav (pills, nav-links, sort-top, footer links)
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

  // 11. Monetization
  MonetizationEngine.initObserver();
  MonetizationEngine.initClickTracking();

  // 12. Bento card interactions
  initCardInteractions();

  // 13. Article Modal — página de leitura
  ArticleModal.init();

  // 13. Article Modal
  ArticleModal.init();

  // 13. Welcome toast
  setTimeout(() => {
    showToast('NEXUS v2.1 — 8 nichos ativos. Sidebar corrigido.', 'success');
  }, 900);

  // 14. Debug
  console.log('%c🚀 DRYFOUR NEXUS v2.1', 'color:#00E5FF;font-weight:bold;font-size:16px');
  console.log('%c8 nichos | Accordion grid-rows | ThemeEngine | SandboxEngine | 60fps', 'color:#475569;font-size:11px');
  console.log('%cNexusState:', 'color:#94A3B8', NexusState);
});
