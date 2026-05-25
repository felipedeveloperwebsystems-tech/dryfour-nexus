// ============================================================
// DRYFOUR NEXUS — APP.JS
// Versão 1.0 — Vanilla JS, Zero Dependências Externas
//
// Arquitetura: NexusState (inspirado no AppState do Dryfour Shopping)
// Módulos: Theme Engine, Ticker, Bento Render, Sandbox, Monetization
//
// BUGS CORRIGIDOS:
// [1] Ticker: JS duplica conteúdo → translateX(-50%) = loop perfeito
// [2] Mobile scroll: pointer-events:none no ticker-bar via CSS
// [3] Sandbox tabs: state-driven, sem memory leaks em event listeners
// [4] Monetization tracking: event engine via custom dataset attributes
// ============================================================

'use strict';

/* ================================================================
   NEXUS STATE — Objeto de estado global centralizado
   Modeled após AppState do Dryfour Shopping
   ================================================================ */
const NexusState = {
  activeNiche:    'default',        // Tema/nicho ativo
  activeFilter:   'default',        // Filtro de categoria da grid
  sortMode:       null,             // null | 'asc' | 'desc' | 'popular'
  activeTool:     'calc',           // Ferramenta ativa no Sandbox
  searchOpen:     false,            // Estado do search flyout
  mobileOpen:     false,            // Estado do menu mobile
  heroIndex:      0,                // Slide atual do Hero
  heroInterval:   null,             // Referência ao setInterval
  monetization:   {                 // Rastreamento de monetização
    adImpressions: 0,
    adClicks:      0,
    affiliateViews: 0,
    affiliateClicks: 0,
    storeViews:    0,
    storeCTAs:     0,
  },
};

/* ================================================================
   DADOS: Artigos do Blog
   ================================================================ */
