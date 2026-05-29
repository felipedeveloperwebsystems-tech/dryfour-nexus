// ============================================================
// DRYFOUR BLOG — artigo.js
// JavaScript exclusivo da página de leitura de artigo.
//
// FLUXO:
//   1. Lê o ?slug= da URL
//   2. Busca o artigo na API /api/news/{id} ou /api/news?slug=...
//   3. Renderiza: hero, título, corpo, autor, sidebar
//   4. Carrega artigos relacionados na sidebar direita
//   5. Progresso de leitura via scroll
//   6. Compartilhamento nativo + fallback clipboard
//   7. Sidebar hamburger (reutiliza lógica do index)
//   8. Ticker de notícias
//
// COMO ABRIR UM ARTIGO:
//   /artigo.html?slug=drywall-3-sistema-modular-brasil
//   /artigo.html?id=1
// ============================================================

'use strict';

/* ================================================================
   DADOS DE AUTORES — bio por nome
   ================================================================ */
const AUTHORS = {
  'Cleber Amora': {
    bio: 'Fundador e diretor da Dryfour Construção. Especialista em sistemas construtivos secos — Drywall e Steel Frame — com mais de 15 anos de experiência no mercado de construção civil do Rio de Janeiro.',
  },
  'Felipe de Souza Lima': {
    bio: 'Desenvolvedor e estrategista digital da Dryfour. Responsável por toda a infraestrutura digital, portais e crescimento online do ecossistema Dryfour.',
  },
  'Dryfour Blog Editorial': {
    bio: 'Equipe editorial do Dryfour Blog. Cobrindo tecnologia, construção inteligente, IA e inovação.',
  },
};

/* ================================================================
   NICHE CONFIG — labels e classes de cor
   ================================================================ */
const NICHE_CONFIG = {
  default:      { label: 'Global',                  bodyClass: 'niche-default'      },
  ai:           { label: 'IA & Software',           bodyClass: 'niche-ai'           },
  smarthome:    { label: 'Smart Home & Domótica',   bodyClass: 'niche-smarthome'    },
  architecture: { label: 'Arquitetura & Engenharia',bodyClass: 'niche-architecture' },
  hardware:     { label: 'Hardware Extremo',        bodyClass: 'niche-hardware'     },
  space:        { label: 'Espaço & Ciência',        bodyClass: 'niche-space'        },
  culture:      { label: 'Cultura Sci-Fi',          bodyClass: 'niche-culture'      },
  sandbox:      { label: 'Sandbox Experimental',   bodyClass: 'niche-sandbox'      },
};

/* ================================================================
   TICKER DATA — mesmo do index
   ================================================================ */
const TICKER_ITEMS = [
  { icon:'fas fa-brain',        text:'IA Quântica ultrapassa modelos LLM em 400x — MIT confirma' },
  { icon:'fas fa-house-signal', text:'Matter 2.0 lançado — Apple, Google e Amazon unificados' },
  { icon:'fas fa-bolt',         text:'Dryfour Shopping: RTX 4090 com 19% off — oferta relâmpago' },
  { icon:'fas fa-building',     text:'Steel Frame cresce 340% em adoção no Brasil em 2026' },
  { icon:'fas fa-microchip',    text:'AMD Ryzen 9 9950X quebra recorde de single-core histórico' },
  { icon:'fas fa-satellite',    text:'SpaceX Starlink v3: 10 Gbps para residências em 2027' },
  { icon:'fas fa-flask',        text:'Dryfour Blog: novo estimador de drywall disponível agora' },
  { icon:'fas fa-shield-alt',   text:'Vulnerabilidade crítica em câmeras IoT: atualize o firmware' },
];

/* ================================================================
   UTILITÁRIOS
   ================================================================ */
function qs(sel, ctx = document) { return ctx.querySelector(sel); }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const colors = { success:'#00c9ad', warn:'#FF9F1C', error:'#FF0055' };
  const icons  = { success:'fa-circle-check', warn:'fa-triangle-exclamation',
                   info:'fa-circle-info', error:'fa-circle-xmark' };
  const color = colors[type] || 'var(--accent)';
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = color;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<i class="fas ${icons[type]||icons.info}" style="color:${color};flex-shrink:0" aria-hidden="true"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 380);
  }, 3800);
}

/* ================================================================
   BUSCA O ARTIGO NA API
   Tenta por slug primeiro, depois por id.
   ================================================================ */
