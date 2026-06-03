// ============================================================
// DRYFOUR BLOG — aprender.js
// Página Educacional Aprender+
//
// MÓDULOS:
//   EduState          — Estado global da sessão educacional
//   EduThemeEngine    — Troca de temas por disciplina (30+ cores)
//   EduSidebarModule  — Sidebar vertical desktop + mobile drawer
//   EduQuickGrid      — Grid de seleção rápida de disciplinas
//   EduContentModule  — Renderiza conteúdo do tópico selecionado
//   EduProgressModule — Barra de progresso de leitura via scroll
//   EduAffiliateModule— Card de afiliado contextual por disciplina
//   TickerModule      — Ticker de notícias (mesmo do index)
//   HeaderModule      — Scroll shadow no header
//   ToastSystem       — Notificações acessíveis
//
// FLUXO DE DADOS:
//   1. Página carrega → busca subjects da API /api/categories
//   2. EduSidebarModule.render() constrói o sidebar com accordion
//   3. Usuário clica disciplina → EduThemeEngine.set(subject)
//   4. Usuário clica tópico → EduContentModule.load(subjectId, topicSlug)
//   5. API retorna edu_content → renderiza no #eduBody
//   6. EduAffiliateModule.render() injeta card contextual
//
// FALLBACK MOCK:
//   Se a API não retornar conteúdo, usa EDU_MOCK_CONTENT local
//   para garantir experiência sem banco configurado.
// ============================================================

'use strict';

/* ================================================================
   EDU STATE — Estado global da sessão educacional
   ================================================================ */
const EduState = {
  activeSubject:  null,      // slug da disciplina ativa (ex: 'matematica')
  activeGroup:    null,      // nome do grupo ativo (ex: 'Básico')
  activeTopic:    null,      // nome do tópico ativo (ex: 'Frações')
  activeTopicIdx: 0,         // índice do tópico na lista do grupo
  subjectData:    null,      // objeto completo da disciplina (do banco)
  allTopics:      [],        // lista flat de todos os tópicos do grupo ativo
  sidebarOpen:    false,     // estado do drawer no mobile
  searchQuery:    '',        // busca no sidebar
};

/* ================================================================
   CONFIGURAÇÃO ESTÁTICA DAS DISCIPLINAS
   Fonte de verdade para cores, ícones e afiliados — sincronizada
   com o campo theme_class e accent_hex da tabela subjects.
   ================================================================ */
const EDU_SUBJECTS = {
  portugues:    { name:'Português',    icon:'fas fa-book-open',    themeClass:'niche-culture',      accent:'#FF00C8', discIcon:'disc-portugues',   accentText:'#cc009f' },
  ingles:       { name:'Inglês',       icon:'fas fa-language',     themeClass:'niche-space',        accent:'#0049FF', discIcon:'disc-ingles',      accentText:'#003acc' },
  espanhol:     { name:'Espanhol',     icon:'fas fa-globe-americas',themeClass:'niche-smarthome',   accent:'#00F5D4', discIcon:'disc-espanhol',    accentText:'#00c9ad' },
  alemao:       { name:'Alemão',       icon:'fas fa-flag',         themeClass:'niche-hardware',     accent:'#FF0055', discIcon:'disc-alemao',      accentText:'#cc0044' },
  matematica:   { name:'Matemática',   icon:'fas fa-calculator',   themeClass:'niche-architecture', accent:'#FF9F1C', discIcon:'disc-matematica',  accentText:'#cc7d00' },
  fisica:       { name:'Física',       icon:'fas fa-atom',         themeClass:'niche-ai',           accent:'#7A00FF', discIcon:'disc-fisica',      accentText:'#6200cc' },
  quimica:      { name:'Química',      icon:'fas fa-flask-vial',   themeClass:'niche-sandbox',      accent:'#00FF66', discIcon:'disc-quimica',     accentText:'#00cc52' },
  programacao:  { name:'Programação',  icon:'fas fa-code',         themeClass:'niche-ai',           accent:'#7A00FF', discIcon:'disc-programacao', accentText:'#6200cc' },
  eletronica:   { name:'Eletrônica',   icon:'fas fa-microchip',    themeClass:'niche-hardware',     accent:'#FF0055', discIcon:'disc-eletronica',  accentText:'#cc0044' },
  hobbies:      { name:'Hobbies',      icon:'fas fa-puzzle-piece', themeClass:'niche-culture',      accent:'#FF00C8', discIcon:'disc-hobbies',     accentText:'#cc009f' },
};

/* ================================================================
   MOCK DE CONTEÚDO — Fallback quando API não tem edu_content
   ================================================================ */