const ARTICLES_DB = [
  { id:1, niche:'ai',           title:'GPT-5 na prática: 30 dias testando o modelo que raciocina como humanos',          excerpt:'Benchmarks reais, casos de uso críticos e os limites que nenhum review te contou.',                          img:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80', readTime:12, date:'22 Mai 2026', views:12400, comments:87,  popular:true },
  { id:2, niche:'smarthome',    title:'Smart Home 2026: 10 dispositivos que automatizam sua casa sem quebrar o orçamento', excerpt:'Do básico ao avançado: curadoria dos melhores gadgets IoT do momento.',                                     img:'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', readTime:7,  date:'22 Mai 2026', views:8200,  comments:54,  popular:true },
  { id:3, niche:'architecture', title:'Drywall 3.0: o sistema modular que vai mudar como você constrói no Brasil',         excerpt:'Inovação no sistema seco: leveza, velocidade e sustentabilidade em um único sistema.',                      img:'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=600&q=80', readTime:5,  date:'20 Mai 2026', views:5600,  comments:32,  popular:false },
  { id:4, niche:'ai',           title:'Robótica cognitiva: máquinas que aprendem sozinhas com IA generativa',              excerpt:'Como a IA generativa está criando robôs com consciência adaptativa — e o que isso muda para o mercado.',    img:'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80', readTime:15, date:'19 Mai 2026', views:9800,  comments:103, popular:true },
  { id:5, niche:'smarthome',    title:'Câmeras IoT são hackeadas: como proteger sua rede doméstica em 2026',               excerpt:'Após incidentes de segurança com câmeras IP, especialistas revelam as melhores práticas.',                 img:'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600&q=80', readTime:6,  date:'18 Mai 2026', views:7100,  comments:61,  popular:false },
  { id:6, niche:'architecture', title:'Steel Frame no Brasil: construtores migram da alvenaria para o sistema seco',        excerpt:'Custo-benefício, velocidade de obra e resistência sísmica explicam a migração crescente.',                   img:'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', readTime:9,  date:'17 Mai 2026', views:4300,  comments:28,  popular:false },
  { id:7, niche:'ai',           title:'Computação Quântica para não-cientistas: o guia definitivo',                        excerpt:'Qubits, superposição e entrelaçamento: desmistificamos a próxima revolução tecnológica.',                   img:'https://images.unsplash.com/photo-1655635643532-fa9ba2648cbe?w=600&q=80', readTime:18, date:'16 Mai 2026', views:14200, comments:145, popular:true },
  { id:8, niche:'smarthome',    title:'Automação residencial com Home Assistant: guia completo para iniciantes',            excerpt:'Configure seu hub de automação local, sem depender de nuvem, com privacidade total.',                       img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', readTime:20, date:'15 Mai 2026', views:6700,  comments:89,  popular:true },
  { id:9, niche:'architecture', title:'Isolamento acústico em Drywall: tudo que você precisa saber antes de construir',    excerpt:'Técnicas profissionais, tipos de lã mineral e a diferença entre STC e IIC na prática.',                     img:'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80', readTime:11, date:'14 Mai 2026', views:3900,  comments:22,  popular:false },
  { id:10,niche:'ai',           title:'Claude 4 vs GPT-5: comparativo honesto das IAs mais poderosas de 2026',             excerpt:'Testamos ambos em 50 tarefas do mundo real. Os resultados vão te surpreender.',                              img:'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&q=80', readTime:14, date:'13 Mai 2026', views:18900, comments:234, popular:true },
  { id:11,niche:'smarthome',    title:'Protocolo Matter 2.0: o novo padrão que vai unificar todos os seus dispositivos IoT',excerpt:'Apple, Google e Amazon finalmente na mesma página. Veja o que muda para o consumidor.',                    img:'https://images.unsplash.com/photo-1557597774-9d475d030a13?w=600&q=80', readTime:8,  date:'12 Mai 2026', views:5500,  comments:47,  popular:false },
  { id:12,niche:'sandbox',      title:'Construímos um modelo de IA local com Ollama e hardware de R$ 3.500',               excerpt:'Tutorial completo: do hardware à inferência local com modelos open-source de última geração.',                img:'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600&q=80', readTime:25, date:'11 Mai 2026', views:11300, comments:167, popular:true },
];

/* ================================================================
   DADOS: Produtos para Store Showcase
   ================================================================ */
const STORE_PRODUCTS = {
  default:      [
    { name:'RTX 4070 Super 12GB', price:'R$ 3.299', img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' },
    { name:'Monitor 4K 144Hz IPS', price:'R$ 1.849', img:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=200&q=80' },
    { name:'SSD NVMe 2TB Gen4',   price:'R$ 649',   img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'  },
  ],
  ai:           [
    { name:'AMD Ryzen 9 7950X',    price:'R$ 4.199', img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' },
    { name:'RAM DDR5 64GB 6000MHz', price:'R$ 1.299', img:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80' },
    { name:'RTX 4090 24GB VRAM',   price:'R$ 11.499',img:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' },
  ],
  smarthome:    [
    { name:'Hub Zigbee Smart',      price:'R$ 289',   img:'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&q=80'  },
    { name:'Câmera 360° WiFi IA',  price:'R$ 549',   img:'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=200&q=80'  },
    { name:'Fechadura Biométrica',  price:'R$ 549',   img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80'  },
  ],
  architecture: [
    { name:'Furadeira de Impacto 20V',price:'R$ 399', img:'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&q=80' },
    { name:'Kit Drywall Completo',  price:'R$ 1.299', img:'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=200&q=80' },
    { name:'Nível a Laser 360°',    price:'R$ 489',   img:'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&q=80'  },
  ],
  sandbox:      [
    { name:'Raspberry Pi 5 8GB',   price:'R$ 549',   img:'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=200&q=80' },
    { name:'Arduino Mega Pro Kit', price:'R$ 189',   img:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80'  },
    { name:'Câmera USB 4K AI Cam', price:'R$ 349',   img:'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80'  },
  ],
};

/* ================================================================
   TICKER DATA
   ================================================================ */
const TICKER_ITEMS = [
  { icon:'fas fa-brain',         text:'IA Quântica ultrapassa modelos tradicionais em 400x' },
  { icon:'fas fa-house-signal',  text:'Protocolo Matter 2.0 lançado — compatibilidade universal IoT' },
  { icon:'fas fa-bolt',          text:'Dryfour Shopping: RTX 4090 com 20% off esta semana' },
  { icon:'fas fa-building',      text:'Steel Frame cresce 340% em adoção no Brasil em 2026' },
  { icon:'fas fa-microchip',     text:'AMD Ryzen 9 9950X quebra recordes de single-core' },
  { icon:'fas fa-satellite',     text:'SpaceX Starlink v3 promete 10 Gbps para residências em 2027' },
  { icon:'fas fa-flask',         text:'Sandbox NEXUS: novo estimador de drywall disponível agora' },
  { icon:'fas fa-shield-alt',    text:'Vulnerabilidade crítica em câmeras IoT: atualize o firmware' },
];

/* ================================================================
   HERO SLIDES (Dados dinâmicos por nicho)
   ================================================================ */
const HERO_DATA = {
  default: {
    tag: 'DESTAQUE DO DIA', niche: 'IA & Sci-Fi',
    title: 'IA Quântica: o próximo salto que vai redefinir a realidade digital',
    excerpt: 'Pesquisadores do MIT revelam processadores neurais que superam em 400x os modelos LLM atuais. O futuro da IA nunca esteve tão próximo.',
    img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&q=80',
    author: 'Felipe Lima', readTime: 8,
  },
  ai: {
    tag: 'ESPECIAL IA', niche: 'IA & Sci-Fi',
    title: 'Claude 4 vs GPT-5: comparativo honesto das IAs mais poderosas de 2026',
    excerpt: 'Testamos ambos em 50 tarefas do mundo real em diferentes áreas. Os resultados vão te surpreender e mudar sua perspectiva.',
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=80',
    author: 'NEXUS Editorial', readTime: 14,
  },
  smarthome: {
    tag: 'IOT EM FOCO', niche: 'Smart Home',
    title: 'Matter 2.0: o protocolo que finalmente vai unificar todos os seus dispositivos IoT',
    excerpt: 'Apple, Google e Amazon chegam a acordo histórico. Veja como isso muda o ecossistema de casa inteligente para sempre.',
    img: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=80',
    author: 'Tech Editorial', readTime: 9,
  },
  architecture: {
    tag: 'CONSTRUÇÃO 3.0', niche: 'Arquitetura 3.0',
    title: 'Revolução no canteiro: como o Drywall 3.0 está redesenhando o Brasil',
    excerpt: 'Sistemas modulares inteligentes, integração IoT e sustentabilidade que reduzem custo em 30% sem abrir mão da qualidade.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=900&q=80',
    author: 'Dryfour Construção', readTime: 10,
  },
  sandbox: {
    tag: 'LABORATÓRIO', niche: 'Sandbox',
    title: 'Como construímos um modelo de IA local com hardware de R$ 3.500',
    excerpt: 'Tutorial completo do zero: componentes, configuração do Ollama, modelos open-source e performance real no mundo do dia a dia.',
    img: 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=900&q=80',
    author: 'NEXUS Labs', readTime: 25,
  },
};

/* ================================================================
   ENGINE DE TEMA (NICHE COLOR SWITCHER)
   Atualiza body class e todos os elementos reativos
   ================================================================ */
const ThemeEngine = {
  /** Muda o tema ativo baseado no nicho */
  set(niche) {
    const body = document.body;
    // Remove todos os temas anteriores
    body.classList.remove('niche-default','niche-ai','niche-smarthome','niche-architecture','niche-sandbox');
    // Aplica novo tema
    const cls = `niche-${niche}`;
    body.classList.add(cls);
    NexusState.activeNiche = niche;

    // Atualiza badge do header
    const badgeEl = document.getElementById('nicheBadge');
    const dotEl   = document.getElementById('nicheDot');
    const lblEl   = document.getElementById('nicheLabel');
    if (badgeEl && dotEl && lblEl) {
      const labels = { default:'NEXUS', ai:'IA & SCI-FI', smarthome:'SMART HOME', architecture:'ARQUITETURA', sandbox:'SANDBOX' };
      lblEl.textContent = labels[niche] || 'NEXUS';
    }

    // Atualiza nav links ativos
    document.querySelectorAll('.nav-link, .mob-nav-link').forEach(el => {
      el.classList.toggle('active-nav', el.dataset.niche === niche);
    });

    // Atualiza cat pills
    document.querySelectorAll('.cat-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.niche === niche);
      p.setAttribute('aria-selected', p.dataset.niche === niche ? 'true' : 'false');
    });

    // Atualiza Hero
    HeroModule.update(niche);

    // Atualiza Store Showcase
    StoreModule.render(niche);

    // Filtra artigos
    GridModule.filter(niche);

    // Rastreia mudança
    MonetizationEngine.track('niche-change', { niche });
  },
};

/* ================================================================
   TICKER MODULE
   FIX CRÍTICO: duplica os itens no DOM antes de iniciar a animação.
   CSS usa translateX(-50%) → move exatamente metade do conteúdo
   (que corresponde ao set original) = loop seamless sem gap.
   ================================================================ */
const TickerModule = {
  init() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    // Constrói HTML dos itens
    const itemsHTML = TICKER_ITEMS.map(item =>
      `<span class="ticker-item"><i class="${item.icon}" aria-hidden="true"></i> ${item.text}</span>`
    ).join('');

    // DUPLICA → original + clone = translateX(-50%) funciona
    track.innerHTML = itemsHTML + itemsHTML;
  },
};

/* ================================================================
   HERO MODULE
   Atualiza os elementos do hero com base no nicho ativo
   ================================================================ */
const HeroModule = {
  update(niche) {
    const data = HERO_DATA[niche] || HERO_DATA.default;
    const fields = {
      heroTag:       data.tag,
      heroTitle:     data.title,
      heroExcerpt:   data.excerpt,
      heroNicheTag:  data.niche,
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
    // Imagem
    const img = document.getElementById('heroImg');
    if (img) {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = data.img;
        img.alt = data.title;
        img.style.opacity = '1';
        img.style.transition = 'opacity 0.4s ease';
      }, 120);
    }
    // Data
    const dateEl = document.getElementById('heroDate');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
    }
  },
};

/* ================================================================
   GRID MODULE — Filtra e ordena o bento-grid
   ================================================================ */
const GridModule = {
  filter(niche) {
    const cards = document.querySelectorAll('.bento-card[data-niche]');
    cards.forEach(card => {
      const match = niche === 'default' || card.dataset.niche === niche;
      card.style.display = match ? '' : 'none';
    });
    // Renderiza Latest Articles
    this.renderLatest(niche);
  },

  renderLatest(niche) {
    const grid = document.getElementById('latestGrid');
    if (!grid) return;
    let articles = niche === 'default'
      ? [...ARTICLES_DB]
      : ARTICLES_DB.filter(a => a.niche === niche);

    // Aplica ordenação
    if (NexusState.sortMode === 'popular') {
      articles.sort((a, b) => b.views - a.views);
    } else if (NexusState.sortMode === 'asc') {
      articles.sort((a, b) => a.id - b.id);
    } else if (NexusState.sortMode === 'desc') {
      articles.sort((a, b) => b.id - a.id);
    }

    // Limita a 6 artigos
    articles = articles.slice(0, 6);

    if (!articles.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim)"><i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;color:var(--accent-mid)"></i> Nenhum artigo nesta categoria ainda.</div>`;
      return;
    }

    grid.innerHTML = articles.map(a => `
      <article class="latest-card" role="article" data-id="${a.id}" data-niche="${a.niche}">
        <div class="latest-card-img">
          <img src="${a.img}" alt="${a.title}" loading="lazy">
        </div>
        <div class="latest-card-body">
          <span class="latest-card-niche">${{ ai:'IA & Sci-Fi', smarthome:'Smart Home', architecture:'Arquitetura 3.0', sandbox:'Sandbox' }[a.niche] || a.niche}</span>
          <h3 class="latest-card-title">${a.title}</h3>
          <div class="latest-card-foot">
            <span>${a.date}</span>
            <span><i class="fas fa-clock"></i> ${a.readTime} min</span>
            <span><i class="fas fa-eye"></i> ${(a.views/1000).toFixed(1)}k</span>
          </div>
        </div>
      </article>
    `).join('');

    // Click handler nos latest cards
    grid.querySelectorAll('.latest-card').forEach(card => {
      card.addEventListener('click', () => {
        const art = ARTICLES_DB.find(a => a.id === +card.dataset.id);
        if (art) showToast(`Abrindo: "${art.title.slice(0,40)}…"`, 'info');
        MonetizationEngine.track('article-click', { id: card.dataset.id });
      });
    });
  },
};

/* ================================================================
   STORE MODULE — Renderiza produtos no showcase dinâmico
   ================================================================ */
const StoreModule = {
  render(niche) {
    const grid = document.getElementById('storeMiniGrid');
    if (!grid) return;
    const products = STORE_PRODUCTS[niche] || STORE_PRODUCTS.default;
    grid.innerHTML = products.map(p => `
      <div class="store-product-mini" data-track="store-product-view">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
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
   SANDBOX ENGINE — Ferramentas interativas
   ================================================================ */
const SandboxEngine = {
  init() {
    // Tabs
    document.querySelectorAll('.sandbox-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tool = tab.dataset.tool;
        document.querySelectorAll('.sandbox-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.sandbox-tool').forEach(t => t.classList.remove('active'));
        const panel = document.getElementById(`tool-${tool}`);
        if (panel) panel.classList.add('active');
        NexusState.activeTool = tool;
        MonetizationEngine.track('sandbox-tool-open', { tool });
      });
    });

    // ROI Calculator
    const calcBtn = document.getElementById('calcRunBtn');
    if (calcBtn) calcBtn.addEventListener('click', () => this.runROI());

    // Drywall estimator
    const dwBtn = document.getElementById('dwRunBtn');
    if (dwBtn) dwBtn.addEventListener('click', () => this.runDrywall());

    // IoT map
    const iotBtn = document.getElementById('iotRunBtn');
    if (iotBtn) iotBtn.addEventListener('click', () => this.runIoT());
  },

  runROI() {
    const emp   = +document.getElementById('calcEmp').value   || 0;
    const hours = +document.getElementById('calcHours').value || 0;
    const rate  = +document.getElementById('calcRate').value  || 0;
    const cost  = +document.getElementById('calcCost').value  || 0;

    if (!emp || !hours || !rate) {
      showToast('Preencha todos os campos para calcular.', 'warn');
      return;
    }

    const weeklySave   = emp * hours * rate;
    const monthlySave  = weeklySave * 4.33;
    const annualSave   = monthlySave * 12;
    const annualCost   = cost * 12;
    const netROI       = annualSave - annualCost;
    const roiPercent   = annualCost > 0 ? ((netROI / annualCost) * 100).toFixed(0) : '∞';
    const payback      = cost > 0 ? (annualCost / (monthlySave || 1)).toFixed(1) : '0';

    const result = document.getElementById('calcResult');
    result.innerHTML = `
      <div class="calc-result-display">
        <h3><i class="fas fa-chart-line"></i> Resultado do ROI</h3>
        <div class="result-metric highlight">
          <span class="rm-label">ROI Anual</span>
          <span class="rm-value">${roiPercent}%</span>
          <span class="rm-desc">Retorno sobre o custo da IA</span>
        </div>
        <div class="result-metric">
          <span class="rm-label">Economia Anual (R$)</span>
          <span class="rm-value">R$ ${annualSave.toLocaleString('pt-BR')}</span>
        </div>
        <div class="result-metric">
          <span class="rm-label">Custo Anual IA (R$)</span>
          <span class="rm-value">R$ ${annualCost.toLocaleString('pt-BR')}</span>
        </div>
        <div class="result-metric ${netROI >= 0 ? 'highlight' : ''}">
          <span class="rm-label">Lucro Líquido Anual</span>
          <span class="rm-value">R$ ${netROI.toLocaleString('pt-BR')}</span>
        </div>
        <div class="result-metric">
          <span class="rm-label">Payback (meses)</span>
          <span class="rm-value">${payback} meses</span>
        </div>
      </div>
    `;
    MonetizationEngine.track('sandbox-calc-run', { tool:'roi', result: roiPercent });
    showToast('Cálculo concluído!', 'success');
  },

  runDrywall() {
    const area   = +document.getElementById('dwArea').value   || 0;
    const height = +document.getElementById('dwHeight').value || 2.8;
    const type   = document.getElementById('dwType').value;

    if (!area) { showToast('Informe a área das paredes.', 'warn'); return; }

    // Cálculo de materiais baseado em norma NBR (simplificado)
    const multipliers = { standard: 1, wet: 1.2, acoustic: 1.5 };
    const mult = multipliers[type] || 1;

    const chapas      = Math.ceil((area / 2.88) * mult);  // Chapa padrão 120x240
    const perfisGuia  = Math.ceil((area / height) * 1.1 * mult);
    const perfisMont  = Math.ceil((area / 0.6) * mult);
    const parafusos   = Math.ceil(chapas * 32);
    const massaKg     = Math.ceil(area * 0.8 * mult);
    const fita        = Math.ceil(area * 1.1);

    const result = document.getElementById('dwResult');
    result.innerHTML = `
      <div class="calc-result-display">
        <h3><i class="fas fa-layer-group"></i> Material Estimado</h3>
        <div class="dw-result-grid">
          <div class="result-metric highlight">
            <span class="rm-label">Chapas Drywall</span>
            <span class="rm-value">${chapas} un</span>
            <span class="rm-desc">120×240cm${type==='wet'?' — RU (úmida)':type==='acoustic'?' — AR (acústica)':' — ST (padrão)'}</span>
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
        <p style="font-size:11px;color:var(--text-dim);margin-top:12px;font-family:var(--font-m)">* Estimativa +10% reserva técnica. Consulte um profissional.</p>
      </div>
    `;
    MonetizationEngine.track('sandbox-calc-run', { tool:'drywall', area });
    showToast('Estimativa gerada!', 'success');
  },

  runIoT() {
    const devices = [];
    document.querySelectorAll('#iotDeviceList input:checked').forEach(cb => {
      devices.push(cb.dataset.device);
    });

    if (!devices.length) { showToast('Selecione pelo menos um dispositivo.', 'warn'); return; }

    const deviceConfig = {
      router:     { label:'Router Central', icon:'📡', color:'#00E5FF', x:200, y:150 },
      camera:     { label:'Câmera',         icon:'📷', color:'#7000FF', x:100, y:60  },
      lights:     { label:'Lâmpadas',       icon:'💡', color:'#FF9F1C', x:300, y:60  },
      thermostat: { label:'Termostato',     icon:'🌡️', color:'#00F5D4', x:100, y:240 },
      speaker:    { label:'Speaker',        icon:'🔊', color:'#00FF88', x:300, y:240 },
      lock:       { label:'Fechadura',      icon:'🔒', color:'#ef4444', x:200, y:300 },
    };

    const svgW = 400, svgH = 360;
    const router = deviceConfig.router;
    const cx = router.x, cy = router.y;

    let lines = '';
    let nodes = '';

    devices.forEach(d => {
      const cfg = deviceConfig[d];
      if (!cfg) return;
      if (d !== 'router') {
        lines += `<line x1="${cx}" y1="${cy}" x2="${cfg.x}" y2="${cfg.y}" stroke="${cfg.color}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5"/>`;
      }
      nodes += `
        <g transform="translate(${cfg.x},${cfg.y})">
          <circle r="28" fill="white" stroke="${cfg.color}" stroke-width="2"/>
          <text y="5" text-anchor="middle" font-size="18">${cfg.icon}</text>
          <text y="46" text-anchor="middle" font-size="10" fill="#475569" font-family="IBM Plex Mono">${cfg.label}</text>
        </g>
      `;
    });

    // Sempre mostra router se devices incluem outros
    if (!devices.includes('router')) {
      lines = '';
      nodes = `<g transform="translate(${cx},${cy})">
        <circle r="28" fill="white" stroke="${router.color}" stroke-width="2"/>
        <text y="5" text-anchor="middle" font-size="18">📡</text>
        <text y="46" text-anchor="middle" font-size="10" fill="#475569" font-family="IBM Plex Mono">Router</text>
      </g>` + nodes;
    }

    const result = document.getElementById('iotResult');
    result.innerHTML = `
      <div class="iot-map-display">
        <div class="iot-svg-wrap">
          <svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:280px;background:var(--bg2);border-radius:12px;border:1px solid var(--border2)">
            ${lines}
            ${nodes}
          </svg>
        </div>
        <div class="iot-legend">
          ${devices.map(d => {
            const c = deviceConfig[d];
            return c ? `<span class="iot-leg-item"><span class="iot-leg-dot" style="background:${c.color}"></span>${c.label}</span>` : '';
          }).join('')}
        </div>
        <p style="font-size:11px;color:var(--text-dim);margin-top:10px;font-family:var(--font-m)">${devices.length} dispositivo(s) na rede • Topologia estrela via Router</p>
      </div>
    `;
    MonetizationEngine.track('sandbox-calc-run', { tool:'iot', devices: devices.length });
    showToast('Mapa IoT gerado!', 'success');
  },
};

/* ================================================================
   MONETIZATION ENGINE
   Event tracking para blocos de ad/affiliate/store
   ================================================================ */
const MonetizationEngine = {
  track(event, data = {}) {
    // Em produção: substituir pelo pixel do AdSense / GA4 / Meta Pixel
    console.debug(`[NEXUS:MON] ${event}`, data);
    // Incrementa contadores internos
    if (event === 'ad-click')           NexusState.monetization.adClicks++;
    if (event === 'ad-impression')      NexusState.monetization.adImpressions++;
    if (event === 'affiliate-click')    NexusState.monetization.affiliateClicks++;
    if (event === 'affiliate-view')     NexusState.monetization.affiliateViews++;
    if (event === 'store-cta')          NexusState.monetization.storeCTAs++;
  },

  initObserver() {
    // IntersectionObserver para tracking de impressões
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const trackType = el.dataset.track;
        if (trackType === 'ad-click')       this.track('ad-impression');
        if (trackType === 'affiliate-view') this.track('affiliate-view');
        if (trackType === 'store-view')     this.track('store-impression');
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-track]').forEach(el => obs.observe(el));
  },

  initClickTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-track]');
      if (!target) return;
      const type = target.dataset.track;
      this.track(type);
    });
  },
};

