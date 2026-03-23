(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const c of r)if(c.type==="childList")for(const u of c.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&n(u)}).observe(document,{childList:!0,subtree:!0});function a(r){const c={};return r.integrity&&(c.integrity=r.integrity),r.referrerPolicy&&(c.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?c.credentials="include":r.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function n(r){if(r.ep)return;r.ep=!0;const c=a(r);fetch(r.href,c)}})();function T(){return crypto.randomUUID()}const U=()=>({version:1,theme:{density:"comfortable",accent:"#03a9f4"},header:{enabled:!0,heightPx:56,blocks:[]},body:{columns:12,rowHeightPx:72,gapPx:8,blocks:[]},footer:{enabled:!1,heightPx:48,blocks:[]}}),R="db_ha_base_url",q="db_ha_token";function L(){var t;const e=(t=localStorage.getItem(R))==null?void 0:t.trim();return e?e.replace(/\/$/,""):""}function w(){var e;return((e=localStorage.getItem(q))==null?void 0:e.trim())??""}function D(e,t){localStorage.setItem(R,e.trim().replace(/\/$/,"")),localStorage.setItem(q,t.trim())}function F(e){return`${e||""}/api/dashboard_builder/layout`}async function K(){const e=L(),t=w(),a={Accept:"application/json"};t&&(a.Authorization=`Bearer ${t}`);const n=await fetch(F(e),{credentials:t?"omit":"include",headers:a});if(!n.ok)throw new Error(`GET layout: ${n.status}`);return await n.json()}async function G(e){const t=L(),a=w(),n={"Content-Type":"application/json",Accept:"application/json"};a&&(n.Authorization=`Bearer ${a}`);const r=await fetch(F(t),{method:"POST",credentials:a?"omit":"include",headers:n,body:JSON.stringify(e)});if(!r.ok)throw new Error(`POST layout: ${r.status}`)}let o=U(),s=null,b=!0,h=null,E=!1;const Z=document.querySelector("#app");function _(e,t){return(t==="header"?e.header.blocks:e.footer.blocks).map((n,r)=>({...n,order:typeof n.order=="number"?n.order:r}))}function $(e){const t=_(e,"header").sort((n,r)=>n.order-r.order),a=_(e,"footer").sort((n,r)=>n.order-r.order);return{...e,header:{...e.header,blocks:t},footer:{...e.footer,blocks:a}}}function Q(e){let t=4;for(const a of e.body.blocks)t=Math.max(t,a.row+a.rowSpan-1);return t}function i(){const e=(s==null?void 0:s.id)??null,t=(s==null?void 0:s.zone)??null;Z.innerHTML=`
    <header class="toolbar">
      <button type="button" class="primary" id="btn-save">Сохранить в HA</button>
      <button type="button" id="btn-load">Загрузить</button>
      <button type="button" id="btn-toggle">${b?"Просмотр":"Правка"}</button>
      <button type="button" id="btn-export">Экспорт JSON</button>
      <label class="file-btn">Импорт JSON<input type="file" id="inp-import" accept="application/json" /></label>
      <button type="button" id="btn-settings">Подключение…</button>
      <span class="status" id="status"></span>
    </header>
    <div class="layout-main">
      <aside class="palette ${b?"":"hidden"}">
        <h3>Блоки</h3>
        <button type="button" class="palette-item" draggable="true" data-type="text">Текст</button>
        <button type="button" class="palette-item" draggable="true" data-type="markdown">Markdown</button>
        <button type="button" class="palette-item" draggable="true" data-type="entity">Сущность HA</button>
        <button type="button" class="palette-item" draggable="true" data-type="spacer">Отступ</button>
        <p style="font-size:0.75rem;color:var(--muted);margin:1rem 0 0">
          Перетащите блок в шапку, сетку или подвал.
        </p>
      </aside>
      <main class="canvas-wrap">
        <div class="canvas" id="canvas" style="--accent:${o.theme.accent}">
          ${j("header",o.header.enabled,o.header.heightPx,o.header.blocks,t==="header",e)}
          ${V(o,t==="body",e)}
          ${j("footer",o.footer.enabled,o.footer.heightPx,o.footer.blocks,t==="footer",e)}
        </div>
      </main>
      <aside class="inspector ${b?"":"hidden"}">
        <h3>Свойства</h3>
        <div id="inspector-body">${W()}</div>
      </aside>
    </div>
    ${E?ie():""}
  `,ne(),ae(),oe(),de(),le()}function j(e,t,a,n,r,c){return t?`<section class="zone" data-zone="${e}" style="min-height:${a}px">
    <span class="zone-label">${e==="header"?"Шапка":"Подвал"}</span>
    <div class="zone-strip ${b?"drop-target":""}" data-drop="${e}" style="min-height:${Math.max(a-8,40)}px">
      ${n.slice().sort((l,y)=>l.order-y.order).map(l=>`<div class="strip-block ${c===l.id&&r?"selected":""}" data-zone="${e}" data-id="${l.id}" title="${g(l.title??l.type)}">${k(J(l))}</div>`).join("")}
    </div>
  </section>`:`<section class="zone" data-zone="${e}" style="min-height:32px;background:#0c0e12">
      <span class="zone-label">${e==="header"?"Шапка (выкл.)":"Подвал (выкл.)"}</span>
    </section>`}function V(e,t,a){const n=Q(e),r=e.body.rowHeightPx,c=e.body.columns,u=e.body.gapPx;return`<section class="zone" data-zone="body">
    <span class="zone-label">Тело (сетка ${c}×${n})</span>
    <div
      class="body-grid ${b?"drop-target":""}"
      data-drop="body"
      style="--cols:${c};--rh:${r}px;gap:${u}px;grid-template-columns:repeat(${c},1fr);grid-template-rows:repeat(${n},${r}px);"
    >
      ${e.body.blocks.map(l=>`<div class="grid-block ${a===l.id&&t?"selected":""}"
              data-zone="body" data-id="${l.id}"
              style="grid-column:${l.col} / span ${l.colSpan};grid-row:${l.row} / span ${l.rowSpan}"
            >${k(J(l))}</div>`).join("")}
    </div>
  </section>`}function J(e){var t;return(t=e.title)!=null&&t.trim()?e.title.trim():e.type==="entity"&&"entityId"in e&&e.entityId?e.entityId:(e.type==="text"||e.type==="markdown")&&"content"in e&&e.content?e.content.slice(0,48)+(e.content.length>48?"…":""):e.type==="spacer"?"Отступ":e.type}function W(){if(!s)return`<p style="color:var(--muted);font-size:0.85rem">Выберите блок на макете.</p>
      <div class="field"><label>Акцент темы</label>
        <input type="text" id="th-accent" value="${g(o.theme.accent)}" />
      </div>
      <div class="field"><label>Колонки сетки</label>
        <input type="number" id="th-cols" min="4" max="24" value="${o.body.columns}" />
      </div>
      <div class="field"><label>Высота строки (px)</label>
        <input type="number" id="th-rh" min="32" max="200" value="${o.body.rowHeightPx}" />
      </div>
      <div class="field"><label>Отступ сетки (px)</label>
        <input type="number" id="th-gap" min="0" max="48" value="${o.body.gapPx}" />
      </div>
      <div class="field"><label><input type="checkbox" id="th-head" ${o.header.enabled?"checked":""} /> Шапка</label></div>
      <div class="field"><label>Высота шапки (px)</label>
        <input type="number" id="th-hh" min="32" max="200" value="${o.header.heightPx}" />
      </div>
      <div class="field"><label><input type="checkbox" id="th-foot" ${o.footer.enabled?"checked":""} /> Подвал</label></div>
      <div class="field"><label>Высота подвала (px)</label>
        <input type="number" id="th-fh" min="32" max="200" value="${o.footer.heightPx}" />
      </div>`;const e=C(s.zone,s.id);if(!e)return"<p>Блок не найден</p>";const t=`
    <div class="field"><label>Заголовок</label>
      <input type="text" id="in-title" value="${g(e.title??"")}" />
    </div>
    <p style="font-size:0.75rem;color:var(--muted)">Тип: ${e.type}</p>
  `;if(s.zone==="body"&&"col"in e){const n=e;return t+`
      <div class="field"><label>Колонка (1–${o.body.columns})</label>
        <input type="number" id="in-col" min="1" max="${o.body.columns}" value="${n.col}" />
      </div>
      <div class="field"><label>Строка</label>
        <input type="number" id="in-row" min="1" max="99" value="${n.row}" />
      </div>
      <div class="field"><label>Ширина (span)</label>
        <input type="number" id="in-cs" min="1" max="${o.body.columns}" value="${n.colSpan}" />
      </div>
      <div class="field"><label>Высота (span)</label>
        <input type="number" id="in-rs" min="1" max="50" value="${n.rowSpan}" />
      </div>
      ${n.type==="entity"?X(n):""}
      ${n.type==="text"||n.type==="markdown"?ee(n):""}
      <button type="button" id="btn-del" style="margin-top:0.5rem;width:100%;border-color:var(--danger)">Удалить блок</button>
    `}const a=e;return t+`
    <div class="field"><label>Порядок</label>
      <input type="number" id="in-order" min="0" max="999" value="${a.order}" />
    </div>
    ${a.type==="entity"?Y(a):""}
    ${a.type==="text"||a.type==="markdown"?te(a):""}
    <button type="button" id="btn-del" style="margin-top:0.5rem;width:100%;border-color:var(--danger)">Удалить блок</button>
  `}function X(e){return`<div class="field"><label>entity_id</label>
    <input type="text" id="in-entity" placeholder="sensor.temperature" value="${g(e.entityId??"")}" />
  </div>`}function Y(e){return`<div class="field"><label>entity_id</label>
    <input type="text" id="in-entity" placeholder="sensor.temperature" value="${g(e.entityId??"")}" />
  </div>`}function ee(e){return`<div class="field"><label>Текст</label>
    <textarea id="in-content">${k(e.content??"")}</textarea>
  </div>`}function te(e){return`<div class="field"><label>Текст</label>
    <textarea id="in-content">${k(e.content??"")}</textarea>
  </div>`}function C(e,t){return e==="body"?o.body.blocks.find(n=>n.id===t):(e==="header"?o.header.blocks:o.footer.blocks).find(n=>n.id===t)}function ne(){var e,t,a,n,r,c;(e=document.getElementById("btn-save"))==null||e.addEventListener("click",async()=>{f("Сохранение…");try{await G($(o)),f("Сохранено")}catch(u){f(`Ошибка: ${u instanceof Error?u.message:String(u)}`,!0)}}),(t=document.getElementById("btn-load"))==null||t.addEventListener("click",async()=>{f("Загрузка…");try{o=$(await K()),s=null,f("Загружено"),i()}catch(u){f(`Ошибка: ${u instanceof Error?u.message:String(u)}`,!0)}}),(a=document.getElementById("btn-toggle"))==null||a.addEventListener("click",()=>{b=!b,i()}),(n=document.getElementById("btn-export"))==null||n.addEventListener("click",()=>{const u=new Blob([JSON.stringify($(o),null,2)],{type:"application/json"}),l=document.createElement("a");l.href=URL.createObjectURL(u),l.download="dashboard-layout.json",l.click(),URL.revokeObjectURL(l.href)}),(r=document.getElementById("inp-import"))==null||r.addEventListener("change",u=>{var v;const l=(v=u.target.files)==null?void 0:v[0];if(!l)return;const y=new FileReader;y.onload=()=>{try{const x=JSON.parse(String(y.result));o=$(x),s=null,f("Импорт OK"),i()}catch{f("Неверный JSON",!0)}},y.readAsText(l),u.target.value=""}),(c=document.getElementById("btn-settings"))==null||c.addEventListener("click",()=>{E=!0,i()})}function ae(){document.querySelectorAll(".palette-item").forEach(e=>{e.addEventListener("dragstart",()=>{h=e.dataset.type??null}),e.addEventListener("dragend",()=>{h=null})})}function oe(){var e;document.querySelectorAll(".strip-block, .grid-block").forEach(t=>{t.addEventListener("click",a=>{a.stopPropagation();const n=t.dataset.zone,r=t.dataset.id;!r||!n||(s={zone:n,id:r},i())})}),document.querySelectorAll("[data-drop]").forEach(t=>{t.addEventListener("dragover",a=>{!b||!h||a.preventDefault()}),t.addEventListener("drop",a=>{if(a.preventDefault(),!b||!h)return;const n=t.dataset.drop;re(n,h),h=null,i()})}),(e=document.querySelector(".canvas-wrap"))==null||e.addEventListener("click",t=>{t.target===t.currentTarget&&(s=null,i())})}function re(e,t){if(e==="body"){const l={id:T(),type:t,col:1,row:1,colSpan:Math.min(4,o.body.columns),rowSpan:1,title:H(t),content:t==="text"||t==="markdown"?"Текст":void 0,entityId:t==="entity"?"sun.sun":void 0};o.body.blocks.push(l),s={zone:"body",id:l.id};return}const a=e==="header"?o.header.blocks:o.footer.blocks,n=a.reduce((c,u)=>Math.max(c,u.order??0),-1),r={id:T(),type:t,order:n+1,title:H(t),content:t==="text"||t==="markdown"?"Текст":void 0,entityId:t==="entity"?"sun.sun":void 0};a.push(r),s={zone:e,id:r.id}}function H(e){switch(e){case"text":return"Текст";case"markdown":return"Markdown";case"entity":return"Сущность";default:return"Отступ"}}function de(){var t,a,n,r,c,u,l,y,v,x,I,B,S,A,N,P,z,O,M;if(!s){(t=document.getElementById("th-accent"))==null||t.addEventListener("change",d=>{o.theme.accent=d.target.value,i()}),(a=document.getElementById("th-cols"))==null||a.addEventListener("change",d=>{o.body.columns=p(d.target.valueAsNumber,4,24),i()}),(n=document.getElementById("th-rh"))==null||n.addEventListener("change",d=>{o.body.rowHeightPx=p(d.target.valueAsNumber,32,200),i()}),(r=document.getElementById("th-gap"))==null||r.addEventListener("change",d=>{o.body.gapPx=p(d.target.valueAsNumber,0,48),i()}),(c=document.getElementById("th-head"))==null||c.addEventListener("change",d=>{o.header.enabled=d.target.checked,i()}),(u=document.getElementById("th-hh"))==null||u.addEventListener("change",d=>{o.header.heightPx=p(d.target.valueAsNumber,32,200),i()}),(l=document.getElementById("th-foot"))==null||l.addEventListener("change",d=>{o.footer.enabled=d.target.checked,i()}),(y=document.getElementById("th-fh"))==null||y.addEventListener("change",d=>{o.footer.heightPx=p(d.target.valueAsNumber,32,200),i()});return}const e=C(s.zone,s.id);if(e){if((v=document.getElementById("in-title"))==null||v.addEventListener("change",d=>{e.title=d.target.value||void 0,i()}),s.zone==="body"&&"col"in e){const d=e;(x=document.getElementById("in-col"))==null||x.addEventListener("change",m=>{d.col=p(m.target.valueAsNumber,1,o.body.columns),i()}),(I=document.getElementById("in-row"))==null||I.addEventListener("change",m=>{d.row=p(m.target.valueAsNumber,1,99),i()}),(B=document.getElementById("in-cs"))==null||B.addEventListener("change",m=>{d.colSpan=p(m.target.valueAsNumber,1,o.body.columns),i()}),(S=document.getElementById("in-rs"))==null||S.addEventListener("change",m=>{d.rowSpan=p(m.target.valueAsNumber,1,50),i()}),(A=document.getElementById("in-entity"))==null||A.addEventListener("change",m=>{d.entityId=m.target.value||void 0,i()}),(N=document.getElementById("in-content"))==null||N.addEventListener("change",m=>{d.content=m.target.value||void 0,i()})}else{const d=e;(P=document.getElementById("in-order"))==null||P.addEventListener("change",m=>{d.order=p(m.target.valueAsNumber,0,999),i()}),(z=document.getElementById("in-entity"))==null||z.addEventListener("change",m=>{d.entityId=m.target.value||void 0,i()}),(O=document.getElementById("in-content"))==null||O.addEventListener("change",m=>{d.content=m.target.value||void 0,i()})}(M=document.getElementById("btn-del"))==null||M.addEventListener("click",()=>{s&&(s.zone==="body"?o.body.blocks=o.body.blocks.filter(d=>d.id!==s.id):s.zone==="header"?o.header.blocks=o.header.blocks.filter(d=>d.id!==s.id):o.footer.blocks=o.footer.blocks.filter(d=>d.id!==s.id),s=null,i())})}}function p(e,t,a){return Number.isNaN(e)?t:Math.min(a,Math.max(t,e))}function f(e,t=!1){const a=document.getElementById("status");a&&(a.textContent=e,a.style.color=t?"var(--danger)":"var(--muted)")}function k(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function g(e){return k(e).replaceAll(`
`," ")}function ie(){return`<div class="modal-backdrop" id="modal-bg">
    <div class="modal" id="modal">
      <h2>Подключение к Home Assistant</h2>
      <p style="font-size:0.8rem;color:var(--muted);margin:0 0 0.75rem">
        Если открываете с того же адреса, что и HA (например <code>/dashboard_builder_web/</code>),
        оставьте базовый URL пустым — запросы пойдут с cookie сессии.
        Для отдельного хоста укажите URL (без слэша в конце) и долгоживущий токен.
      </p>
      <div class="field"><label>Базовый URL (опционально)</label>
        <input type="url" id="set-base" placeholder="https://homeassistant.local:8123" value="${g(L())}" />
      </div>
      <div class="field"><label>Токен (опционально)</label>
        <input type="password" id="set-token" autocomplete="off" value="${g(w())}" />
      </div>
      <div class="modal-actions">
        <button type="button" id="set-cancel">Отмена</button>
        <button type="button" class="primary" id="set-save">Сохранить</button>
      </div>
    </div>
  </div>`}function le(){var e,t,a;(e=document.getElementById("modal-bg"))==null||e.addEventListener("click",n=>{n.target===document.getElementById("modal-bg")&&(E=!1,i())}),(t=document.getElementById("set-cancel"))==null||t.addEventListener("click",()=>{E=!1,i()}),(a=document.getElementById("set-save"))==null||a.addEventListener("click",()=>{const n=document.getElementById("set-base").value,r=document.getElementById("set-token").value;D(n,r),E=!1,i()})}o=$(U());i();