const EDU_MOCK_CONTENT = {
  matematica: {
    'Operações': {
      title: 'Operações com Números Decimais',
      summary: 'Adição, subtração, multiplicação e divisão com decimais. Entenda a teoria, veja exemplos e treine com os simuladores interativos.',
      difficulty: 'iniciante', duration_min: 30,
      content: `
<h2>O que são Números Decimais?</h2>
<p>Números decimais são aqueles que possuem uma parte inteira e uma parte fracionária separadas por vírgula. Eles aparecem em toda situação do dia a dia: preço de produtos, medidas de comprimento, peso, temperatura. Dominar as quatro operações com decimais é a base de toda a matemática prática.</p>

<!-- ══════════════════════════════════════════════
     SEÇÃO 1: ADIÇÃO E SUBTRAÇÃO
     ══════════════════════════════════════════════ -->
<div class="edu-math-card">
  <div class="edu-math-card-header">
    <span class="edu-math-op-badge edu-math-op-add">01</span>
    <h3 class="edu-math-title"><i class="fas fa-plus-minus" aria-hidden="true"></i> Adição e Subtração de Decimais</h3>
  </div>
  <div class="edu-math-rule">
    <strong>Regra de ouro:</strong> iguale o número de casas decimais adicionando zeros à direita e alinhe <em>vírgula embaixo de vírgula</em>. Depois opere normalmente como inteiros.
  </div>

  <div style="padding:20px">
    <h4 style="font-size:15px;margin-bottom:12px;color:var(--text)">Como funciona — passo a passo</h4>
    <p style="font-size:14px;color:var(--text-mid);margin-bottom:16px">Vamos somar <strong>8,75 + 3,4</strong>. Primeiro igualamos as casas decimais: 3,4 vira 3,40. Depois alinhamos as vírgulas e somamos coluna por coluna:</p>

    <div class="edu-math-example">
      <span class="edu-math-example-title">Exemplo resolvido — Adição</span>
      <div class="edu-math-cols">
        <div class="edu-math-col">
          <svg width="160" height="130" viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="140" y="30" text-anchor="end" font-size="22" fill="currentColor">8,75</text>
            <text x="140" y="62" text-anchor="end" font-size="22" fill="currentColor">+ 3,40</text>
            <line x1="10" y1="76" x2="150" y2="76" stroke="currentColor" stroke-width="2"/>
            <text x="140" y="108" text-anchor="end" font-size="22" fill="#FF9F1C" font-weight="700">12,15</text>
          </svg>
          <p style="font-size:12px;color:var(--text-dim);margin-top:4px">8,75 + 3,40 = 12,15</p>
        </div>
        <div class="edu-math-col">
          <svg width="160" height="130" viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="140" y="30" text-anchor="end" font-size="22" fill="currentColor">15,30</text>
            <text x="140" y="62" text-anchor="end" font-size="22" fill="currentColor">− 6,80</text>
            <line x1="10" y1="76" x2="150" y2="76" stroke="currentColor" stroke-width="2"/>
            <text x="140" y="108" text-anchor="end" font-size="22" fill="#FF9F1C" font-weight="700">8,50</text>
          </svg>
          <p style="font-size:12px;color:var(--text-dim);margin-top:4px">15,30 − 6,80 = 8,50</p>
        </div>
        <div class="edu-math-col">
          <svg width="160" height="130" viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="140" y="30" text-anchor="end" font-size="22" fill="currentColor">2,500</text>
            <text x="140" y="62" text-anchor="end" font-size="22" fill="currentColor">+ 0,375</text>
            <line x1="10" y1="76" x2="150" y2="76" stroke="currentColor" stroke-width="2"/>
            <text x="140" y="108" text-anchor="end" font-size="22" fill="#FF9F1C" font-weight="700">2,875</text>
          </svg>
          <p style="font-size:12px;color:var(--text-dim);margin-top:4px">2,5 + 0,375 = 2,875</p>
        </div>
      </div>
    </div>

    <h4 style="font-size:15px;margin:20px 0 10px;color:var(--text)">Simulador — Adição e Subtração</h4>
    <p style="font-size:13px;color:var(--text-mid);margin-bottom:14px">Digite dois números e escolha a operação. A conta se monta automaticamente com o alinhamento correto das vírgulas.</p>
  </div>

  <div class="edu-math-engine">
    <div class="edu-math-inputs">
      <div class="edu-math-input-group">
        <label for="em-add1">Primeiro número</label>
        <input type="number" id="em-add1" value="8.75" step="0.01" class="edu-math-input">
      </div>
      <div class="edu-math-input-group">
        <label for="em-op">Operação</label>
        <select id="em-op" class="edu-math-select">
          <option value="+">Adição (+)</option>
          <option value="-">Subtração (−)</option>
        </select>
      </div>
      <div class="edu-math-input-group">
        <label for="em-add2">Segundo número</label>
        <input type="number" id="em-add2" value="3.40" step="0.01" class="edu-math-input">
      </div>
    </div>
    <div class="edu-math-visual">
      <div class="edu-math-calc" id="em-add-calc"></div>
      <div class="edu-math-tags" id="em-add-explain"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SEÇÃO 2: MULTIPLICAÇÃO
     ══════════════════════════════════════════════ -->
<div class="edu-math-card">
  <div class="edu-math-card-header">
    <span class="edu-math-op-badge edu-math-op-mul">02</span>
    <h3 class="edu-math-title"><i class="fas fa-xmark" aria-hidden="true"></i> Multiplicação de Decimais</h3>
  </div>
  <div class="edu-math-rule">
    <strong>Regra de ouro:</strong> multiplique como se fossem inteiros (ignore as vírgulas). Depois some o total de casas decimais dos dois fatores e coloque a vírgula no produto <em>da direita para a esquerda</em>.
  </div>

  <div style="padding:20px">
    <p style="font-size:14px;color:var(--text-mid);margin-bottom:16px">Vamos multiplicar <strong>2,4 × 1,5</strong>. Ignorando as vírgulas: 24 × 15 = 360. Fatores têm 1+1=2 casas decimais. Resultado: 3,60.</p>

    <div class="edu-math-example">
      <span class="edu-math-example-title">Exemplos resolvidos — Multiplicação</span>
      <div class="edu-math-cols">
        <div class="edu-math-col">
          <svg width="180" height="150" viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="160" y="30" text-anchor="end" font-size="20" fill="currentColor">2,4</text>
            <text x="160" y="60" text-anchor="end" font-size="20" fill="currentColor">× 1,5</text>
            <line x1="10" y1="74" x2="170" y2="74" stroke="currentColor" stroke-width="2"/>
            <text x="160" y="102" text-anchor="end" font-size="18" fill="var(--text-mid)">24×15=360</text>
            <text x="160" y="130" text-anchor="end" font-size="20" fill="#7A00FF" font-weight="700">3,60</text>
          </svg>
          <p style="font-size:12px;color:var(--text-dim)">2 casas decimais no total</p>
        </div>
        <div class="edu-math-col">
          <svg width="180" height="150" viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="160" y="30" text-anchor="end" font-size="20" fill="currentColor">1,25</text>
            <text x="160" y="60" text-anchor="end" font-size="20" fill="currentColor">× 0,4</text>
            <line x1="10" y1="74" x2="170" y2="74" stroke="currentColor" stroke-width="2"/>
            <text x="160" y="102" text-anchor="end" font-size="18" fill="var(--text-mid)">125×4=500</text>
            <text x="160" y="130" text-anchor="end" font-size="20" fill="#7A00FF" font-weight="700">0,500</text>
          </svg>
          <p style="font-size:12px;color:var(--text-dim)">3 casas decimais no total</p>
        </div>
        <div class="edu-math-col">
          <svg width="180" height="150" viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="160" y="30" text-anchor="end" font-size="20" fill="currentColor">0,06</text>
            <text x="160" y="60" text-anchor="end" font-size="20" fill="currentColor">× 0,3</text>
            <line x1="10" y1="74" x2="170" y2="74" stroke="currentColor" stroke-width="2"/>
            <text x="160" y="102" text-anchor="end" font-size="18" fill="var(--text-mid)">6×3=18</text>
            <text x="160" y="130" text-anchor="end" font-size="20" fill="#7A00FF" font-weight="700">0,018</text>
          </svg>
          <p style="font-size:12px;color:var(--text-dim)">3 casas decimais no total</p>
        </div>
      </div>
    </div>

    <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:14px 18px;margin-top:16px;font-size:13px;color:var(--text-mid)">
      <strong style="color:var(--text)">Atalho prático:</strong> multiplicar por <strong>10, 100, 1.000</strong> = deslocar a vírgula <em>para a direita</em> 1, 2, 3 casas. Ex: 3,7 × 100 = 370.
    </div>

    <h4 style="font-size:15px;margin:20px 0 10px;color:var(--text)">Simulador — Multiplicação</h4>
  </div>

  <div class="edu-math-engine">
    <div class="edu-math-inputs">
      <div class="edu-math-input-group">
        <label for="em-mul1">Fator A</label>
        <input type="number" id="em-mul1" value="2.4" step="0.01" class="edu-math-input">
      </div>
      <div class="edu-math-input-group">
        <label for="em-mul2">× Fator B</label>
        <input type="number" id="em-mul2" value="1.5" step="0.1" class="edu-math-input">
      </div>
    </div>
    <div class="edu-math-visual">
      <div class="edu-math-calc" id="em-mul-calc"></div>
      <div class="edu-math-tags" id="em-mul-explain"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SEÇÃO 3: DIVISÃO
     ══════════════════════════════════════════════ -->
<div class="edu-math-card">
  <div class="edu-math-card-header">
    <span class="edu-math-op-badge edu-math-op-div">03</span>
    <h3 class="edu-math-title"><i class="fas fa-divide" aria-hidden="true"></i> Divisão de Decimais</h3>
  </div>
  <div class="edu-math-rule">
    <strong>Regra de ouro:</strong> iguale as casas decimais de dividendo e divisor adicionando zeros. Depois <em>corte a vírgula de ambos</em> — divisão de inteiros comum. Se não for exata, continue com casas decimais no quociente.
  </div>

  <div style="padding:20px">
    <p style="font-size:14px;color:var(--text-mid);margin-bottom:16px">Vamos dividir <strong>3,6 ÷ 0,4</strong>. Igualamos: ambos têm 1 casa. Cortamos as vírgulas: 36 ÷ 4 = 9.</p>

    <div class="edu-math-example">
      <span class="edu-math-example-title">Exemplos resolvidos — Divisão</span>
      <div class="edu-math-cols">
        <div class="edu-math-col">
          <svg width="200" height="140" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="14" y="36" font-size="20" fill="currentColor">36</text>
            <line x1="50" y1="14" x2="50" y2="80" stroke="currentColor" stroke-width="2"/>
            <line x1="50" y1="44" x2="150" y2="44" stroke="currentColor" stroke-width="2"/>
            <text x="62" y="36" font-size="20" fill="currentColor">4</text>
            <text x="62" y="72" font-size="20" fill="#FF0055" font-weight="700">9</text>
            <text x="14" y="110" font-size="13" fill="var(--text-dim)">3,6 ÷ 0,4 = 36 ÷ 4 = 9</text>
          </svg>
        </div>
        <div class="edu-math-col">
          <svg width="200" height="140" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="14" y="36" font-size="20" fill="currentColor">225</text>
            <line x1="60" y1="14" x2="60" y2="80" stroke="currentColor" stroke-width="2"/>
            <line x1="60" y1="44" x2="160" y2="44" stroke="currentColor" stroke-width="2"/>
            <text x="72" y="36" font-size="20" fill="currentColor">15</text>
            <text x="72" y="72" font-size="20" fill="#FF0055" font-weight="700">15</text>
            <text x="14" y="110" font-size="13" fill="var(--text-dim)">2,25 ÷ 0,15 = 225÷15 = 15</text>
          </svg>
        </div>
        <div class="edu-math-col">
          <svg width="200" height="140" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" style="font-family:var(--font-m);display:block">
            <text x="14" y="36" font-size="20" fill="currentColor">13</text>
            <line x1="44" y1="14" x2="44" y2="100" stroke="currentColor" stroke-width="2"/>
            <line x1="44" y1="44" x2="150" y2="44" stroke="currentColor" stroke-width="2"/>
            <text x="56" y="36" font-size="20" fill="currentColor">4</text>
            <text x="56" y="72" font-size="18" fill="#FF0055" font-weight="700">3,25</text>
            <text x="14" y="118" font-size="13" fill="var(--text-dim)">13 ÷ 4 = 3,25 (exato)</text>
          </svg>
        </div>
      </div>
    </div>

    <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:14px 18px;margin-top:16px;font-size:13px;color:var(--text-mid)">
      <strong style="color:var(--text)">Atalho prático:</strong> dividir por <strong>10, 100, 1.000</strong> = deslocar a vírgula <em>para a esquerda</em> 1, 2, 3 casas. Ex: 47,5 ÷ 100 = 0,475.
    </div>

    <h4 style="font-size:15px;margin:20px 0 10px;color:var(--text)">Simulador — Divisão</h4>
  </div>

  <div class="edu-math-engine">
    <div class="edu-math-inputs">
      <div class="edu-math-input-group">
        <label for="em-div1">Dividendo</label>
        <input type="number" id="em-div1" value="3.6" step="0.1" class="edu-math-input">
      </div>
      <div class="edu-math-input-group">
        <label for="em-div2">÷ Divisor</label>
        <input type="number" id="em-div2" value="0.4" step="0.1" class="edu-math-input">
      </div>
    </div>
    <div class="edu-math-visual">
      <div class="edu-math-calc" id="em-div-calc"></div>
      <div class="edu-math-tags" id="em-div-explain"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SEÇÃO 4: FRAÇÃO → DECIMAL → PORCENTAGEM
     ══════════════════════════════════════════════ -->
<div class="edu-math-card">
  <div class="edu-math-card-header">
    <span class="edu-math-op-badge edu-math-op-frac">04</span>
    <h3 class="edu-math-title"><i class="fas fa-percent" aria-hidden="true"></i> Fração → Decimal → Porcentagem</h3>
  </div>
  <div class="edu-math-rule">
    <strong>Regra de ouro:</strong> divida o numerador pelo denominador para obter o decimal. Multiplique por 100 para a porcentagem. Quando o decimal repete infinitamente, chamamos de <em>dízima periódica</em>.
  </div>

  <div style="padding:20px">
    <p style="font-size:14px;color:var(--text-mid);margin-bottom:16px">As três formas são equivalentes e representam a mesma proporção. Saber converter entre elas é essencial para o dia a dia, ENEM e concursos.</p>

    <div class="edu-math-example">
      <span class="edu-math-example-title">Exemplos de conversão</span>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px">
        <div style="background:var(--bg-surface);border:1px solid var(--border2);border-radius:var(--r);padding:14px;text-align:center">
          <div style="font-family:var(--font-m);font-size:22px;margin-bottom:8px">
            <span style="border-bottom:2px solid currentColor;padding:0 6px">3</span><br>
            <span style="padding:0 6px">4</span>
          </div>
          <div style="font-size:13px;color:var(--text-mid)">= <strong>0,75</strong> = <strong style="color:var(--accent-text)">75%</strong></div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:4px">Decimal exato</div>
        </div>
        <div style="background:var(--bg-surface);border:1px solid var(--border2);border-radius:var(--r);padding:14px;text-align:center">
          <div style="font-family:var(--font-m);font-size:22px;margin-bottom:8px">
            <span style="border-bottom:2px solid currentColor;padding:0 6px">1</span><br>
            <span style="padding:0 6px">3</span>
          </div>
          <div style="font-size:13px;color:var(--text-mid)">= <strong>0,333…</strong> = <strong style="color:var(--accent-text)">33,33%</strong></div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:4px">Dízima periódica simples</div>
        </div>
        <div style="background:var(--bg-surface);border:1px solid var(--border2);border-radius:var(--r);padding:14px;text-align:center">
          <div style="font-family:var(--font-m);font-size:22px;margin-bottom:8px">
            <span style="border-bottom:2px solid currentColor;padding:0 6px">5</span><br>
            <span style="padding:0 6px">6</span>
          </div>
          <div style="font-size:13px;color:var(--text-mid)">= <strong>0,8333…</strong> = <strong style="color:var(--accent-text)">83,33%</strong></div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:4px">Dízima periódica composta</div>
        </div>
      </div>
    </div>

    <h4 style="font-size:15px;margin:20px 0 10px;color:var(--text)">Simulador — Conversor de Fração</h4>
  </div>

  <div class="edu-math-engine">
    <div class="edu-math-inputs">
      <div class="edu-math-input-group">
        <label for="em-fnum">Numerador</label>
        <input type="number" id="em-fnum" value="3" min="0" class="edu-math-input">
      </div>
      <div class="edu-math-input-group">
        <label for="em-fden">Denominador</label>
        <input type="number" id="em-fden" value="4" min="1" class="edu-math-input">
      </div>
    </div>
    <div class="edu-math-visual">
      <div class="edu-math-calc" id="em-frac-calc"></div>
      <div class="edu-math-tags" id="em-frac-explain"></div>
    </div>
  </div>
</div>

<script>
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };

  function renderAdd(){
    var v1=parseFloat($('em-add1').value)||0;
    var v2=parseFloat($('em-add2').value)||0;
    var op=$('em-op').value;
    var res=op==='+'?v1+v2:v1-v2;
    var s1=v1.toString(), s2=v2.toString();
    var c1=s1.includes('.')?s1.split('.')[1].length:0;
    var c2=s2.includes('.')?s2.split('.')[1].length:0;
    var mc=Math.max(c1,c2);
    var sym=op==='+'?'+':'−';
    var el=$('em-add-calc');
    if(el) el.innerHTML='<div class="edu-mc-row">'+v1.toFixed(mc)+'</div>'
      +'<div class="edu-mc-row edu-mc-op">'+sym+' '+v2.toFixed(mc)+'</div>'
      +'<div class="edu-mc-line"></div>'
      +'<div class="edu-mc-row edu-mc-result">'+res.toFixed(mc)+'</div>';
    var ex=$('em-add-explain');
    if(ex) ex.innerHTML='<span class="edu-mc-tag">'+mc+' casas decimais igualadas</span>'
      +'<span class="edu-mc-tag edu-mc-tag--ok">= '+res.toFixed(mc)+'</span>';
  }

  function renderMul(){
    var f1=parseFloat($('em-mul1').value)||0;
    var f2=parseFloat($('em-mul2').value)||0;
    var prod=f1*f2;
    var s1=f1.toString(), s2=f2.toString();
    var c1=s1.includes('.')?s1.split('.')[1].length:0;
    var c2=s2.includes('.')?s2.split('.')[1].length:0;
    var tc=c1+c2;
    var el=$('em-mul-calc');
    if(el) el.innerHTML='<div class="edu-mc-row">'+s1+'</div>'
      +'<div class="edu-mc-row edu-mc-op">× '+s2+'</div>'
      +'<div class="edu-mc-line"></div>'
      +'<div class="edu-mc-row edu-mc-result">'+prod.toFixed(tc)+'</div>';
    var ex=$('em-mul-explain');
    if(ex) ex.innerHTML='<span class="edu-mc-tag">A: '+c1+' casa(s)</span>'
      +'<span class="edu-mc-tag">B: '+c2+' casa(s)</span>'
      +'<span class="edu-mc-tag">Total: '+tc+' casas</span>'
      +'<span class="edu-mc-tag edu-mc-tag--ok">= '+prod.toFixed(tc)+'</span>';
  }

  function renderDiv(){
    var d1=parseFloat($('em-div1').value)||0;
    var d2=parseFloat($('em-div2').value)||1;
    if(d2===0){ d2=1; }
    var s1=d1.toString(), s2=d2.toString();
    var c1=s1.includes('.')?s1.split('.')[1].length:0;
    var c2=s2.includes('.')?s2.split('.')[1].length:0;
    var mc=Math.max(c1,c2);
    var fator=Math.pow(10,mc);
    var intD=Math.round(d1*fator);
    var intDv=Math.round(d2*fator);
    var quot=d1/d2;
    var el=$('em-div-calc');
    if(el) el.innerHTML='<div class="edu-mc-division">'
      +'<span class="edu-mc-dividend">'+intD+'</span>'
      +'<span class="edu-mc-divbar"> ÷ </span>'
      +'<span class="edu-mc-divisor">'+intDv+'</span>'
      +'<span class="edu-mc-equals"> = </span>'
      +'<span class="edu-mc-quotient">'+Number(quot.toFixed(6))+'</span>'
      +'</div>';
    var ex=$('em-div-explain');
    if(ex) ex.innerHTML='<span class="edu-mc-tag">×'+fator+' elimina vírgulas</span>'
      +'<span class="edu-mc-tag edu-mc-tag--ok">= '+Number(quot.toFixed(6))+'</span>';
  }

  function renderFrac(){
    var num=parseInt($('em-fnum').value)||0;
    var den=parseInt($('em-fden').value)||1;
    if(den===0){ den=1; }
    var dec=num/den;
    var ds=dec.toString();
    var isDiz=ds.length>9 && ds.includes('.');
    var pct=(dec*100).toFixed(2);
    var tipo='Decimal Exato';
    if(!ds.includes('.')) tipo='Número Inteiro';
    else if(isDiz){
      // Detecta dízima composta: parte não-periódica antes do período
      var decPart=ds.split('.')[1]||'';
      tipo=decPart.length>4?'Dízima Periódica Composta':'Dízima Periódica Simples';
    }
    var decDisplay=isDiz?dec.toFixed(5)+'…':ds;
    var el=$('em-frac-calc');
    if(el) el.innerHTML='<div class="edu-mc-frac-row">'
      +'<div class="edu-mc-frac">'
      +'<span class="edu-mc-frac-num">'+num+'</span>'
      +'<span class="edu-mc-frac-line"></span>'
      +'<span class="edu-mc-frac-den">'+den+'</span>'
      +'</div>'
      +'<span class="edu-mc-equals"> = </span>'
      +'<span class="edu-mc-dec">'+decDisplay+'</span>'
      +'<span class="edu-mc-equals"> = </span>'
      +'<span class="edu-mc-pct">'+pct+'%</span>'
      +'</div>';
    var ex=$('em-frac-explain');
    if(ex) ex.innerHTML='<span class="edu-mc-tag">'+tipo+'</span>'
      +'<span class="edu-mc-tag edu-mc-tag--ok">'+pct+'% do total</span>';
  }

  function addEv(id, fn){
    var el=document.getElementById(id);
    if(el) el.addEventListener('input', fn);
  }

  function init(){
    addEv('em-add1',renderAdd); addEv('em-add2',renderAdd); addEv('em-op',renderAdd);
    addEv('em-mul1',renderMul); addEv('em-mul2',renderMul);
    addEv('em-div1',renderDiv); addEv('em-div2',renderDiv);
    addEv('em-fnum',renderFrac); addEv('em-fden',renderFrac);
    renderAdd(); renderMul(); renderDiv(); renderFrac();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
</script>`,
    },
    'Frações': {
      title: 'Frações: tipos, operações e simplificação',
      summary: 'Aprenda frações do zero: tipos, operações e aplicações no dia a dia.',
      difficulty: 'iniciante', duration_min: 15,
      content: `<h2>O que são frações?</h2>
<p>Uma fração representa uma ou mais partes de um todo. É escrita na forma <strong>a/b</strong>, onde <strong>a</strong> é o numerador e <strong>b</strong> o denominador (b ≠ 0).</p>
<h3>Tipos de frações</h3>
<ul>
  <li><strong>Própria:</strong> numerador menor que denominador — ex: 3/4</li>
  <li><strong>Imprópria:</strong> numerador maior — ex: 5/3</li>
  <li><strong>Aparente:</strong> resultado inteiro — ex: 6/2 = 3</li>
  <li><strong>Mista:</strong> inteiro + fração — ex: 1 2/3</li>
</ul>
<h2>Adição e subtração</h2>
<p><strong>Denominadores iguais:</strong> some os numeradores: <code>3/8 + 2/8 = 5/8</code></p>
<p><strong>Denominadores diferentes:</strong> calcule o MMC e transforme:</p>
<pre>1/2 + 1/3 = 3/6 + 2/6 = 5/6</pre>
<h2>Multiplicação e divisão</h2>
<p><strong>Multiplicação:</strong> num × num e den × den:</p>
<pre>3/4 × 2/5 = 6/20 = 3/10</pre>
<p><strong>Divisão:</strong> mantenha a primeira, inverta a segunda:</p>
<pre>3/4 ÷ 2/5 = 3/4 × 5/2 = 15/8</pre>
<h2>Simplificação</h2>
<p>Divida pelo MDC (Máximo Divisor Comum):</p>
<pre>12/18 → MDC = 6 → 2/3</pre>`,
    },
    'Porcentagem': {
      title: 'Porcentagem: cálculos essenciais',
      summary: 'Domine porcentagem para o dia a dia, concursos e ENEM.',
      difficulty: 'iniciante', duration_min: 20,
      content: `<h2>O que é porcentagem?</h2>
<p>Porcentagem (%) significa "por cento" — proporção em relação a 100.</p>
<h3>Cálculo básico</h3>
<pre>20% de 150 = 150 × 20 / 100 = 30</pre>
<h3>Aumento percentual</h3>
<pre>150 com 20% de aumento = 150 × 1,20 = 180</pre>
<h3>Desconto percentual</h3>
<pre>R$ 400 com 15% de desconto = 400 × 0,85 = R$ 340</pre>
<h3>Variação percentual</h3>
<pre>De 200 para 250: ((250−200)/200) × 100 = 25%</pre>`,
    },
  },
  programacao: {
    'Python': {
      title: 'Python: primeiros passos',
      summary: 'Aprenda Python do zero com exemplos práticos e exercícios.',
      difficulty: 'iniciante', duration_min: 30,
      content: `<h2>Por que Python?</h2>
<p>Python é uma das linguagens mais populares do mundo. É usada em <strong>Inteligência Artificial</strong>, desenvolvimento web, automação, análise de dados e muito mais.</p>
<h3>Instalação</h3>
<p>Baixe o Python em <a href="https://python.org" target="_blank" rel="noopener">python.org</a> e instale normalmente.</p>
<h3>Primeiro programa</h3>
<pre>print("Olá, mundo!")</pre>
<h3>Variáveis</h3>
<pre>nome = "Felipe"
idade = 25
altura = 1.80
ativo = True

print(f"Nome: {nome}, Idade: {idade}")</pre>
<h3>Condicionais</h3>
<pre>if idade >= 18:
    print("Maior de idade")
elif idade >= 12:
    print("Adolescente")
else:
    print("Criança")</pre>`,
    },
  },
  ingles: {
    'Verb Tenses': {
      title: 'Verb Tenses: todos os tempos verbais',
      summary: 'Domine os tempos verbais em inglês de forma clara e prática.',
      difficulty: 'intermediario', duration_min: 25,
      content: `<h2>Why are Verb Tenses important?</h2>
<p>Verb tenses tell us <strong>when</strong> an action happens. In English, there are 12 main tenses organized into 3 groups: Past, Present, and Future.</p>
<h3>Simple Present</h3>
<p>Used for habits, facts, and general truths.</p>
<pre>I study English every day.
She works at Dryfour.</pre>
<h3>Present Continuous</h3>
<p>Used for actions happening now or temporary situations.</p>
<pre>I am studying right now.
They are building a new house.</pre>
<h3>Simple Past</h3>
<p>Used for completed actions in the past.</p>
<pre>I studied yesterday.
She worked until 6pm.</pre>`,
    },
  },
};