/* ================================================================
   HEADER BEHAVIORS
   ================================================================ */
const HeaderModule = {
  init() {
    const header = document.getElementById('siteHeader');
    // Scroll shadow
    window.addEventListener('scroll', () => {
      header?.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });

    // Search flyout
    const toggle   = document.getElementById('searchToggle');
    const flyout   = document.getElementById('searchFlyout');
    const closeBtn = document.getElementById('searchClose');
    const input    = document.getElementById('searchInput');
    const overlay  = document.getElementById('siteOverlay');

    const openSearch  = () => {
      flyout?.classList.add('open');
      toggle?.setAttribute('aria-expanded','true');
      NexusState.searchOpen = true;
      overlay?.classList.add('active');
      setTimeout(() => input?.focus(), 50);
    };
    const closeSearch = () => {
      flyout?.classList.remove('open');
      toggle?.setAttribute('aria-expanded','false');
      NexusState.searchOpen = false;
      overlay?.classList.remove('active');
    };

    toggle?.addEventListener('click', () => NexusState.searchOpen ? closeSearch() : openSearch());
    closeBtn?.addEventListener('click', closeSearch);
    input?.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

    // Hamburger mobile
    const ham    = document.getElementById('hamburger');
    const drawer = document.getElementById('mobileDrawer');
    ham?.addEventListener('click', () => {
      const open = !NexusState.mobileOpen;
      NexusState.mobileOpen = open;
      ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', open);
      drawer?.classList.toggle('open', open);
      overlay?.classList.toggle('active', open);
    });

    // Overlay click fecha tudo
    overlay?.addEventListener('click', () => {
      closeSearch();
      ham?.classList.remove('open');
      drawer?.classList.remove('active');
      overlay.classList.remove('active');
      NexusState.mobileOpen = false;
    });
  },
};

