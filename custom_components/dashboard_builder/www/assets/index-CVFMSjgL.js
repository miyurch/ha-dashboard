var V=Object.defineProperty;var X=(e,t,n)=>t in e?V(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var I=(e,t,n)=>X(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function n(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(i){if(i.ep)return;i.ep=!0;const a=n(i);fetch(i.href,a)}})();function R(){return crypto.randomUUID()}const K=()=>({version:1,theme:{density:"comfortable",accent:"#03a9f4"},header:{enabled:!0,heightPx:56,blocks:[]},body:{columns:12,rowHeightPx:72,gapPx:8,blocks:[]},footer:{enabled:!1,heightPx:48,blocks:[]}}),C="db_ha_base_url",D="db_ha_token";function P(){var t;const e=(t=localStorage.getItem(C))==null?void 0:t.trim();return e?e.replace(/\/$/,""):""}function O(){var e;return((e=localStorage.getItem(D))==null?void 0:e.trim())??""}function Y(e,t){localStorage.setItem(C,e.trim().replace(/\/$/,"")),localStorage.setItem(D,t.trim())}function G(e){return`${e||""}/api/dashboard_builder/layout`}async function ee(){const e=P(),t=O(),n={Accept:"application/json"};t&&(n.Authorization=`Bearer ${t}`);const o=await fetch(G(e),{credentials:t?"omit":"include",headers:n});if(!o.ok)throw new Error(`GET layout: ${o.status}`);return await o.json()}async function te(e){const t=P(),n=O(),o={"Content-Type":"application/json",Accept:"application/json"};n&&(o.Authorization=`Bearer ${n}`);const i=await fetch(G(t),{method:"POST",credentials:n?"omit":"include",headers:o,body:JSON.stringify(e)});if(!i.ok)throw new Error(`POST layout: ${i.status}`)}function ne(e){var n,o,i;const t=new Set;for(const a of e.header.blocks)a.type==="entity"&&((n=a.entityId)!=null&&n.trim())&&t.add(a.entityId.trim());for(const a of e.footer.blocks)a.type==="entity"&&((o=a.entityId)!=null&&o.trim())&&t.add(a.entityId.trim());for(const a of e.body.blocks)a.type==="entity"&&((i=a.entityId)!=null&&i.trim())&&t.add(a.entityId.trim());return[...t].sort()}async function q(e){const t=new Map;if(e.length===0)return t;const n=P(),o=O(),i=`${n||""}/api/states`,a={Accept:"application/json"};o&&(a.Authorization=`Bearer ${o}`);const c=await fetch(i,{credentials:o?"omit":"include",headers:a});if(!c.ok)throw new Error(`GET /api/states: ${c.status}`);const l=await c.json(),b=new Set(e);for(const p of l)b.has(p.entity_id)&&t.set(p.entity_id,p);return t}function oe(){const e=P();if(e){const n=new URL(e);return`${n.protocol==="https:"?"wss:":"ws:"}//${n.host}/api/websocket`}return`${window.location.protocol==="https:"?"wss":"ws"}://${window.location.host}/api/websocket`}class ie{constructor(){I(this,"states",new Map);I(this,"ws",null);I(this,"pollTimer",null);I(this,"entityFilter",new Set);I(this,"nextId",1)}getState(t){return this.states.get(t)}async start(t,n){this.stop(),this.entityFilter=new Set(t);const o=await q(t);for(const[a,c]of o)this.states.set(a,c);n();const i=O();if(t.length!==0){if(i)try{await this.runWebSocket(i,n);return}catch(a){console.warn("WebSocket:",a)}this.startPolling(t,n)}}stop(){if(this.ws){try{this.ws.close()}catch{}this.ws=null}this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null),this.states.clear(),this.entityFilter.clear()}startPolling(t,n){this.pollTimer=setInterval(()=>{q(t).then(o=>{for(const[i,a]of o)this.states.set(i,a);n()}).catch(o=>console.warn("poll states",o))},15e3)}runWebSocket(t,n){const o=oe(),i=new WebSocket(o);return this.ws=i,new Promise((a,c)=>{const l=window.setTimeout(()=>{c(new Error("Таймаут WebSocket"))},2e4);i.onerror=()=>{window.clearTimeout(l),c(new Error("Ошибка WebSocket"))},i.onmessage=b=>{var w,$,L;let p;try{p=JSON.parse(b.data)}catch{return}if(p.type==="ping"){i.send(JSON.stringify({type:"pong"}));return}if(p.type==="auth_required"){i.send(JSON.stringify({type:"auth",access_token:t}));return}if(p.type==="auth_invalid"){window.clearTimeout(l),c(new Error("Неверный токен"));return}if(p.type==="auth_ok"){window.clearTimeout(l);const v=this.nextId++;i.send(JSON.stringify({id:v,type:"subscribe_events",event_type:"state_changed"})),a();return}if(p.type==="event"&&((w=p.event)==null?void 0:w.event_type)==="state_changed"){const v=($=p.event.data)==null?void 0:$.entity_id,k=(L=p.event.data)==null?void 0:L.new_state;if(!v||!this.entityFilter.has(v))return;k&&typeof k=="object"&&"entity_id"in k?this.states.set(v,k):k===null&&this.states.delete(v),n()}}})}}let r=K(),u=null,f=!0,S=null,_=!1,N=!1,y=null,B="",T=0;const ae=document.querySelector("#app");function re(){T&&cancelAnimationFrame(T),T=requestAnimationFrame(()=>{T=0,d()})}function le(){if(f||!N){y==null||y.stop(),y=null,B="";return}const e=ne(r),t=e.join(`
`);if(e.length===0){y==null||y.stop(),y=null,B="";return}y&&t===B||(y==null||y.stop(),y=new ie,B=t,y.start(e,()=>re()).catch(n=>{console.warn(n),g(`Живой: ${n instanceof Error?n.message:String(n)}`,!0)}))}function se(e,t){var c,l;const n=e.entityId.trim(),o=((c=e.title)==null?void 0:c.trim())||(((l=t==null?void 0:t.attributes)==null?void 0:l.friendly_name)!=null?String(t.attributes.friendly_name):n);if(!t)return`<div class="entity-live"><div class="entity-live-title">${E(o)}</div><div class="entity-live-val entity-live-missing">нет данных</div></div>`;const i=t.attributes.unit_of_measurement,a=`${t.state}`+(i!=null&&String(i)!==""?` ${String(i)}`:"");return`<div class="entity-live"><div class="entity-live-title">${E(String(o))}</div><div class="entity-live-val">${E(a)}</div></div>`}function Z(e){var n;if(!N||f||e.type!=="entity"||!((n=e.entityId)!=null&&n.trim()))return E(ue(e));const t=y==null?void 0:y.getState(e.entityId.trim());return se(e,t)}function J(e,t){return(t==="header"?e.header.blocks:e.footer.blocks).map((o,i)=>({...o,order:typeof o.order=="number"?o.order:i}))}function A(e){const t=J(e,"header").sort((o,i)=>o.order-i.order),n=J(e,"footer").sort((o,i)=>o.order-i.order);return{...e,header:{...e.header,blocks:t},footer:{...e.footer,blocks:n}}}function de(e){let t=4;for(const n of e.body.blocks)t=Math.max(t,n.row+n.rowSpan-1);return t}function d(){const e=(u==null?void 0:u.id)??null,t=(u==null?void 0:u.zone)??null;ae.innerHTML=`
    <header class="toolbar">
      <button type="button" class="primary" id="btn-save">Сохранить в HA</button>
      <button type="button" id="btn-load">Загрузить</button>
      <button type="button" id="btn-toggle">${f?"Просмотр":"Правка"}</button>
      <label class="toolbar-live ${f?"hidden":""}">
        <input type="checkbox" id="chk-live" ${N?"checked":""} />
        Живой
      </label>
      <button type="button" id="btn-export">Экспорт JSON</button>
      <label class="file-btn">Импорт JSON<input type="file" id="inp-import" accept="application/json" /></label>
      <button type="button" id="btn-settings">Подключение…</button>
      <span class="status" id="status"></span>
    </header>
    <div class="layout-main">
      <aside class="palette ${f?"":"hidden"}">
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
        <div class="canvas" id="canvas" style="--accent:${r.theme.accent}">
          ${M("header",r.header.enabled,r.header.heightPx,r.header.blocks,t==="header",e)}
          ${ce(r,t==="body",e)}
          ${M("footer",r.footer.enabled,r.footer.heightPx,r.footer.blocks,t==="footer",e)}
        </div>
      </main>
      <aside class="inspector ${f?"":"hidden"}">
        <h3>Свойства</h3>
        <div id="inspector-body">${pe()}</div>
      </aside>
    </div>
    ${_?$e():""}
  `,he(),ve(),ge(),ke(),Ee(),queueMicrotask(()=>le())}function M(e,t,n,o,i,a){return t?`<section class="zone" data-zone="${e}" style="min-height:${n}px">
    <span class="zone-label">${e==="header"?"Шапка":"Подвал"}</span>
    <div class="zone-strip ${f?"drop-target":""}" data-drop="${e}" style="min-height:${Math.max(n-8,40)}px">
      ${o.slice().sort((l,b)=>l.order-b.order).map(l=>`<div class="strip-block ${a===l.id&&i?"selected":""}" data-zone="${e}" data-id="${l.id}" title="${x(l.title??l.type)}">${Z(l)}</div>`).join("")}
    </div>
  </section>`:`<section class="zone" data-zone="${e}" style="min-height:32px;background:#0c0e12">
      <span class="zone-label">${e==="header"?"Шапка (выкл.)":"Подвал (выкл.)"}</span>
    </section>`}function ce(e,t,n){const o=de(e),i=e.body.rowHeightPx,a=e.body.columns,c=e.body.gapPx;return`<section class="zone" data-zone="body">
    <span class="zone-label">Тело (сетка ${a}×${o})</span>
    <div
      class="body-grid ${f?"drop-target":""}"
      data-drop="body"
      style="--cols:${a};--rh:${i}px;gap:${c}px;grid-template-columns:repeat(${a},1fr);grid-template-rows:repeat(${o},${i}px);"
    >
      ${e.body.blocks.map(l=>`<div class="grid-block ${n===l.id&&t?"selected":""}"
              data-zone="body" data-id="${l.id}"
              style="grid-column:${l.col} / span ${l.colSpan};grid-row:${l.row} / span ${l.rowSpan}"
            >${Z(l)}</div>`).join("")}
    </div>
  </section>`}function ue(e){var t;return(t=e.title)!=null&&t.trim()?e.title.trim():e.type==="entity"&&"entityId"in e&&e.entityId?e.entityId:(e.type==="text"||e.type==="markdown")&&"content"in e&&e.content?e.content.slice(0,48)+(e.content.length>48?"…":""):e.type==="spacer"?"Отступ":e.type}function pe(){if(!u)return`<p style="color:var(--muted);font-size:0.85rem">Выберите блок на макете.</p>
      <div class="field"><label>Акцент темы</label>
        <input type="text" id="th-accent" value="${x(r.theme.accent)}" />
      </div>
      <div class="field"><label>Колонки сетки</label>
        <input type="number" id="th-cols" min="4" max="24" value="${r.body.columns}" />
      </div>
      <div class="field"><label>Высота строки (px)</label>
        <input type="number" id="th-rh" min="32" max="200" value="${r.body.rowHeightPx}" />
      </div>
      <div class="field"><label>Отступ сетки (px)</label>
        <input type="number" id="th-gap" min="0" max="48" value="${r.body.gapPx}" />
      </div>
      <div class="field"><label><input type="checkbox" id="th-head" ${r.header.enabled?"checked":""} /> Шапка</label></div>
      <div class="field"><label>Высота шапки (px)</label>
        <input type="number" id="th-hh" min="32" max="200" value="${r.header.heightPx}" />
      </div>
      <div class="field"><label><input type="checkbox" id="th-foot" ${r.footer.enabled?"checked":""} /> Подвал</label></div>
      <div class="field"><label>Высота подвала (px)</label>
        <input type="number" id="th-fh" min="32" max="200" value="${r.footer.heightPx}" />
      </div>`;const e=Q(u.zone,u.id);if(!e)return"<p>Блок не найден</p>";const t=`
    <div class="field"><label>Заголовок</label>
      <input type="text" id="in-title" value="${x(e.title??"")}" />
    </div>
    <p style="font-size:0.75rem;color:var(--muted)">Тип: ${e.type}</p>
  `;if(u.zone==="body"&&"col"in e){const o=e;return t+`
      <div class="field"><label>Колонка (1–${r.body.columns})</label>
        <input type="number" id="in-col" min="1" max="${r.body.columns}" value="${o.col}" />
      </div>
      <div class="field"><label>Строка</label>
        <input type="number" id="in-row" min="1" max="99" value="${o.row}" />
      </div>
      <div class="field"><label>Ширина (span)</label>
        <input type="number" id="in-cs" min="1" max="${r.body.columns}" value="${o.colSpan}" />
      </div>
      <div class="field"><label>Высота (span)</label>
        <input type="number" id="in-rs" min="1" max="50" value="${o.rowSpan}" />
      </div>
      ${o.type==="entity"?me(o):""}
      ${o.type==="text"||o.type==="markdown"?be(o):""}
      <button type="button" id="btn-del" style="margin-top:0.5rem;width:100%;border-color:var(--danger)">Удалить блок</button>
    `}const n=e;return t+`
    <div class="field"><label>Порядок</label>
      <input type="number" id="in-order" min="0" max="999" value="${n.order}" />
    </div>
    ${n.type==="entity"?ye(n):""}
    ${n.type==="text"||n.type==="markdown"?fe(n):""}
    <button type="button" id="btn-del" style="margin-top:0.5rem;width:100%;border-color:var(--danger)">Удалить блок</button>
  `}function me(e){return`<div class="field"><label>entity_id</label>
    <input type="text" id="in-entity" placeholder="sensor.temperature" value="${x(e.entityId??"")}" />
  </div>`}function ye(e){return`<div class="field"><label>entity_id</label>
    <input type="text" id="in-entity" placeholder="sensor.temperature" value="${x(e.entityId??"")}" />
  </div>`}function be(e){return`<div class="field"><label>Текст</label>
    <textarea id="in-content">${E(e.content??"")}</textarea>
  </div>`}function fe(e){return`<div class="field"><label>Текст</label>
    <textarea id="in-content">${E(e.content??"")}</textarea>
  </div>`}function Q(e,t){return e==="body"?r.body.blocks.find(o=>o.id===t):(e==="header"?r.header.blocks:r.footer.blocks).find(o=>o.id===t)}function he(){var e,t,n,o,i,a,c;(e=document.getElementById("btn-save"))==null||e.addEventListener("click",async()=>{g("Сохранение…");try{await te(A(r)),g("Сохранено")}catch(l){g(`Ошибка: ${l instanceof Error?l.message:String(l)}`,!0)}}),(t=document.getElementById("btn-load"))==null||t.addEventListener("click",async()=>{g("Загрузка…");try{r=A(await ee()),u=null,g("Загружено"),d()}catch(l){g(`Ошибка: ${l instanceof Error?l.message:String(l)}`,!0)}}),(n=document.getElementById("btn-toggle"))==null||n.addEventListener("click",()=>{f=!f,f&&(N=!1),d()}),(o=document.getElementById("chk-live"))==null||o.addEventListener("change",l=>{N=l.target.checked,d()}),(i=document.getElementById("btn-export"))==null||i.addEventListener("click",()=>{const l=new Blob([JSON.stringify(A(r),null,2)],{type:"application/json"}),b=document.createElement("a");b.href=URL.createObjectURL(l),b.download="dashboard-layout.json",b.click(),URL.revokeObjectURL(b.href)}),(a=document.getElementById("inp-import"))==null||a.addEventListener("change",l=>{var w;const b=(w=l.target.files)==null?void 0:w[0];if(!b)return;const p=new FileReader;p.onload=()=>{try{const $=JSON.parse(String(p.result));r=A($),u=null,g("Импорт OK"),d()}catch{g("Неверный JSON",!0)}},p.readAsText(b),l.target.value=""}),(c=document.getElementById("btn-settings"))==null||c.addEventListener("click",()=>{_=!0,d()})}function ve(){document.querySelectorAll(".palette-item").forEach(e=>{e.addEventListener("dragstart",()=>{S=e.dataset.type??null}),e.addEventListener("dragend",()=>{S=null})})}function ge(){var e;document.querySelectorAll(".strip-block, .grid-block").forEach(t=>{t.addEventListener("click",n=>{n.stopPropagation();const o=t.dataset.zone,i=t.dataset.id;!i||!o||(u={zone:o,id:i},d())})}),document.querySelectorAll("[data-drop]").forEach(t=>{t.addEventListener("dragover",n=>{!f||!S||n.preventDefault()}),t.addEventListener("drop",n=>{if(n.preventDefault(),!f||!S)return;const o=t.dataset.drop;we(o,S),S=null,d()})}),(e=document.querySelector(".canvas-wrap"))==null||e.addEventListener("click",t=>{t.target===t.currentTarget&&(u=null,d())})}function we(e,t){if(e==="body"){const l={id:R(),type:t,col:1,row:1,colSpan:Math.min(4,r.body.columns),rowSpan:1,title:W(t),content:t==="text"||t==="markdown"?"Текст":void 0,entityId:t==="entity"?"sun.sun":void 0};r.body.blocks.push(l),u={zone:"body",id:l.id};return}const n=e==="header"?r.header.blocks:r.footer.blocks,o=n.reduce((a,c)=>Math.max(a,c.order??0),-1),i={id:R(),type:t,order:o+1,title:W(t),content:t==="text"||t==="markdown"?"Текст":void 0,entityId:t==="entity"?"sun.sun":void 0};n.push(i),u={zone:e,id:i.id}}function W(e){switch(e){case"text":return"Текст";case"markdown":return"Markdown";case"entity":return"Сущность";default:return"Отступ"}}function ke(){var t,n,o,i,a,c,l,b,p,w,$,L,v,k,z,F,j,H,U;if(!u){(t=document.getElementById("th-accent"))==null||t.addEventListener("change",s=>{r.theme.accent=s.target.value,d()}),(n=document.getElementById("th-cols"))==null||n.addEventListener("change",s=>{r.body.columns=h(s.target.valueAsNumber,4,24),d()}),(o=document.getElementById("th-rh"))==null||o.addEventListener("change",s=>{r.body.rowHeightPx=h(s.target.valueAsNumber,32,200),d()}),(i=document.getElementById("th-gap"))==null||i.addEventListener("change",s=>{r.body.gapPx=h(s.target.valueAsNumber,0,48),d()}),(a=document.getElementById("th-head"))==null||a.addEventListener("change",s=>{r.header.enabled=s.target.checked,d()}),(c=document.getElementById("th-hh"))==null||c.addEventListener("change",s=>{r.header.heightPx=h(s.target.valueAsNumber,32,200),d()}),(l=document.getElementById("th-foot"))==null||l.addEventListener("change",s=>{r.footer.enabled=s.target.checked,d()}),(b=document.getElementById("th-fh"))==null||b.addEventListener("change",s=>{r.footer.heightPx=h(s.target.valueAsNumber,32,200),d()});return}const e=Q(u.zone,u.id);if(e){if((p=document.getElementById("in-title"))==null||p.addEventListener("change",s=>{e.title=s.target.value||void 0,d()}),u.zone==="body"&&"col"in e){const s=e;(w=document.getElementById("in-col"))==null||w.addEventListener("change",m=>{s.col=h(m.target.valueAsNumber,1,r.body.columns),d()}),($=document.getElementById("in-row"))==null||$.addEventListener("change",m=>{s.row=h(m.target.valueAsNumber,1,99),d()}),(L=document.getElementById("in-cs"))==null||L.addEventListener("change",m=>{s.colSpan=h(m.target.valueAsNumber,1,r.body.columns),d()}),(v=document.getElementById("in-rs"))==null||v.addEventListener("change",m=>{s.rowSpan=h(m.target.valueAsNumber,1,50),d()}),(k=document.getElementById("in-entity"))==null||k.addEventListener("change",m=>{s.entityId=m.target.value||void 0,d()}),(z=document.getElementById("in-content"))==null||z.addEventListener("change",m=>{s.content=m.target.value||void 0,d()})}else{const s=e;(F=document.getElementById("in-order"))==null||F.addEventListener("change",m=>{s.order=h(m.target.valueAsNumber,0,999),d()}),(j=document.getElementById("in-entity"))==null||j.addEventListener("change",m=>{s.entityId=m.target.value||void 0,d()}),(H=document.getElementById("in-content"))==null||H.addEventListener("change",m=>{s.content=m.target.value||void 0,d()})}(U=document.getElementById("btn-del"))==null||U.addEventListener("click",()=>{u&&(u.zone==="body"?r.body.blocks=r.body.blocks.filter(s=>s.id!==u.id):u.zone==="header"?r.header.blocks=r.header.blocks.filter(s=>s.id!==u.id):r.footer.blocks=r.footer.blocks.filter(s=>s.id!==u.id),u=null,d())})}}function h(e,t,n){return Number.isNaN(e)?t:Math.min(n,Math.max(t,e))}function g(e,t=!1){const n=document.getElementById("status");n&&(n.textContent=e,n.style.color=t?"var(--danger)":"var(--muted)")}function E(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function x(e){return E(e).replaceAll(`
`," ")}function $e(){return`<div class="modal-backdrop" id="modal-bg">
    <div class="modal" id="modal">
      <h2>Подключение к Home Assistant</h2>
      <p style="font-size:0.8rem;color:var(--muted);margin:0 0 0.75rem">
        Если открываете с того же адреса, что и HA (например <code>/dashboard_builder_web/</code>),
        оставьте базовый URL пустым — запросы пойдут с cookie сессии.
        Для отдельного хоста укажите URL (без слэша в конце) и долгоживущий токен.
      </p>
      <div class="field"><label>Базовый URL (опционально)</label>
        <input type="url" id="set-base" placeholder="https://homeassistant.local:8123" value="${x(P())}" />
      </div>
      <div class="field"><label>Токен (опционально)</label>
        <input type="password" id="set-token" autocomplete="off" value="${x(O())}" />
      </div>
      <div class="modal-actions">
        <button type="button" id="set-cancel">Отмена</button>
        <button type="button" class="primary" id="set-save">Сохранить</button>
      </div>
    </div>
  </div>`}function Ee(){var e,t,n;(e=document.getElementById("modal-bg"))==null||e.addEventListener("click",o=>{o.target===document.getElementById("modal-bg")&&(_=!1,d())}),(t=document.getElementById("set-cancel"))==null||t.addEventListener("click",()=>{_=!1,d()}),(n=document.getElementById("set-save"))==null||n.addEventListener("click",()=>{const o=document.getElementById("set-base").value,i=document.getElementById("set-token").value;Y(o,i),B="",_=!1,d()})}r=A(K());d();