/* ================================================================
   AFILIADOS POR DISCIPLINA (neuromarketing oculto)
   Cada disciplina mostra um produto contextualmente relevante
   ================================================================ */
const EDU_AFFILIATES = {
  matematica:   { title:'Matemática Completa do Zero ao Avançado', desc:'Curso completo com mais de 200 aulas, exercícios resolvidos e simulados do ENEM.', price:'R$ 197', original:'R$ 497', badge:'-60%', img:'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300&q=80', btn:'Acessar o curso', color:'#FF9F1C' },
  fisica:       { title:'Física para Concursos e ENEM', desc:'Teoria completa, resolução de exercícios e simulações interativas com professores PhDs.', price:'R$ 147', original:'R$ 397', badge:'-63%', img:'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=300&q=80', btn:'Começar agora', color:'#7A00FF' },
  programacao:  { title:'Python do Zero ao DataScience', desc:'Aprenda Python com projetos reais: automação, análise de dados e machine learning.', price:'R$ 297', original:'R$ 697', badge:'-57%', img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80', btn:'Quero aprender Python', color:'#7A00FF' },
  ingles:       { title:'Inglês Fluente em 6 Meses', desc:'Método comprovado de imersão. Pronúncia nativa, gramática e conversação do dia a dia.', price:'R$ 247', original:'R$ 547', badge:'-55%', img:'https://images.unsplash.com/photo-1434030216411-0b793f4b6af9?w=300&q=80', btn:'Falar inglês agora', color:'#0049FF' },
  espanhol:     { title:'Espanhol para o Mundo', desc:'Do zero à fluência: gramática, vocabulário e cultura hispana. Método natural de aquisição.', price:'R$ 197', original:'R$ 447', badge:'-56%', img:'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=300&q=80', btn:'Aprender espanhol', color:'#00F5D4' },
  eletronica:   { title:'Kit Arduino Completo — Dryfour Shopping', desc:'Kit com Arduino Uno, 37 sensores, protoboard, LEDs e guia completo de projetos para iniciantes.', price:'R$ 189', original:'R$ 289', badge:'-35%', img:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&q=80', btn:'Ver no Dryfour Shopping', color:'#FF0055', shop:true },
  quimica:      { title:'Química Total — ENEM e Vestibulares', desc:'Química orgânica, inorgânica e físico-química. Mais de 300 questões comentadas.', price:'R$ 167', original:'R$ 367', badge:'-55%', img:'https://images.unsplash.com/photo-1532094349884-543559c18c6c?w=300&q=80', btn:'Acessar química total', color:'#00cc52' },
  hobbies:      { title:'Cubo Mágico Profissional MoYu — Dryfour Shopping', desc:'Cubo MoYu RS3M 2020, o preferido dos speedcubers. Leve, suave e perfeitamente calibrado.', price:'R$ 89', original:'R$ 149', badge:'-40%', img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', btn:'Comprar cubo', color:'#FF00C8', shop:true },
  portugues:    { title:'Redação Nota 1000 — ENEM', desc:'Método validado por especialistas. Estrutura, argumentação e repertório para tirar a nota máxima.', price:'R$ 127', original:'R$ 297', badge:'-57%', img:'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&q=80', btn:'Quero nota 1000', color:'#FF00C8' },
  alemao:       { title:'Alemão A1 ao B2 — Método Berlitz Online', desc:'Aprenda alemão com professores nativos. Certificado reconhecido internacionalmente.', price:'R$ 347', original:'R$ 797', badge:'-56%', img:'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=300&q=80', btn:'Aprender alemão', color:'#FF0055' },
};

/* ================================================================
   TICKER DATA (reutilizando padrão do index)
   ================================================================ */
const TICKER_ITEMS = [
  { icon:'fas fa-graduation-cap', text:'Aprender+ — Conteúdo educacional gratuito no Dryfour Blog' },
  { icon:'fas fa-code',           text:'Programação Python: novo tópico sobre DataScience disponível' },
  { icon:'fas fa-calculator',     text:'Matemática: exercícios de porcentagem atualizados para 2026' },
  { icon:'fas fa-language',       text:'Inglês: tópico de Verb Tenses com áudio e exemplos' },
  { icon:'fas fa-microchip',      text:'Eletrônica: guia completo de Arduino para iniciantes' },
  { icon:'fas fa-book-open',      text:'Português: nova aula de redação dissertativa publicada' },
  { icon:'fas fa-bolt',           text:'Dryfour Shopping: kit Arduino com 35% de desconto' },
];

/* ================================================================
   UTILITÁRIOS
   ================================================================ */
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function fmt(n) { return n?.toLocaleString('pt-BR') || ''; }

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const colors = { success:'#00c9ad', warn:'#FF9F1C', error:'#FF0055' };
  const icons  = { success:'fa-circle-check', warn:'fa-triangle-exclamation', info:'fa-circle-info' };
  const color  = colors[type] || 'var(--accent)';
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.borderLeftColor = color;
  t.setAttribute('role', 'status');
  t.innerHTML = `<i class="fas ${icons[type]||icons.info}" style="color:${color};flex-shrink:0" aria-hidden="true"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 380); }, 3800);
}

/* ================================================================
   EDU THEME ENGINE
   Muda body class, accent CSS vars, breadcrumb e badge do header.
   ================================================================ */
const EduThemeEngine = {
  set(subjectSlug) {
    const cfg = EDU_SUBJECTS[subjectSlug];
    if (!cfg) return;

    // Remove todas as classes de nicho
    const allClasses = Object.values(EDU_SUBJECTS).map(s => s.themeClass);
    document.body.classList.remove(...allClasses);
    document.body.classList.add('edu-page', cfg.themeClass);

    // Atualiza niche badge no header
    const badge = qs('#nicheLabelBadge');
    if (badge) badge.textContent = cfg.name.toUpperCase();
    const dot = qs('#nicheDot');
    if (dot) dot.style.background = cfg.accent;

    // Breadcrumb
    const bcSubject = qs('#eduBcSubject');
    const bcSep2    = qs('#eduBcSep2');
    if (bcSubject) { bcSubject.textContent = cfg.name; bcSubject.style.display = ''; }
    if (bcSep2)    bcSep2.style.display = '';

    // Sidebar: marca a disciplina ativa
    document.querySelectorAll('.edu-disc-header').forEach(h => {
      const isActive = h.closest('.edu-discipline-item')?.dataset.subject === subjectSlug;
      h.classList.toggle('active-disc', isActive);
    });

    // CustomEvent para extensões futuras
    document.dispatchEvent(new CustomEvent('edu:subject-change', { detail: { slug: subjectSlug, cfg } }));
  },
};

/* ================================================================
   EDU SIDEBAR MODULE
   Desktop: sempre visível, sticky
   Mobile: drawer com overlay, hamburger, ESC, focus-trap básico
   Accordion multinível: disciplina → grupo → tópico
   ================================================================ */
const EduSidebarModule = {
  sidebar:  null,
  overlay:  null,
  hamBtn:   null,
  closeBtn: null,

  init() {
    this.sidebar  = qs('#eduSidebar');
    this.overlay  = qs('#eduSidebarOverlay');
    this.hamBtn   = qs('#eduHamBtn');
    this.closeBtn = qs('#eduSbClose');

    this.hamBtn?.addEventListener('click',   () => this.open());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click',     () => this.close());
    this.overlay?.addEventListener('touchstart', () => this.close(), { passive: true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && EduState.sidebarOpen) this.close(); });
    // Redimensionamento: se desktop, fecha e garante estado limpo
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && EduState.sidebarOpen) {
        EduState.sidebarOpen = false;
        this.sidebar?.classList.remove('open');
        this.overlay?.classList.remove('active');
        this.hamBtn?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }, { passive: true });

    this._initSearch();
  },

  open() {
    // Só abre no mobile (≤1024px) — no desktop o sidebar é sempre visível
    if (window.innerWidth > 1024) return;
    if (EduState.sidebarOpen) return;
    EduState.sidebarOpen = true;
    this.sidebar?.classList.add('open');
    this.overlay?.classList.add('active');
    this.hamBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Foco no botão fechar para acessibilidade
    setTimeout(() => this.closeBtn?.focus(), 60);
  },

  close() {
    // No desktop o sidebar fica sempre visível — não fecha
    if (window.innerWidth > 1024) return;
    if (!EduState.sidebarOpen) return;
    EduState.sidebarOpen = false;
    this.sidebar?.classList.remove('open');
    this.overlay?.classList.remove('active');
    this.hamBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Retorna foco ao hamburger para acessibilidade
    this.hamBtn?.focus();
  },

  /**
   * render(subjects) — constrói o sidebar a partir dos dados dos subjects
   * subjects: array de objetos do banco ou EDU_SUBJECTS
   */
  render(subjects) {
    const nav = qs('#eduSbNav');
    if (!nav) return;

    nav.innerHTML = subjects.map(s => {
      const cfg = EDU_SUBJECTS[s.slug] || {};
      const grupos = s.sidebar_json?.grupos || [];

      const gruposHTML = grupos.map((g, gi) => {
        const topicsHTML = (g.topicos || []).map(t => `
          <button class="edu-topic-btn" data-subject="${s.slug}" data-group="${g.nome}" data-topic="${t}" aria-label="${t}">
            <i class="fas fa-circle-dot" aria-hidden="true"></i>
            <span>${t}</span>
          </button>`).join('');

        return `
          <div class="edu-group-item">
            <button class="edu-group-header" aria-expanded="false" aria-controls="grp-${s.slug}-${gi}">
              <i class="fas fa-chevron-right" aria-hidden="true"></i>
              <span>${g.nome}</span>
            </button>
            <div class="edu-group-topics" id="grp-${s.slug}-${gi}">
              <div class="edu-group-body">${topicsHTML}</div>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="edu-discipline-item" data-subject="${s.slug}">
          <button class="edu-disc-header" aria-expanded="false" aria-controls="disc-${s.slug}">
            <span class="edu-disc-icon ${cfg.discIcon || ''}">
              <i class="${s.icon || cfg.icon || 'fas fa-book'}" aria-hidden="true"></i>
            </span>
            <span class="edu-disc-name">${s.name}</span>
            <i class="fas fa-chevron-right edu-disc-arrow" aria-hidden="true"></i>
          </button>
          <div class="edu-disc-groups" id="disc-${s.slug}">
            <div class="edu-disc-body">${gruposHTML}</div>
          </div>
        </div>`;
    }).join('');

    this._initAccordion();
    this._initTopicLinks();
  },

  /**
   * Accordion de dois níveis:
   * Nível 1: .edu-disc-header → .edu-disc-groups (disciplinas)
   * Nível 2: .edu-group-header → .edu-group-topics (grupos)
   * Técnica: grid-template-rows:0fr→1fr (mesma do nexus-sidebar)
   */
  _initAccordion() {
    // Nível 1: disciplinas
    document.querySelectorAll('.edu-disc-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const subjectSlug = btn.closest('.edu-discipline-item')?.dataset.subject;
        const bodyId = btn.getAttribute('aria-controls');
        const body   = bodyId ? qs('#' + bodyId) : null;
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Fecha todas as outras disciplinas
        document.querySelectorAll('.edu-disc-header').forEach(b => {
          if (b === btn) return;
          b.setAttribute('aria-expanded', 'false');
          const id = b.getAttribute('aria-controls');
          if (id) qs('#' + id)?.classList.remove('open');
        });

        // Toggle desta disciplina
        btn.setAttribute('aria-expanded', String(!isOpen));
        body?.classList.toggle('open', !isOpen);

        // Ativa tema
        if (subjectSlug && !isOpen) {
          EduState.activeSubject = subjectSlug;
          EduThemeEngine.set(subjectSlug);
          EduQuickGrid.hide();
        }
      });
    });

    // Nível 2: grupos dentro de cada disciplina
    document.querySelectorAll('.edu-group-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const bodyId = btn.getAttribute('aria-controls');
        const body   = bodyId ? qs('#' + bodyId) : null;
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Fecha outros grupos da mesma disciplina
        const disc = btn.closest('.edu-disc-groups');
        disc?.querySelectorAll('.edu-group-header').forEach(b => {
          if (b === btn) return;
          b.setAttribute('aria-expanded', 'false');
          const id = b.getAttribute('aria-controls');
          if (id) qs('#' + id)?.classList.remove('open');
        });

        btn.setAttribute('aria-expanded', String(!isOpen));
        body?.classList.toggle('open', !isOpen);
      });
    });
  },

  /** Handlers dos botões de tópico */
  _initTopicLinks() {
    document.querySelectorAll('.edu-topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const subject = btn.dataset.subject;
        const group   = btn.dataset.group;
        const topic   = btn.dataset.topic;

        // Marca tópico ativo
        document.querySelectorAll('.edu-topic-btn').forEach(b => b.classList.remove('active-topic'));
        btn.classList.add('active-topic');

        EduState.activeSubject = subject;
        EduState.activeGroup   = group;
        EduState.activeTopic   = topic;

        // Fecha drawer no mobile
        this.close();

        // Carrega o conteúdo
        EduContentModule.load(subject, group, topic);
        EduThemeEngine.set(subject);
      });
    });
  },

  /** Busca em tempo real: filtra tópicos visíveis */
  _initSearch() {
    const input = qs('#eduSbSearch');
    const clear = qs('#eduSbSearchClear');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      EduState.searchQuery = q;
      if (clear) clear.style.display = q ? 'block' : 'none';

      // Filtra botões de tópico
      document.querySelectorAll('.edu-topic-btn').forEach(btn => {
        const text = btn.querySelector('span')?.textContent.toLowerCase() || '';
        btn.style.display = !q || text.includes(q) ? '' : 'none';
      });

      // Auto-expande disciplinas que têm tópicos visíveis
      document.querySelectorAll('.edu-discipline-item').forEach(disc => {
        const visible = Array.from(disc.querySelectorAll('.edu-topic-btn')).some(b => b.style.display !== 'none');
        if (q && visible) {
          const header = disc.querySelector('.edu-disc-header');
          const body   = qs('#' + header?.getAttribute('aria-controls'));
          header?.setAttribute('aria-expanded', 'true');
          body?.classList.add('open');
        }
      });
    });

    clear?.addEventListener('click', () => {
      input.value = '';
      EduState.searchQuery = '';
      clear.style.display = 'none';
      document.querySelectorAll('.edu-topic-btn').forEach(b => b.style.display = '');
    });
  },
};

/* ================================================================
   EDU QUICK GRID — Grid de seleção rápida na tela de boas-vindas
   ================================================================ */
const EduQuickGrid = {
  render(subjects) {
    const grid = qs('#eduQuickGrid');
    if (!grid) return;

    grid.innerHTML = subjects.map(s => {
      const cfg = EDU_SUBJECTS[s.slug] || {};
      return `
        <button class="edu-quick-card" data-subject="${s.slug}" aria-label="Estudar ${s.name}">
          <div class="edu-quick-icon ${cfg.discIcon || ''}" style="background:${cfg.accent || 'var(--accent)'}">
            <i class="${s.icon || cfg.icon || 'fas fa-book'}" aria-hidden="true"></i>
          </div>
          <span class="edu-quick-name">${s.name}</span>
        </button>`;
    }).join('');

    grid.querySelectorAll('.edu-quick-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.dataset.subject;
        EduState.activeSubject = slug;
        EduThemeEngine.set(slug);
        this.hide();

        // Abre a disciplina no sidebar
        const discHeader = qs(`.edu-discipline-item[data-subject="${slug}"] .edu-disc-header`);
        if (discHeader && discHeader.getAttribute('aria-expanded') !== 'true') {
          discHeader.click();
        }

        showToast(`Disciplina ${EDU_SUBJECTS[slug]?.name || slug} selecionada!`, 'success');
      });
    });
  },

  hide() {
    const w = qs('#eduWelcome');
    if (w) w.style.display = 'none';
  },
};

/* ================================================================
   EDU CONTENT MODULE
   Carrega conteúdo do tópico — API primeiro, fallback mock.
   ================================================================ */
const EduContentModule = {
  async load(subject, group, topic) {
    const view = qs('#eduContentView');
    const body = qs('#eduBody');
    if (!view || !body) return;

    // Mostra view e skeleton
    view.style.display = 'block';
    body.innerHTML = `
      <div class="edu-skeleton" style="height:18px;width:60%;border-radius:6px;margin-bottom:16px;"></div>
      <div class="edu-skeleton" style="height:14px;border-radius:6px;margin-bottom:10px;"></div>
      <div class="edu-skeleton" style="height:14px;width:85%;border-radius:6px;margin-bottom:10px;"></div>
      <div class="edu-skeleton" style="height:14px;width:70%;border-radius:6px;margin-bottom:24px;"></div>
      <div class="edu-skeleton" style="height:18px;width:50%;border-radius:6px;margin-bottom:16px;"></div>
      <div class="edu-skeleton" style="height:14px;border-radius:6px;margin-bottom:10px;"></div>`;

    // Atualiza header do conteúdo imediatamente
    const cfg = EDU_SUBJECTS[subject] || {};
    this._updateHeader(cfg.name, group, topic, 'iniciante', 15);

    // Scroll para o topo do conteúdo
    view.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Tenta buscar da API
    let content = null;
    try {
      const res = await fetch(`/api/edu?subject=${subject}&group=${encodeURIComponent(group)}&topic=${encodeURIComponent(topic)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) content = json.data;
      }
    } catch(e) {
      console.warn('[DRYFOUR-BLOG] API edu indisponível — usando mock', e);
    }

    // Fallback para mock
    if (!content) {
      const mockSubject = EDU_MOCK_CONTENT[subject];
      const mockTopic   = mockSubject?.[topic];
      if (mockTopic) {
        content = mockTopic;
      } else {
        content = {
          title: topic,
          summary: `Conteúdo sobre ${topic} em ${EDU_SUBJECTS[subject]?.name || subject}.`,
          difficulty: 'iniciante', duration_min: 10,
          content: `<h2>${topic}</h2><p>Este conteúdo está sendo preparado pela equipe do Dryfour Blog. Em breve estará disponível!</p><p>Enquanto isso, explore outros tópicos desta disciplina no menu ao lado.</p>`,
        };
      }
    }

    // Renderiza
    this._updateHeader(cfg.name, group, content.title || topic, content.difficulty, content.duration_min);
    const bodyEl = qs('#eduBody');
    if (bodyEl) {
      const hasHTML = /<[a-z][\s\S]*>/i.test(content.content || '');
      bodyEl.innerHTML = hasHTML
        ? content.content
        : (content.content || '').split('\n\n').filter(Boolean).map(p => `<p>${p}</p>`).join('');
    }

    // Afiliado contextual
    EduAffiliateModule.render(subject);

    // Progresso de leitura
    EduProgressModule.init();

    // Atualiza URL sem recarregar
    const url = new URL(window.location);
    url.searchParams.set('subject', subject);
    url.searchParams.set('topic',   topic);
    window.history.replaceState({}, '', url);
  },

  _updateHeader(subjectName, group, title, difficulty, duration) {
    const set = (id, val) => { const el = qs('#' + id); if (el) el.textContent = val; };
    set('eduContentSubject', subjectName || '');
    set('eduContentGroup',   group || '');
    set('eduContentTitle',   title || '');
    set('eduContentSummary', '');
    set('eduDurMin',         duration || 10);

    const diffEl = qs('#eduContentDiff');
    if (diffEl) {
      const diffMap = { iniciante:'Iniciante', intermediario:'Intermediário', avancado:'Avançado' };
      diffEl.textContent  = diffMap[difficulty] || difficulty || 'Iniciante';
      diffEl.className    = `edu-content-diff edu-content-diff--${difficulty || 'iniciante'}`;
    }
  },
};