/* ================================================================
   NAVIGATION & NICHE SWITCHING
   ================================================================ */
const NavModule = {
  init() {
    // Nav links (desktop + mobile)
    document.querySelectorAll('[data-niche]').forEach(el => {
      el.addEventListener('click', (e) => {
        const niche = el.dataset.niche;
        if (!niche) return;
        e.preventDefault();
        ThemeEngine.set(niche);
        // Fecha mobile menu se aberto
        if (NexusState.mobileOpen) {
          document.getElementById('hamburger')?.classList.remove('open');
          document.getElementById('mobileDrawer')?.classList.remove('open');
          document.getElementById('siteOverlay')?.classList.remove('active');
          NexusState.mobileOpen = false;
        }
        // Scroll suave para a grid
        document.getElementById('bentoGrid')?.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });

    // Category pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const niche = pill.dataset.niche;
        ThemeEngine.set(niche);
      });
    });

    // Sort button
    const sortBtn  = document.getElementById('sortBtn');
    const sortIcon = document.getElementById('sortIcon');
    const sorts = [null, 'popular', 'asc', 'desc'];
    const sortLabels = { null:'Ordenar', popular:'Popular', asc:'Antigos', desc:'Recentes' };
    const sortIcons  = { null:'fa-arrow-up-wide-short', popular:'fa-fire', asc:'fa-arrow-up-a-z', desc:'fa-arrow-down-a-z' };

    sortBtn?.addEventListener('click', () => {
      const idx  = sorts.indexOf(NexusState.sortMode);
      NexusState.sortMode = sorts[(idx + 1) % sorts.length];
      if (sortBtn) sortBtn.innerHTML = `<i class="fas ${sortIcons[NexusState.sortMode]}" id="sortIcon"></i> ${sortLabels[NexusState.sortMode]}`;
      GridModule.renderLatest(NexusState.activeNiche);
    });
  },
};

