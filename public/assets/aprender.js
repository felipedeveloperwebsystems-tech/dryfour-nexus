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
      summary: 'Domine as quatro operações com decimais. Modifique os valores e veja o resultado calculado em tempo real no SVG.',
      difficulty: 'iniciante', duration_min: 35,
      content: `
<style>
.op-bento-card{background:var(--bg-surface);border:1px solid var(--border2);border-radius:var(--r-lg);padding:28px 32px;box-shadow:var(--shadow-sm);margin-bottom:32px;transition:box-shadow var(--t)}
.op-bento-card:hover{box-shadow:var(--shadow-md)}
.op-card-title{font-family:var(--font-d);font-size:22px;margin-bottom:18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border2);padding-bottom:14px;color:var(--text)}
.op-method-box{background:var(--bg2);border-left:4px solid var(--accent);padding:14px 18px;border-radius:0 var(--r-sm) var(--r-sm) 0;margin-bottom:22px;transition:border-color var(--t-theme),background var(--t-theme)}
.op-method-box ol{padding-left:20px;color:var(--text-mid);margin-top:6px}
.op-method-box li{margin-bottom:5px;font-size:14px;line-height:1.6}
.op-engine{display:grid;grid-template-columns:320px 1fr;gap:24px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:20px;margin-top:18px}
.op-ipanel{display:flex;flex-direction:column;gap:16px}
.op-igroup{display:flex;flex-direction:column;gap:6px}
.op-igroup label{font-size:13px;font-weight:600;color:var(--text-mid)}
.op-igroup input,.op-igroup select{padding:10px 14px;border:1px solid var(--border2);border-radius:var(--r-sm);font-family:var(--font-m);font-size:15px;outline:none;background:var(--bg-surface);color:var(--text);transition:border-color .2s;width:100%}
.op-igroup input:focus,.op-igroup select:focus{border-color:var(--accent-mid)}
.op-cpanel{background:var(--bg-surface);border:1px solid var(--border2);border-radius:var(--r-sm);display:flex;justify-content:center;align-items:center;min-height:220px;padding:16px}
.op-cpanel.div-panel{flex-direction:column;align-items:flex-start;padding-left:40px}
.op-fbox{display:flex;align-items:center;gap:16px;font-size:18px;margin:16px 0;font-family:var(--font-m);flex-wrap:wrap}
.op-frac{display:inline-flex;flex-direction:column;align-items:center;text-align:center}
.op-frac .num{border-bottom:2px solid var(--text);padding:0 6px}
.op-frac .den{padding:0 6px}
@media(max-width:768px){.op-engine{grid-template-columns:1fr;gap:16px;padding:14px}.op-cpanel{min-height:180px}.op-cpanel.div-panel{padding-left:16px}.op-bento-card{padding:18px 14px}}
@media(max-width:480px){.op-card-title{font-size:17px}.op-igroup input,.op-igroup select{font-size:14px}}
</style>

<h2>O que são Números Decimais?</h2>
<p>Números decimais são racionais escritos com vírgula separando a <strong>parte inteira</strong> da <strong>parte fracionária</strong>. Todo decimal é uma fração com denominador potência de 10. Ex: 3,75 = 375/100. <strong>Casas decimais</strong>: quantidade de algarismos após a vírgula.</p>

<!-- ADIÇÃO / SUBTRAÇÃO ================================================ -->
<div class="op-bento-card" style="border-top:4px solid var(--accent)">
  <div class="op-card-title">
    <i class="fa-solid fa-calculator" style="color:var(--accent-text)" aria-hidden="true"></i>
    1. Adição e Subtração com Decimais
  </div>
  <div class="op-method-box">
    <strong>Método Prático Oblíquo:</strong>
    <ol>
      <li>Igualamos o número de casas decimais com o acréscimo de zeros à direita.</li>
      <li>Montamos a conta armando <strong>vírgula debaixo de vírgula</strong>.</li>
      <li>Executamos a operação normalmente, mantendo a vírgula do resultado perfeitamente alinhada.</li>
    </ol>
  </div>
  <div class="op-engine">
    <div class="op-ipanel">
      <div class="op-igroup">
        <label for="add1">Primeiro Número (Parcela):</label>
        <input type="number" id="add1" value="14.38" step="0.01">
      </div>
      <div class="op-igroup">
        <label for="add2">Segundo Número:</label>
        <input type="number" id="add2" value="5.6" step="0.1">
      </div>
      <div class="op-igroup">
        <label for="opSelect">Operação:</label>
        <select id="opSelect">
          <option value="+">Adição (+)</option>
          <option value="-">Subtração (-)</option>
        </select>
      </div>
    </div>
    <div class="op-cpanel">
      <svg id="svgAdd" width="200" height="180" style="font-family:var(--font-m);font-size:20px;fill:var(--text);overflow:visible"></svg>
    </div>
  </div>
</div>

<!-- MULTIPLICAÇÃO ===================================================== -->
<div class="op-bento-card" style="border-top:4px solid #7A00FF">
  <div class="op-card-title">
    <i class="fa-solid fa-square-sliders" style="color:#7A00FF" aria-hidden="true"></i>
    2. Multiplicação e Escalonamento
  </div>
  <div class="op-method-box" style="border-left-color:#7A00FF">
    <strong>Método Prático:</strong>
    <ol>
      <li>Multiplicamos os dois números como se fossem números inteiros naturais.</li>
      <li>Contamos o total de casas decimais dos dois fatores somados.</li>
      <li>Colocamos a vírgula no produto final contando as casas da direita para a esquerda.</li>
    </ol>
  </div>
  <div class="op-engine">
    <div class="op-ipanel">
      <div class="op-igroup">
        <label for="mul1">Fator A:</label>
        <input type="number" id="mul1" value="3.45" step="0.01">
      </div>
      <div class="op-igroup">
        <label for="mul2">Fator B (Multiplicador):</label>
        <input type="number" id="mul2" value="2.1" step="0.1">
      </div>
    </div>
    <div class="op-cpanel">
      <svg id="svgMul" width="220" height="180" style="font-family:var(--font-m);font-size:20px;fill:var(--text);overflow:visible"></svg>
    </div>
  </div>
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border2)">
    <h3 style="font-size:16px;margin-bottom:12px;color:var(--text)">Conversão Direta para Porcentagem (Gatilho Métrico)</h3>
    <p style="font-size:14px;color:var(--text-mid);margin-bottom:8px">Todo número decimal pode ser interpretado como uma fração centesimal. Veja a transformação real:</p>
    <div class="op-fbox">
      <span id="decValue">0.35</span> =
      <div class="op-frac"><span class="num" id="fracNum">35</span><span class="den">100</span></div>
      = <strong id="pctValue" style="color:#7A00FF">35%</strong>
    </div>
  </div>
</div>

<!-- DIVISÃO =========================================================== -->
<div class="op-bento-card" style="border-top:4px solid #FF0055">
  <div class="op-card-title">
    <i class="fa-solid fa-scissors" style="color:#FF0055" aria-hidden="true"></i>
    3. Divisão com Eliminação de Vírgula
  </div>
  <div class="op-method-box" style="border-left-color:#FF0055">
    <strong>Algoritmo de Eliminação de Casos:</strong>
    <ol>
      <li>Igualamos as casas decimais de dividendo e divisor adicionando zeros.</li>
      <li><strong>Cortamos a vírgula</strong> de ambos, transformando a conta em divisão de inteiros.</li>
      <li>Se a divisão não for exata, inserimos uma vírgula no quociente e acrescentamos zeros ao resto.</li>
    </ol>
  </div>
  <div class="op-engine">
    <div class="op-ipanel">
      <div class="op-igroup">
        <label for="div1">Dividendo:</label>
        <input type="number" id="div1" value="7.5" step="0.1">
      </div>
      <div class="op-igroup">
        <label for="div2">Divisor:</label>
        <input type="number" id="div2" value="0.25" step="0.01">
      </div>
    </div>
    <div class="op-cpanel div-panel">
      <div id="divMethodText" style="font-size:14px;color:var(--text-dim);margin-bottom:12px;font-family:var(--font-m)"></div>
      <svg id="svgDiv" width="250" height="140" style="font-family:var(--font-m);font-size:20px;fill:var(--text);overflow:visible"></svg>
    </div>
  </div>
</div>

<!-- FRAÇÕES =========================================================== -->
<div class="op-bento-card" style="border-top:4px solid #FF9F1C">
  <div class="op-card-title">
    <i class="fa-solid fa-infinity" style="color:#FF9F1C" aria-hidden="true"></i>
    4. Conversão Estrita de Frações para Decimais
  </div>
  <p style="color:var(--text-mid);margin-bottom:16px;font-size:14px">Toda fração ordinária pode gerar um decimal exato ou uma dízima periódica. <strong>Simples:</strong> período começa logo após a vírgula (ex: 1/3 = 0,333…). <strong>Composta:</strong> há algarismos antes do período (ex: 5/6 = 0,8333…).</p>
  <div class="op-engine" style="grid-template-columns:1fr">
    <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;justify-content:space-around">
      <div style="text-align:center">
        <span style="font-size:13px;font-weight:600;color:var(--text-dim)">Fração Ordinária</span>
        <div class="op-fbox" style="justify-content:center">
          <div class="op-frac">
            <input type="number" id="fNum" value="1" style="width:50px;text-align:center;padding:4px;border:1px solid var(--border2);border-radius:var(--r-sm);font-family:var(--font-m);font-size:18px;background:var(--bg-surface);color:var(--text);outline:none;border-bottom:2px solid var(--text)">
            <input type="number" id="fDen" value="3" style="width:50px;text-align:center;padding:4px;border:1px solid var(--border2);border-radius:var(--r-sm);font-family:var(--font-m);font-size:18px;background:var(--bg-surface);color:var(--text);outline:none;margin-top:4px">
          </div>
        </div>
      </div>
      <div style="font-size:24px;color:var(--text-dim)">=</div>
      <div style="text-align:center">
        <span style="font-size:13px;font-weight:600;color:var(--text-dim)">Resultado Decimal</span>
        <div id="fracResult" style="font-size:22px;font-family:var(--font-m);font-weight:700;margin-top:12px;color:var(--text)">0.333...</div>
        <div id="fracType" style="display:inline-block;padding:4px 12px;background:rgba(255,159,28,.15);color:#FF9F1C;border-radius:20px;font-size:12px;font-weight:700;margin-top:8px">Dízima Periódica Simples</div>
      </div>
    </div>
  </div>
</div>

<script>
/* Engines idênticas ao gemini-code — só cores dos resultados diferem por operação */
(function(){
  var Q = document.getElementById.bind(document);

  function updateAdditionEngine() {
    var v1 = parseFloat(Q('add1').value) || 0;
    var v2 = parseFloat(Q('add2').value) || 0;
    var op = Q('opSelect').value;
    var res = op === '+' ? v1 + v2 : v1 - v2;
    var s1 = v1.toString(), s2 = v2.toString();
    var c1 = s1.includes('.') ? s1.split('.')[1].length : 0;
    var c2 = s2.includes('.') ? s2.split('.')[1].length : 0;
    var maxCasas = Math.max(c1, c2);
    var str1 = v1.toFixed(maxCasas), str2 = v2.toFixed(maxCasas), strRes = res.toFixed(maxCasas);
    var svg = Q('svgAdd'); if(!svg) return;
    svg.innerHTML = '';
    var NS = 'http://www.w3.org/2000/svg', xEnd = 160;
    var t1 = document.createElementNS(NS,'text'); t1.setAttribute('x',xEnd); t1.setAttribute('y','40'); t1.setAttribute('text-anchor','end'); t1.textContent = str1; svg.appendChild(t1);
    var t2 = document.createElementNS(NS,'text'); t2.setAttribute('x',xEnd); t2.setAttribute('y','80'); t2.setAttribute('text-anchor','end'); t2.textContent = op+' '+str2; svg.appendChild(t2);
    var ln = document.createElementNS(NS,'line'); ln.setAttribute('x1','40'); ln.setAttribute('y1','100'); ln.setAttribute('x2',xEnd+10); ln.setAttribute('y2','100'); ln.setAttribute('stroke','currentColor'); ln.setAttribute('stroke-width','2'); svg.appendChild(ln);
    var tr = document.createElementNS(NS,'text'); tr.setAttribute('x',xEnd); tr.setAttribute('y','135'); tr.setAttribute('text-anchor','end'); tr.setAttribute('font-weight','bold'); tr.setAttribute('fill','var(--accent)'); tr.textContent = strRes; svg.appendChild(tr);
  }

  function updateMultiplicationEngine() {
    var f1 = parseFloat(Q('mul1').value) || 0, f2 = parseFloat(Q('mul2').value) || 0;
    var prod = f1 * f2;
    var s1 = f1.toString(), s2 = f2.toString();
    var c1 = s1.includes('.') ? s1.split('.')[1].length : 0;
    var c2 = s2.includes('.') ? s2.split('.')[1].length : 0;
    var totalCasas = c1 + c2;
    var svg = Q('svgMul'); if(!svg) return;
    svg.innerHTML = '';
    var NS = 'http://www.w3.org/2000/svg', xEnd = 160;
    var t1 = document.createElementNS(NS,'text'); t1.setAttribute('x',xEnd); t1.setAttribute('y','40'); t1.setAttribute('text-anchor','end'); t1.textContent = s1; svg.appendChild(t1);
    var t2 = document.createElementNS(NS,'text'); t2.setAttribute('x',xEnd); t2.setAttribute('y','80'); t2.setAttribute('text-anchor','end'); t2.textContent = '× '+s2; svg.appendChild(t2);
    var ln = document.createElementNS(NS,'line'); ln.setAttribute('x1','50'); ln.setAttribute('y1','100'); ln.setAttribute('x2',xEnd+10); ln.setAttribute('y2','100'); ln.setAttribute('stroke','currentColor'); ln.setAttribute('stroke-width','2'); svg.appendChild(ln);
    var tr = document.createElementNS(NS,'text'); tr.setAttribute('x',xEnd); tr.setAttribute('y','140'); tr.setAttribute('text-anchor','end'); tr.setAttribute('font-weight','bold'); tr.setAttribute('fill','#7A00FF'); tr.textContent = prod.toFixed(totalCasas); svg.appendChild(tr);
    Q('decValue').textContent = f1.toString();
    Q('fracNum').textContent = Math.round(f1 * 100);
    Q('pctValue').textContent = Math.round(f1 * 100) + '%';
  }

  function updateDivisionEngine() {
    var d1 = parseFloat(Q('div1').value) || 0, d2 = parseFloat(Q('div2').value) || 1;
    if(d2 === 0) d2 = 1;
    var s1 = d1.toString(), s2 = d2.toString();
    var c1 = s1.includes('.') ? s1.split('.')[1].length : 0;
    var c2 = s2.includes('.') ? s2.split('.')[1].length : 0;
    var maxCasas = Math.max(c1, c2);
    var fatorConversao = Math.pow(10, maxCasas);
    var intDividendo = Math.round(d1 * fatorConversao), intDivisor = Math.round(d2 * fatorConversao);
    var quociente = d1 / d2;
    var dm = Q('divMethodText'); if(dm) dm.innerHTML = 'Ajuste pr\xe1tico (\xd7'+fatorConversao+'): <strong>'+intDividendo+' : '+intDivisor+'</strong>';
    var svg = Q('svgDiv'); if(!svg) return;
    svg.innerHTML = '';
    var NS = 'http://www.w3.org/2000/svg';
    var tD = document.createElementNS(NS,'text'); tD.setAttribute('x','30'); tD.setAttribute('y','40'); tD.textContent = intDividendo; svg.appendChild(tD);
    var tDi = document.createElementNS(NS,'text'); tDi.setAttribute('x','140'); tDi.setAttribute('y','40'); tDi.textContent = intDivisor; svg.appendChild(tDi);
    var vl = document.createElementNS(NS,'line'); vl.setAttribute('x1','125'); vl.setAttribute('y1','15'); vl.setAttribute('x2','125'); vl.setAttribute('y2','90'); vl.setAttribute('stroke','currentColor'); vl.setAttribute('stroke-width','2'); svg.appendChild(vl);
    var hl = document.createElementNS(NS,'line'); hl.setAttribute('x1','125'); hl.setAttribute('y1','50'); hl.setAttribute('x2','220'); hl.setAttribute('y2','50'); hl.setAttribute('stroke','currentColor'); hl.setAttribute('stroke-width','2'); svg.appendChild(hl);
    var tQ = document.createElementNS(NS,'text'); tQ.setAttribute('x','140'); tQ.setAttribute('y','80'); tQ.setAttribute('font-weight','bold'); tQ.setAttribute('fill','#FF0055'); tQ.textContent = Number(quociente.toFixed(3)); svg.appendChild(tQ);
  }

  function updateFractionEngine() {
    var num = parseInt(Q('fNum').value) || 0, den = parseInt(Q('fDen').value) || 1;
    if(den === 0) { Q('fracResult').textContent = 'Erro (Denom=0)'; Q('fracType').textContent = '-'; return; }
    var res = num / den, resStr = res.toString();
    Q('fracResult').textContent = resStr.length > 8 ? res.toFixed(5) + '...' : resStr;
    var ft = Q('fracType'); if(!ft) return;
    if(!resStr.includes('.')) { ft.textContent = 'Inteiro Exato'; ft.style.background='rgba(0,201,173,.15)'; ft.style.color='#00c9ad'; }
    else { var dp = resStr.split('.')[1];
      if(dp.length < 6) { ft.textContent='Decimal Exato'; ft.style.background='rgba(0,201,173,.15)'; ft.style.color='#00c9ad'; }
      else { ft.textContent = num%2===0?'D\xedzima Peri\xf3dica Composta':'D\xedzima Peri\xf3dica Simples'; ft.style.background='rgba(255,159,28,.15)'; ft.style.color='#FF9F1C'; }
    }
  }

  /* Orquestração idêntica ao gemini-code */
  function ev(id, evt, fn){ var el=Q(id); if(el) el.addEventListener(evt, fn); }
  ev('add1','input',updateAdditionEngine);
  ev('add2','input',updateAdditionEngine);
  ev('opSelect','change',updateAdditionEngine);
  ev('mul1','input',updateMultiplicationEngine);
  ev('mul2','input',updateMultiplicationEngine);
  ev('div1','input',updateDivisionEngine);
  ev('div2','input',updateDivisionEngine);
  ev('fNum','input',updateFractionEngine);
  ev('fDen','input',updateFractionEngine);
  updateAdditionEngine();
  updateMultiplicationEngine();
  updateDivisionEngine();
  updateFractionEngine();
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
    this.overlay?.addEventListener('click',  () => this.close());
    this.overlay?.addEventListener('touchstart', () => this.close(), { passive: true });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && EduState.sidebarOpen) this.close();
    });
    // Se redimensionar para desktop e drawer estiver aberto, fecha e limpa
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
    // No desktop o sidebar é sempre visível — não usa drawer
    if (window.innerWidth > 1024) return;
    if (EduState.sidebarOpen) return;
    EduState.sidebarOpen = true;
    this.sidebar?.classList.add('open');
    this.overlay?.classList.add('active');
    this.hamBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.closeBtn?.focus(), 60);
  },

  close() {
    // No desktop o sidebar é sempre visível — close não faz nada
    if (window.innerWidth > 1024) return;
    if (!EduState.sidebarOpen) return;
    EduState.sidebarOpen = false;
    this.sidebar?.classList.remove('open');
    this.overlay?.classList.remove('active');
    this.hamBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
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

        // Abre o accordion da disciplina no sidebar
        const discHeader = qs(`.edu-discipline-item[data-subject="${slug}"] .edu-disc-header`);
        if (discHeader && discHeader.getAttribute('aria-expanded') !== 'true') {
          discHeader.click();
        }

        // No mobile: abre o sidebar drawer para o usuário ver a disciplina
        if (window.innerWidth <= 1024) {
          EduSidebarModule.open();
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

      // CRÍTICO: <script> dentro de innerHTML NÃO executa automaticamente no browser.
      // Precisa extrair e re-executar cada script manualmente.
      bodyEl.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        // Copia atributos (type, src…)
        Array.from(oldScript.attributes).forEach(attr =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
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