/* ================================================================
   EDU AFFILIATE MODULE — Card de afiliado contextual
   Neuromarketing oculto: produto aparece naturalmente no conteúdo
   ================================================================ */
const EduAffiliateModule = {
  render(subject) {
    const container = qs('#eduAffiliateCard');
    if (!container) return;
    const aff = EDU_AFFILIATES[subject];
    if (!aff) { container.innerHTML = ''; return; }

    const borderColor = aff.color || 'var(--accent)';
    container.innerHTML = `
      <div style="border-top:4px solid ${borderColor}">
        <div style="padding:8px 16px;font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${borderColor};background:rgba(0,0,0,0.03);border-bottom:1px solid var(--border2);display:flex;align-items:center;gap:7px;">
          <i class="fas fa-${aff.shop ? 'bag-shopping' : 'graduation-cap'}" aria-hidden="true"></i>
          ${aff.shop ? 'Produto Recomendado — Dryfour Shopping' : 'Curso Recomendado'}
        </div>
        <div style="display:flex;gap:20px;padding:20px;align-items:flex-start;background:var(--bg-surface);">
          <img src="${aff.img}" alt="${aff.title}" loading="lazy" style="width:110px;height:80px;object-fit:cover;border-radius:var(--r);border:1px solid var(--border2);flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <span style="font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--text-dim);display:block;margin-bottom:6px;">${aff.shop ? 'Dryfour Shopping' : 'Info-produto'}</span>
            <h3 style="font-family:var(--font-d);font-size:17px;color:var(--text);margin-bottom:8px;line-height:1.2;">${aff.title}</h3>
            <p style="font-size:13px;color:var(--text-mid);line-height:1.6;margin-bottom:12px;">${aff.desc}</p>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
              <span style="font-size:12px;color:var(--text-dim);text-decoration:line-through;font-family:var(--font-m);">${aff.original}</span>
              <span style="font-family:var(--font-m);font-size:20px;font-weight:700;color:var(--text);">${aff.price}</span>
              <span style="background:#22c55e;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;font-family:var(--font-m);">${aff.badge}</span>
            </div>
            <a href="https://www.dryfourshopping.com.br" target="_blank" rel="noopener sponsored"
              style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:var(--r-sm);font-size:13px;font-weight:600;background:${borderColor};color:#fff;text-decoration:none;transition:filter 0.2s;">
              ${aff.btn} <i class="fas fa-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>`;
  },
};