/* ================================================================
   NEWSLETTER FORM
   ================================================================ */
const NewsletterModule = {
  init() {
    const form    = document.getElementById('newsletterForm');
    const success = document.getElementById('nlSuccess');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name  = document.getElementById('nlName')?.value.trim();
      const email = document.getElementById('nlEmail')?.value.trim();
      if (!name || !email || !email.includes('@')) {
        showToast('Preencha nome e e-mail válidos.', 'warn');
        return;
      }
      form.style.display = 'none';
      if (success) success.style.display = 'block';
      showToast(`Sinal conectado, ${name}!`, 'success');
      MonetizationEngine.track('newsletter-signup', { email });
    });
  },
};

/* ================================================================
   LOAD MORE BUTTON
   ================================================================ */
const LoadMoreModule = {
  page: 1,
  init() {
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
      this.page++;
      // Em produção: AJAX call ao /api/news endpoint Golang
      showToast(`Carregando página ${this.page}…`, 'info');
      MonetizationEngine.track('load-more', { page: this.page });
      setTimeout(() => showToast('Todos os artigos carregados!', 'success'), 1200);
    });
  },
};

/* ================================================================
   TOAST NOTIFICATION SYSTEM
   ================================================================ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success:'fa-circle-check', warn:'fa-triangle-exclamation', info:'fa-circle-info', error:'fa-circle-xmark' };
  const colors = { success:'#00c9ad', warn:'#FF9F1C', info:'#00b8cc', error:'#ef4444' };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = colors[type] || colors.info;
  toast.innerHTML = `<i class="fas ${icons[type]} " style="color:${colors[type]};flex-shrink:0"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

/* ================================================================
   BENTO CARD CLICK INTERACTIONS
   ================================================================ */