async function fetchArticle() {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');
  const id     = params.get('id');

  if (!slug && !id) return null;

  try {
    // Tenta buscar pela lista filtrada por slug
    if (slug) {
      const res = await fetch(`/api/news`);
      if (res.ok) {
        const json = await res.json();
        const found = (json.data || []).find(a => a.slug === slug);
        if (found) return found;
      }
    }

    // Tenta buscar por ID direto
    if (id) {
      const res = await fetch(`/api/news/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    }

    return null;
  } catch (e) {
    console.error('[DRYFOUR-BLOG] Erro ao buscar artigo:', e);
    return null;
  }
}

/* ================================================================
   BUSCA ARTIGOS RELACIONADOS (mesmo nicho, exclui atual)
   ================================================================ */
async function fetchRelated(niche, currentId) {
  try {
    const param = niche && niche !== 'default' ? `?niche=${niche}` : '';
    const res   = await fetch(`/api/news${param}`);
    if (!res.ok) return [];
    const json  = await res.json();
    return (json.data || [])
      .filter(a => a.id !== currentId)
      .slice(0, 4);
  } catch {
    return [];
  }
}

/* ================================================================
   RENDERIZA O ARTIGO NA PÁGINA
   ================================================================ */
function renderArticle(art) {
  const cfg    = NICHE_CONFIG[art.niche] || NICHE_CONFIG.default;
  const author = AUTHORS[art.author] || AUTHORS['Dryfour Blog Editorial'];
  const date   = formatDate(art.published_at);
  const initial = (art.author || 'D').charAt(0).toUpperCase();

  // ── Aplica tema de nicho ──
  document.body.className = `art-page ${cfg.bodyClass}`;

  // ── Meta tags SEO ──
  document.title = `${art.title} | Dryfour Blog`;
  qs('#metaDesc')?.setAttribute('content', art.excerpt || art.title);
  qs('#metaAuthor')?.setAttribute('content', art.author || 'Dryfour Blog');

  // ── Breadcrumb ──
  const bcNiche = qs('#artBcNiche');
  const bcTitle = qs('#artBcTitle');
  if (bcNiche) bcNiche.textContent = cfg.label;
  if (bcTitle) bcTitle.textContent = art.title;

  // ── Niche badge no header ──
  const badge = qs('#nicheLabelBadge');
  if (badge) badge.textContent = cfg.label.split(' ')[0].toUpperCase();

  // ── Hero ──
  const heroImg = qs('#artHeroImg');
  if (heroImg) {
    heroImg.src = art.img_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80';
    heroImg.alt = art.title;
  }
  const nicheTag = qs('#artNicheTag');
  if (nicheTag) nicheTag.textContent = cfg.label;
  const heroDate = qs('#artHeroDate');
  if (heroDate) heroDate.textContent = date;
  const readTime = qs('#artReadTime');
  if (readTime) readTime.textContent = art.read_time || 5;
  const titleEl = qs('#artTitle');
  if (titleEl) titleEl.textContent = art.title;
  const authorName = qs('#artAuthorName');
  if (authorName) authorName.textContent = art.author || 'Dryfour Blog Editorial';
  const authorAvatar = qs('#artAuthorAvatar');
  if (authorAvatar) authorAvatar.textContent = initial;

  // ── Excerpt ──
  const excerptEl = qs('#artExcerpt');
  if (excerptEl) excerptEl.textContent = art.excerpt || '';

  // ── Corpo do artigo ──
  const bodyEl = qs('#artBody');
  if (bodyEl) {
    // Se o content já tem tags HTML, usa direto. Se for texto puro, converte \n em <p>
    const raw = art.content || '<p>Conteúdo em breve.</p>';
    const hasHTML = /<[a-z][\s\S]*>/i.test(raw);
    bodyEl.innerHTML = hasHTML
      ? raw
      : raw.split('\n\n').filter(Boolean).map(p => `<p>${p.trim()}</p>`).join('');
  }

  // ── Autor box ──
  const abAvatar = qs('#artAbAvatar');
  const abName   = qs('#artAbName');
  const abBio    = qs('#artAbBio');
  if (abAvatar) abAvatar.textContent = initial;
  if (abName)   abName.textContent   = art.author || 'Dryfour Blog Editorial';
  if (abBio)    abBio.textContent    = author.bio;

  // ── Tags (usa o nicho como tag base) ──
  const tagsRow = qs('#artTagsRow');
  if (tagsRow) {
    const tags = [cfg.label, 'Dryfour Blog'];
    if (art.niche === 'architecture') tags.push('Construção Civil', 'Drywall', 'Steel Frame');
    if (art.niche === 'ai')           tags.push('Inteligência Artificial', 'Tech');
    tagsRow.innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join('');
  }

  // ── Compartilhamento ──
  initShare(art.title);

  // ── Mostra o artigo, esconde loading ──
  qs('#artLoading').style.display  = 'none';
  qs('#artMain').style.display     = 'block';
}

/* ================================================================
   ARTIGOS RELACIONADOS NA SIDEBAR
   ================================================================ */
function renderRelated(articles, currentId) {
  const container = qs('#artRelated');
  if (!container) return;

  if (!articles.length) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-dim)">Mais artigos em breve.</p>`;
    return;
  }

  const nicheLabels = {
    ai:'IA', smarthome:'Smart Home', architecture:'Arquitetura',
    hardware:'Hardware', space:'Espaço', culture:'Cultura', sandbox:'Sandbox',
  };

  container.innerHTML = articles.map(a => `
    <a href="/artigo.html?id=${a.id}" class="art-related-item" aria-label="${a.title}">
      <img src="${a.img_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=120&q=60'}"
        alt="${a.title}" class="art-related-img" loading="lazy" width="52" height="52">
      <div class="art-related-info">
        <span class="art-related-niche">${nicheLabels[a.niche] || a.niche}</span>
        <span class="art-related-title">${a.title}</span>
      </div>
    </a>
  `).join('');
}

/* ================================================================
   PROGRESSO DE LEITURA
   ================================================================ */
function initReadingProgress() {
  const fill = qs('#artProgressFill');
  if (!fill) return;
  window.addEventListener('scroll', () => {
    const body    = document.body;
    const html    = document.documentElement;
    const total   = Math.max(body.scrollHeight, html.scrollHeight) - window.innerHeight;
    const current = window.scrollY;
    const pct     = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    fill.style.width = pct + '%';
  }, { passive: true });
}

/* ================================================================
   COMPARTILHAMENTO
   ================================================================ */
function initShare(title) {
  const url = window.location.href;

  // Botão do header
  qs('#artShareBtn')?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Link copiado!', 'success');
    }
  });

  // WhatsApp
  qs('#shareWhatsApp')?.addEventListener('click', () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(title + ' — ' + url)}`, '_blank');
  });

  // X / Twitter
  qs('#shareTwitter')?.addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
  });

  // Copiar link
  qs('#shareCopy')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(url).then(() => {
      showToast('Link copiado para a área de transferência!', 'success');
    }).catch(() => {
      showToast('Não foi possível copiar.', 'warn');
    });
  });
}

/* ================================================================
   NEWSLETTER DA SIDEBAR
   ================================================================ */
function initNlForm() {
  const form = qs('#artNlForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const email = qs('#artNlEmail')?.value.trim();
    if (!email || !email.includes('@')) {
      showToast('E-mail inválido.', 'warn');
      return;
    }
    showToast('Inscrito com sucesso! Bem-vindo ao Dryfour Blog.', 'success');
    form.reset();
  });
}

/* ================================================================
   TICKER
   ================================================================ */
function initTicker() {
  const track = qs('#tickerTrack');
  if (!track) return;
  const html = TICKER_ITEMS.map(item =>
    `<span class="ticker-item"><i class="${item.icon}" aria-hidden="true"></i>${item.text}</span>`
  ).join('');
  track.innerHTML = html + html;
}

/* ================================================================
   SIDEBAR HAMBURGER (versão simplificada para a página de artigo)
   ================================================================ */
function initSidebar() {
  const sidebar  = qs('#nexusSidebar');
  const overlay  = qs('#sidebarOverlay');
  const hamBtn   = qs('#hamburgerBtn');
  const closeBtn = qs('#sidebarCloseBtn');
  if (!sidebar) return;

  const open = () => {
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
    overlay?.classList.add('active');
    hamBtn?.classList.add('open');
    hamBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    overlay?.classList.remove('active');
    hamBtn?.classList.remove('open');
    hamBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // Accordion simples
  document.querySelectorAll('.sniche-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.getAttribute('aria-controls');
      const sub  = id ? qs('#' + id) : null;
      const open = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.sniche-header').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        const bid = b.getAttribute('aria-controls');
        if (bid) qs('#' + bid)?.classList.remove('open');
      });
      btn.setAttribute('aria-expanded', String(!open));
      if (!open && sub) sub.classList.add('open');
    });
  });
}

/* ================================================================
   SCROLL SHADOW NO HEADER
   ================================================================ */
function initHeaderScroll() {
  const header = qs('#siteHeader');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ================================================================
   INIT PRINCIPAL
   ================================================================ */
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Ticker e UI estática
  initTicker();
  initSidebar();
  initHeaderScroll();
  initNlForm();
  initReadingProgress();

  // 2. Busca o artigo
  const art = await fetchArticle();

  if (!art) {
    // Artigo não encontrado
    qs('#artLoading').style.display = 'none';
    qs('#artError').style.display   = 'block';
    document.title = 'Artigo não encontrado | Dryfour Blog';
    return;
  }

  // 3. Renderiza o artigo
  renderArticle(art);

  // 4. Carrega artigos relacionados em paralelo
  fetchRelated(art.niche, art.id).then(related => {
    renderRelated(related, art.id);
  });

  // 5. Log para debug
  console.log('[DRYFOUR-BLOG] Artigo carregado:', art.slug || art.id);
});