/* ================================================================
   EDU PROGRESS MODULE — Progresso de leitura via scroll
   ================================================================ */
const EduProgressModule = {
  init() {
    const fill = qs('#eduProgressFill');
    if (!fill) return;
    const onScroll = () => {
      const main    = qs('#eduContent');
      if (!main) return;
      const rect    = main.getBoundingClientRect();
      const total   = main.scrollHeight - window.innerHeight;
      const current = Math.max(0, -rect.top);
      fill.style.width = total > 0 ? Math.min(100, (current / total) * 100) + '%' : '0%';
    };
    window.removeEventListener('scroll', this._handler);
    this._handler = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
  },
  _handler: null,
};

/* ================================================================
   TICKER MODULE
   ================================================================ */
const TickerModule = {
  init() {
    const track = qs('#tickerTrack');
    if (!track) return;
    const html = TICKER_ITEMS.map(i =>
      `<span class="ticker-item"><i class="${i.icon}" aria-hidden="true"></i>${i.text}</span>`
    ).join('');
    track.innerHTML = html + html;
  },
};

/* ================================================================
   HEADER MODULE
   ================================================================ */
const HeaderModule = {
  init() {
    const header = qs('#siteHeader');
    window.addEventListener('scroll', () => {
      header?.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  },
};

/* ================================================================
   BUSCA DE SUBJECTS NA API
   ================================================================ */
async function fetchEduSubjects() {
  try {
    const res = await fetch('/api/subjects?category=aprender');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.length) return json.data;
    }
  } catch(e) {
    console.warn('[DRYFOUR-BLOG] API subjects indisponível — usando mock local', e);
  }
  // Fallback: monta subjects a partir do EDU_SUBJECTS estático
  return Object.entries(EDU_SUBJECTS).map(([slug, cfg], i) => ({
    id: i + 1, slug, name: cfg.name, icon: cfg.icon,
    theme_class: cfg.themeClass, accent_hex: cfg.accent,
    sidebar_json: { grupos: [] }, // grupos serão preenchidos pela API quando disponível
  }));
}