function initCardInteractions() {
  document.querySelectorAll('.bento-card[data-id]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const art = ARTICLES_DB.find(a => a.id === +card.dataset.id);
      const title = art ? art.title : card.querySelector('.card-title')?.textContent || 'Artigo';
      showToast(`Abrindo: "${title.slice(0, 42)}…"`, 'info');
      MonetizationEngine.track('article-click', { id: card.dataset.id });
    });
  });

  // Hero CTA
  document.getElementById('heroCta')?.addEventListener('click', () => {
    showToast('Abrindo artigo em destaque…', 'info');
    MonetizationEngine.track('hero-cta-click');
  });

  // Store see all
  document.querySelector('.store-see-all')?.addEventListener('click', () => {
    MonetizationEngine.track('store-cta');
    NexusState.monetization.storeCTAs++;
  });
}

/* ================================================================
   INIT — DOMContentLoaded
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Ticker
  TickerModule.init();

  // 2. Hero initial date
  HeroModule.update('default');

  // 3. Header behaviors
  HeaderModule.init();

  // 4. Navigation & theme switching
  NavModule.init();

  // 5. Sandbox tools
  SandboxEngine.init();

  // 6. Newsletter
  NewsletterModule.init();

  // 7. Load More
  LoadMoreModule.init();

  // 8. Initial store render
  StoreModule.render('default');

  // 9. Initial latest grid
  GridModule.renderLatest('default');

  // 10. Monetization observer
  MonetizationEngine.initObserver();
  MonetizationEngine.initClickTracking();

  // 11. Card interactions
  initCardInteractions();

  // 12. Welcome toast
  setTimeout(() => showToast('NEXUS carregado — Bem-vindo ao futuro.', 'success'), 800);

  console.log('%c🚀 DRYFOUR NEXUS v1.0 — NexusState inicializado', 'color:#00E5FF;font-weight:bold;font-size:14px');
  console.log('%c  ThemeEngine | GridModule | SandboxEngine | MonetizationEngine', 'color:#475569;font-size:11px');
});
