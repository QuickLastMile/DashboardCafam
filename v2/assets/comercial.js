/* ===================== MOTOR CAFAM COMERCIAL (borrador) =====================
   Fuente: Google Sheet publicado de Comercial (distinto al de Institucional),
   hojas "cantidad", "novedades" y "tiempos". Es un primer borrador que replica
   el mismo patrón de Institucional > Nacional (KPIs + subpestañas Cantidad /
   Novedades / Tiempos) para validar qué conservar, quitar o ajustar antes de
   sumar el resto (Per Cápita, Ventas, Novedades de Cancelación, Planta). */
(function(){
const COM_CFG={
  base:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQNfxBykrkeBy4J4jvi2-nDNkMfDMbm-jbwgmBz9FjNUIBQGk257yuU1PH_QmXi0rV0AervZoNyJ9XO/pub',
  cantidad(){return this.base+'?gid=0&single=true&output=csv';},
  novedades(){return this.base+'?gid=1091468477&single=true&output=csv';},
  tiempos(){return this.base+'?gid=1183579745&single=true&output=csv';}
};

/* ---------- Estado ---------- */
let COM_CANT=[],COM_NOV=[],COM_TIEMPOS=[];
let comCharts={},comLoaded=false,comLoading=false;

/* ---------- Utilidades (copia local — comercial.js es independiente de institucional.js) ---------- */
const COLORS={blue:'#2563EB',green:'#22C55E',yellow:'#EAB308',red:'#EF4444',gray:'#94A3B8',purple:'#A855F7'};
const chartBase={responsive:true,maintainAspectRatio:false,interaction:{mode:'nearest',intersect:false},plugins:{legend:{labels:{color:'#94A3B8',font:{family:'Plus Jakarta Sans',size:11.5},padding:14,usePointStyle:true,pointStyle:'circle'}},tooltip:{intersect:false,mode:'nearest'}},scales:{}};
const gridScale={grid:{color:'rgba(148,163,184,.08)'},ticks:{color:'#64748B',font:{family:'Plus Jakarta Sans',size:11}}};
const BC={base:chartBase,grid:gridScale};
const CO=COLORS;
const legBase={labels:chartBase.plugins.legend.labels};
const PAL=['#2563EB','#22C55E','#EAB308','#A855F7','#EF4444','#38bdf8','#fb7185','#0E8A78','#C97B20','#64748B','#f472b6','#14b8a6'];
const palette=n=>{const a=[];for(let i=0;i<n;i++)a.push(PAL[i%PAL.length]);return a;};
const uniq=a=>[...new Set(a.filter(x=>x!=null&&String(x).trim()!==''))];
const ms=id=>MultiSelect.getValues(id);
const num=x=>parseFloat(String(x==null?'':x).replace(/[^0-9.\-]/g,''))||0;
const sortObj=o=>Object.fromEntries(Object.entries(o).sort((a,b)=>b[1]-a[1]));
const groupCount=(arr,key)=>arr.reduce((a,r)=>{const k=key(r)||'—';a[k]=(a[k]||0)+1;return a;},{});
const groupSum=(arr,key,val)=>arr.reduce((a,r)=>{const k=key(r)||'—';a[k]=(a[k]||0)+(val(r)||0);return a;},{});
function groupAvg(arr,key,val){const s={},c={};arr.forEach(r=>{const vv=val(r);if(vv==null||isNaN(vv))return;const k=key(r)||'—';s[k]=(s[k]||0)+vv;c[k]=(c[k]||0)+1;});const o={};Object.keys(s).forEach(k=>{o[k]=s[k]/c[k];});return o;}
const DOW_LBL=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const dowIdx=ts=>{if(!ts)return null;const g=new Date(+ts).getDay();return g===0?6:g-1;};
function byDow(arr,valFn){const a=[0,0,0,0,0,0,0];arr.forEach(r=>{const k=dowIdx(r._d);if(k!=null)a[k]+=(valFn?valFn(r):1);});return a;}
const setHTML=(id,html)=>{const e=document.getElementById(id);if(e)e.innerHTML=html;};
const MES_ORDER=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const sortMes=arr=>[...arr].sort((a,b)=>MES_ORDER.indexOf(a)-MES_ORDER.indexOf(b));
const MES_FULL={ENERO:'ENE',FEBRERO:'FEB',MARZO:'MAR',ABRIL:'ABR',MAYO:'MAY',JUNIO:'JUN',JULIO:'JUL',AGOSTO:'AGO',SEPTIEMBRE:'SEP',OCTUBRE:'OCT',NOVIEMBRE:'NOV',DICIEMBRE:'DIC'};
const mesAbr=s=>{const t=String(s||'').trim().toUpperCase();return MES_FULL[t]||t.slice(0,3);};
const tcase=s=>s?String(s).toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()):'';
function parseD(s){const m=String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);if(!m)return null;let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1]);}
function isoWeek(dt){const d=new Date(Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate()));const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);const ys=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil(((d-ys)/86400000+1)/7);}
const weekKey=dt=>dt.getFullYear()+'-S'+String(isoWeek(dt)).padStart(2,'0');
function gradFill(hex){return c=>{const ctx=c.chart.ctx;const g=ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,hex+'66');g.addColorStop(1,hex+'00');return g;};}
const stampNow=()=>new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
function parseHora(s){const m=String(s||'').trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);if(!m)return null;const h=+m[1]+(+m[2])/60+(m[3]?(+m[3])/3600:0);return h>=0&&h<24?h:null;}
function hhmm(h){if(h==null||isNaN(h))return '—';let hh=Math.floor(h),mm=Math.round((h-hh)*60);if(mm===60){hh+=1;mm=0;}return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
function mkChart(id,cfg){const el=document.getElementById(id);if(!el)return;if(comCharts[id]){comCharts[id].destroy();}comCharts[id]=new Chart(el,cfg);setChartEmpty(id,false);}
function setChartEmpty(canvasId,show,msg){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const wrap=cv.closest('.chart-wrap');if(!wrap)return;
  let note=wrap.querySelector('.chart-empty-note');
  if(show){cv.style.visibility='hidden';if(!note){note=document.createElement('div');note.className='chart-empty-note';wrap.appendChild(note);}note.textContent=msg||'Sin datos para este filtro';}
  else{cv.style.visibility='';if(note)note.remove();}
}
function renderTable(id,headers,rows){const t=document.getElementById(id);if(!t)return;t.innerHTML='<thead><tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${c==null?'':c}</td>`).join('')+'</tr>').join('')+'</tbody>';}
function kpiCards(container,arr){
  const g=document.getElementById(container);if(!g)return;g.innerHTML='';
  arr.forEach((k,i)=>{const el=document.createElement('div');el.className='kpi';el.style.animationDelay=(i*0.04)+'s';
    el.innerHTML=`<div class="top"><div><div class="label">${k.l}</div></div><div class="ic bg-${k.c}"><i class="fa-solid ${k.ic}"></i></div></div>
      ${k.txt!==undefined?`<div class="val">${k.txt}</div>`:`<div class="val" data-target="${k.v}" data-dec="${k.dec||0}" data-suf="${k.suf||''}">0</div>`}
      ${k.t?`<div class="trend ${k.up===0?'t-down':'t-up'}"><i class="fa-solid fa-arrow-trend-${k.up===0?'down':'up'}"></i>${k.t}</div>`:''}`;
    g.appendChild(el);});
  g.querySelectorAll('.val[data-target]').forEach(el=>{const tgt=parseFloat(el.dataset.target)||0,dec=+el.dataset.dec,suf=el.dataset.suf;let s=0,step=tgt/40||1;const t=setInterval(()=>{s+=step;if(s>=tgt){s=tgt;clearInterval(t);}el.innerHTML=s.toLocaleString('es',{maximumFractionDigits:dec,minimumFractionDigits:dec})+(suf?`<small>${suf}</small>`:'');},18);});
}
const cumplPill=c=>`<span class="pill ${c>=85?'pill-g':c>=70?'pill-y':'pill-r'}">${c}%</span>`;
function fetchCom(url){return new Promise((res,rej)=>{Papa.parse(url,{download:true,header:true,skipEmptyLines:true,complete:r=>res(r.data),error:rej});});}

/* ---------- Parsers ---------- */
const esFecha=s=>/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(String(s||''));
function parseComCantidad(raw){return (raw||[]).map(r=>{
  const fecha=(r.fecha_cierre||'').trim();const d=parseD(fecha);
  const ent=num(r.ENTREGADO),nov=num(r.CANCELACION)+num(r.CONGELADO)+num(r.REPROGRAMADO);
  return {fecha,mes:mesAbr(r.MES),ciudad:tcase(r.CIUDAD),drogueria:(r['DROGUERIA NOMBRE CORTO']||'').trim(),
    entregado:ent,novedad:nov,total:num(r.TOTAL)||(ent+nov),_d:+(d||0),week:d?weekKey(d):''};
}).filter(r=>esFecha(r.fecha));}
function parseComNovedades(raw){return (raw||[]).map(r=>{
  const fecha=(r.FECHA||'').trim();const d=parseD(fecha);
  return {fecha,mes:String(r.MES||'').trim().toUpperCase(),ciudad:tcase(r.CIUDAD),
    tipo:(r.TIPO||'').trim(),drogueria:(r['DROGUERIA NOMBRE CORTO']||'').trim(),_d:+(d||0)};
}).filter(r=>esFecha(r.fecha)&&r.tipo);}
function parseComTiempos(raw){return (raw||[]).map(r=>{
  const fecha=(r.fecha_cierre||'').trim();const d=parseD(fecha);
  return {fecha,mes:mesAbr(r.MES),ciudad:tcase(r.CIUDAD),tiempoH:parseHora(r['TIEMPO TOTAL']),_d:+(d||0)};
}).filter(r=>esFecha(r.fecha));}

/* ---------- Render ---------- */
function renderCom(){
  if(!COM_CANT.length){const k=document.getElementById('com-kpi');if(k)k.innerHTML='<div class="ind-loading">Sin datos — verifica el Google Sheet de Comercial.</div>';return;}
  const allMeses=sortMes(uniq(COM_CANT.map(r=>r.mes)));
  const allCiudades=uniq(COM_CANT.map(r=>r.ciudad)).sort();
  MultiSelect.setOptions('com-fMes',allMeses,{placeholder:'Todos',onChange:renderCom});
  MultiSelect.setOptions('com-fCiudad',allCiudades,{placeholder:'Todas',onChange:renderCom});
  const mes=ms('com-fMes'),ciudad=ms('com-fCiudad');
  const D=COM_CANT.filter(r=>(!mes.length||mes.includes(r.mes))&&(!ciudad.length||ciudad.includes(r.ciudad)));
  const ent=D.reduce((a,r)=>a+r.entregado,0),nv=D.reduce((a,r)=>a+r.novedad,0),tot=D.reduce((a,r)=>a+r.total,0);
  const cumpl=tot?ent/tot*100:0;
  const porFecha=groupSum(D,r=>r.fecha,r=>r.entregado);
  const pico=Object.entries(porFecha).sort((a,b)=>b[1]-a[1])[0]||['—',0];
  const DT=COM_TIEMPOS.filter(r=>(!mes.length||mes.includes(r.mes))&&(!ciudad.length||ciudad.includes(r.ciudad))&&r.tiempoH!=null);
  const avgT=DT.length?DT.reduce((a,r)=>a+r.tiempoH,0)/DT.length:null;
  kpiCards('com-kpi',[
    {l:'Total entregado',v:ent,ic:'fa-circle-check',c:'green'},
    {l:'Total novedades',v:nv,ic:'fa-triangle-exclamation',c:'red'},
    {l:'Total general',v:tot,ic:'fa-boxes-stacked',c:'blue'},
    {l:'% Cumplimiento',v:cumpl,suf:'%',dec:1,ic:'fa-gauge-high',c:cumpl>=90?'green':cumpl>=80?'yellow':'red',t:cumpl>=90?'Óptimo':'Revisar',up:cumpl>=90?1:0},
    {l:'Tiempo total prom.',txt:avgT!=null?hhmm(avgT):'—',ic:'fa-stopwatch',c:'yellow'},
    {l:'Día pico',v:pico[1],suf:' ent',ic:'fa-arrow-up-right-dots',c:'green',t:pico[0],up:1}
  ]);

  /* ----- Cantidad ----- */
  const baseCity=ciudad.length?COM_CANT.filter(r=>ciudad.includes(r.ciudad)):COM_CANT;
  const mesesAll=sortMes(uniq(baseCity.map(r=>r.mes)));
  const sumM=(m,f)=>baseCity.filter(r=>r.mes===m).reduce((a,r)=>a+r[f],0);
  mkChart('com-mes',{type:'bar',data:{labels:mesesAll,datasets:[
    {label:'Entregado',data:mesesAll.map(m=>sumM(m,'entregado')),backgroundColor:CO.green,borderRadius:6,maxBarThickness:36},
    {label:'Novedad',data:mesesAll.map(m=>sumM(m,'novedad')),backgroundColor:CO.red,borderRadius:6,maxBarThickness:36}
  ]},options:{...BC.base,plugins:{legend:legBase},scales:{x:BC.grid,y:BC.grid}}});
  const fechas=uniq(D.map(r=>r.fecha)).sort((a,b)=>(parseD(a)||0)-(parseD(b)||0));
  mkChart('com-dia',{type:'line',data:{labels:fechas,datasets:[{label:'Entregado',data:fechas.map(f=>porFecha[f]),borderColor:CO.blue,backgroundColor:gradFill('#2563EB'),fill:true,tension:.25,borderWidth:1.6,pointRadius:0}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:{...BC.grid,ticks:{...(BC.grid.ticks||{}),maxTicksLimit:12}},y:BC.grid}}});
  mkChart('com-sem',{type:'bar',data:{labels:DOW_LBL,datasets:[{label:'Total',data:byDow(D,r=>r.total),backgroundColor:CO.purple,borderRadius:7,maxBarThickness:54}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});

  /* ----- Novedades ----- */
  const novD=COM_NOV.filter(r=>(!mes.length||mes.includes(r.mes))&&(!ciudad.length||ciudad.includes(r.ciudad)));
  const byNov=sortObj(groupCount(novD,r=>r.tipo));
  const topNov=Object.entries(byNov).slice(0,16);
  mkChart('com-novtipo',{type:'bar',data:{labels:topNov.map(e=>e[0]),datasets:[{data:topNov.map(e=>e[1]),backgroundColor:palette(topNov.length),borderRadius:6}]},options:{...BC.base,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:BC.grid,y:{...BC.grid,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});
  const novBaseCity=ciudad.length?COM_NOV.filter(r=>ciudad.includes(r.ciudad)):COM_NOV;
  const mesesNovAll=sortMes(uniq(novBaseCity.map(r=>r.mes)));
  const byMesNov=mesesNovAll.map(m=>novBaseCity.filter(r=>r.mes===m).length);
  mkChart('com-novmes',{type:'bar',data:{labels:mesesNovAll,datasets:[{data:byMesNov,backgroundColor:CO.red,borderRadius:8,maxBarThickness:50}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});

  /* ----- Tiempos ----- */
  const horaTip={callbacks:{label:c=>' '+hhmm(c.parsed.y!=null?c.parsed.y:c.parsed)}};
  const horaY={...BC.grid,ticks:{...(BC.grid.ticks||{}),callback:v=>hhmm(v)}};
  const hfechas=uniq(DT.map(r=>r.fecha)).sort((a,b)=>(parseD(a)||0)-(parseD(b)||0));
  const hpd=groupAvg(DT,r=>r.fecha,r=>r.tiempoH);
  mkChart('com-hdia',{type:'line',data:{labels:hfechas,datasets:[{label:'Tiempo total',data:hfechas.map(f=>hpd[f]!=null?+hpd[f].toFixed(3):null),borderColor:CO.yellow,backgroundColor:gradFill('#EAB308'),fill:true,tension:.25,borderWidth:1.6,pointRadius:0,spanGaps:true}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:horaTip},scales:{x:{...BC.grid,ticks:{...(BC.grid.ticks||{}),maxTicksLimit:12}},y:horaY}}});
  const baseCityT=(ciudad.length?COM_TIEMPOS.filter(r=>ciudad.includes(r.ciudad)):COM_TIEMPOS).filter(r=>r.tiempoH!=null);
  const mesesAllT=sortMes(uniq(baseCityT.map(r=>r.mes)));
  const hpm=groupAvg(baseCityT,r=>r.mes,r=>r.tiempoH);
  mkChart('com-hmes',{type:'bar',data:{labels:mesesAllT,datasets:[{data:mesesAllT.map(m=>hpm[m]!=null?+hpm[m].toFixed(3):null),backgroundColor:CO.yellow,borderRadius:6,maxBarThickness:50}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:horaTip},scales:{x:BC.grid,y:horaY}}});

  /* ----- Detalle ----- */
  renderTable('com-table',['FECHA','MES','CIUDAD','DROGUERÍA','ENTREGADO','NOVEDAD','TOTAL','% CUMPL'],
    [...D].sort((a,b)=>(b._d||0)-(a._d||0)).slice(0,500).map(r=>[r.fecha,r.mes,r.ciudad,r.drogueria,r.entregado,r.novedad,r.total,cumplPill(r.total?+(r.entregado/r.total*100).toFixed(0):0)]));
  const cEl=document.getElementById('com-count');if(cEl)cEl.textContent=D.length.toLocaleString('es')+' registros'+(D.length>500?' (mostrando 500)':'');
  const sEl=document.getElementById('com-stamp');if(sEl)sEl.textContent=stampNow();
}

async function ensureCom(){
  if(comLoaded||comLoading)return;
  comLoading=true;
  const k=document.getElementById('com-kpi');if(k)k.innerHTML='<div class="ind-loading">Cargando datos de Comercial — son más de 25.000 registros, puede tardar unos segundos…</div>';
  try{
    const [cant,nov,tiempos]=await Promise.all([
      fetchCom(COM_CFG.cantidad()),
      fetchCom(COM_CFG.novedades()),
      fetchCom(COM_CFG.tiempos())
    ]);
    COM_CANT=parseComCantidad(cant);
    COM_NOV=parseComNovedades(nov);
    COM_TIEMPOS=parseComTiempos(tiempos);
    comLoaded=true;
    renderCom();
    setTimeout(()=>{if(window.resizeAllCharts)resizeAllCharts();},160);
  }catch(e){console.warn('Comercial: fallo de carga',e);const k2=document.getElementById('com-kpi');if(k2)k2.innerHTML='<div class="ind-loading">Error al conectar con el Google Sheet de Comercial.</div>';}
  comLoading=false;
}

/* ---------- Wiring ---------- */
document.querySelector('.nav-item[data-view="com-nacional"]')?.addEventListener('click',()=>{
  ensureCom();
  if(comLoaded){try{renderCom();}catch(e){console.warn('re-render Comercial',e);}}
  setTimeout(()=>{if(window.resizeAllCharts)resizeAllCharts();},60);
});
const comR=document.getElementById('com-reset');if(comR)comR.addEventListener('click',()=>{['com-fMes','com-fCiudad'].forEach(id=>MultiSelect.clear(id));renderCom();});
if(window.wireSubtabs)wireSubtabs('#com-subtabs','com-tab-',()=>{});
if(window.wireDetalleToggle)wireDetalleToggle('com-detalle-toggle','com-detalle-card','Comercial');

window.ensureCom=ensureCom;
})();