/* ================================================================
   SIDEBAR_JSON LOCAL — usado quando API não tem grupos ainda
   Popula os subjects com os grupos/tópicos do EDU_SUBJECTS estático
   ================================================================ */
const EDU_SIDEBAR_GROUPS = {
  portugues:   [{nome:'Gramática',topicos:['Ortografia','Acentuação','Classes de Palavras','Sintaxe','Pontuação']},{nome:'Redação',topicos:['Dissertação','Argumentação','Coesão e Coerência','ENEM']},{nome:'Literatura',topicos:['Modernismo','Realismo','Romantismo','Barroco']}],
  ingles:      [{nome:'Gramática',topicos:['Verb Tenses','Modal Verbs','Conditionals','Passive Voice','Articles']},{nome:'Vocabulário',topicos:['Business English','Phrasal Verbs','Collocations','Idioms']},{nome:'Habilidades',topicos:['Speaking','Listening','Reading','Writing','Pronunciation']}],
  espanhol:    [{nome:'Gramática',topicos:['Verbos','Subjuntivo','Pronombres','Ser vs Estar','Género']},{nome:'Conversação',topicos:['Saludos','En el Restaurante','Viajes','Trabajo']},{nome:'Cultura',topicos:['Países hispanos','Música','Literatura']}],
  alemao:      [{nome:'Fundamentos',topicos:['Alphabet','Zahlen','Artikel','Kasus','Verben']},{nome:'Comunicação',topicos:['Begrüßung','Im Café','Reisen','Arbeit']},{nome:'Gramática',topicos:['Nominativ','Akkusativ','Dativ','Präpositionen']}],
  matematica:  [{nome:'Básico',topicos:['Operações','Frações','Porcentagem','Regra de Três','Geometria Plana']},{nome:'Intermediário',topicos:['Funções','Equações','Trigonometria','Geometria Espacial','Progressões']},{nome:'Avançado',topicos:['Cálculo','Álgebra Linear','Estatística','Probabilidade']}],
  fisica:      [{nome:'Mecânica',topicos:['Cinemática','Dinâmica','Trabalho e Energia','Gravitação','Oscilações']},{nome:'Eletromagnetismo',topicos:['Eletrostática','Eletrodinâmica','Magnetismo','Ondas EM']},{nome:'Moderna',topicos:['Relatividade','Física Quântica','Óptica','Termodinâmica']}],
  quimica:     [{nome:'Geral',topicos:['Tabela Periódica','Ligações Químicas','Soluções','Reações','Estequiometria']},{nome:'Orgânica',topicos:['Hidrocarbonetos','Funções Orgânicas','Isomeria','Polímeros']},{nome:'Físico-Química',topicos:['Termoquímica','Cinética','Equilíbrio','Eletroquímica']}],
  programacao: [{nome:'Fundamentos',topicos:['Lógica de Programação','Algoritmos','Estruturas de Dados','Git']},{nome:'Linguagens',topicos:['Python','JavaScript','Go','TypeScript','SQL']},{nome:'Avançado',topicos:['APIs REST','Banco de Dados','Docker','Cloud','IA com Python']}],
  eletronica:  [{nome:'Básico',topicos:['Componentes','Lei de Ohm','Resistores','Capacitores','Transistores']},{nome:'Prático',topicos:['Arduino','Raspberry Pi','Sensores','Motores','PWM']},{nome:'Robótica',topicos:['Servos','Controladores','Sensores IR','Bluetooth','Projetos']}],
  hobbies:     [{nome:'Estratégia',topicos:['Xadrez Básico','Aberturas','Táticas','Finais','Gambitos']},{nome:'Cubo Mágico',topicos:['Método Iniciante','CFOP','OLL','PLL','Speedcubing']},{nome:'Outros',topicos:['Origami','Fotografia','Música','Pintura Digital','3D Printing']}],
};

/* ================================================================
   INIT PRINCIPAL
   ================================================================ */
document.addEventListener('DOMContentLoaded', async () => {

  // 1. UI estática
  TickerModule.init();
  HeaderModule.init();
  EduSidebarModule.init();

  // 2. Busca os subjects (API ou fallback estático)
  let subjects = await fetchEduSubjects();

  // Popula sidebar_json se veio vazio da API
  subjects = subjects.map(s => ({
    ...s,
    sidebar_json: (s.sidebar_json?.grupos?.length)
      ? s.sidebar_json
      : { grupos: EDU_SIDEBAR_GROUPS[s.slug] || [] },
  }));

  // 3. Renderiza sidebar e quick grid
  EduSidebarModule.render(subjects);
  EduQuickGrid.render(subjects);

  // 4. Checa URL params para abrir direto num tópico
  const params  = new URLSearchParams(window.location.search);
  const subject = params.get('subject');
  const topic   = params.get('topic');

  if (subject && EDU_SUBJECTS[subject]) {
    EduState.activeSubject = subject;
    EduThemeEngine.set(subject);
    EduQuickGrid.hide();

    // Abre o accordion da disciplina
    const discHeader = qs(`.edu-discipline-item[data-subject="${subject}"] .edu-disc-header`);
    if (discHeader) {
      discHeader.setAttribute('aria-expanded', 'true');
      const bodyId = discHeader.getAttribute('aria-controls');
      qs('#' + bodyId)?.classList.add('open');
    }

    // Carrega tópico se especificado
    if (topic) {
      const btn = qs(`.edu-topic-btn[data-subject="${subject}"][data-topic="${topic}"]`);
      btn?.classList.add('active-topic');
      EduContentModule.load(subject, '', topic);
    }
  }

  // 5. Log debug
  console.log('%c📚 DRYFOUR BLOG — Aprender+', 'color:var(--accent,#00E5FF);font-weight:bold;font-size:14px');
  console.log('%c10 disciplinas | Sidebar multinível | Temas dinâmicos | API + Fallback', 'color:#475569;font-size:11px');
});
