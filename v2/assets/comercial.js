/* ===================== MOTOR CAFAM COMERCIAL (borrador) =====================
   Fuente: Google Sheet publicado de Comercial (distinto al de Institucional),
   con las 7 hojas del dashboard anterior: base (roster), cantidad, novedades,
   tiempos, percapita, ventas y novcancel. Replica el mismo patrón de
   Institucional (KPIs + subpestañas + filtros multi-selección + detalle
   oculto) para validar qué conservar, quitar o ajustar en cada una. */
(function(){
const COM_CFG={
  base:'https://docs.google.com/spreadsheets/d/e/2PACX-1vQNfxBykrkeBy4J4jvi2-nDNkMfDMbm-jbwgmBz9FjNUIBQGk257yuU1PH_QmXi0rV0AervZoNyJ9XO/pub',
  roster(){return this.base+'?gid=1510401293&single=true&output=csv';},
  novedades(){return this.base+'?gid=1091468477&single=true&output=csv';},
  cantidad(){return this.base+'?gid=0&single=true&output=csv';},
  percapita(){return this.base+'?gid=276501764&single=true&output=csv';},
  tiempos(){return this.base+'?gid=1183579745&single=true&output=csv';},
  ventas(){return this.base+'?gid=41915920&single=true&output=csv';},
  novcancel(){return this.base+'?gid=1615312577&single=true&output=csv';}
};

/* ---------- Estado ---------- */
let COM_CANT=[],COM_NOV=[],COM_TIEMPOS=[],COM_BASE=[],COM_PERCAP=[],COM_VENTAS=[],COM_NOVCANCEL=[];
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
  return {fecha,mes:mesAbr(r.MES),ciudad:tcase(r.CIUDAD),
    tipo:(r.TIPO||'').trim(),drogueria:(r['DROGUERIA NOMBRE CORTO']||'').trim(),_d:+(d||0)};
}).filter(r=>esFecha(r.fecha)&&r.tipo);}
function parseComTiempos(raw){return (raw||[]).map(r=>{
  const fecha=(r.fecha_cierre||'').trim();const d=parseD(fecha);
  return {fecha,mes:mesAbr(r.MES),ciudad:tcase(r.CIUDAD),tiempoH:parseHora(r['TIEMPO TOTAL']),_d:+(d||0)};
}).filter(r=>esFecha(r.fecha));}
function parseComRoster(raw){return (raw||[]).map(r=>({
  drogueria:(r['DROGUERIA NOMBRE CORTO']||'').trim(),ciudad:tcase(r.CIUDAD),operacion:tcase(r['OPERACIÓN']),
  coordinador:tcase(r['COORDINADOR ENCARGADO']),tipoMensajero:tcase(r['TIPO MENSAJERO']),
  mensajeros:num(r['CANTIDAD MENSAJEROS'])
})).filter(r=>r.drogueria);}
function parseComPercap(raw){return (raw||[]).map(r=>({
  ciudad:tcase(r.CIUDAD),mes:mesAbr(r.MES), // la hoja mezcla "ENE" y "SEPTIEMBRE" según la fila
  punto:(r['DROGUERIA NOMBRE CORTO']||r.DROUERIA||r.DROGUERIA||'').trim(),
  entregas:num(r['CANT ENTREGAS']),costo:num(r.COSTO),pc:num(r['PER CAPITA'])
})).filter(r=>r.punto);}
function parseComVentas(raw){return (raw||[]).map(r=>{
  const fecha=(r.fecha_cierre||'').trim();const d=parseD(fecha);
  return {fecha,mes:mesAbr(r.MES),ciudad:tcase(r.CIUDAD),drogueria:(r['DROGUERIA NOMBRE CORTO']||'').trim(),
    estado:(r.ESTADO||'').trim(),venta:num(r['TOTAL VENTA']),_d:+(d||0)};
}).filter(r=>esFecha(r.fecha));}
const NC_EXCLUDE=new Set(['MES','SEMANA','CIUDAD','TIPO MENSAJERO','DROGUERIA NOMBRE CORTO','TIPO GESTIÓN','TOTAL','DROGUERIA']);
function parseComNovCancel(raw){
  const out=[];
  (raw||[]).forEach(r=>{
    const mes=mesAbr(r.MES);if(!mes)return;
    const ciudad=tcase(r.CIUDAD),drogueria=(r['DROGUERIA NOMBRE CORTO']||'').trim();
    Object.keys(r).forEach(k=>{
      if(NC_EXCLUDE.has(k))return;
      const v=num(r[k]);
      if(v)out.push({mes,ciudad,drogueria,razon:k.trim(),count:v});
    });
  });
  return out;
}

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

/* ---------- Resumen (hoja "base": roster de droguerías, sin filtros de fecha) ---------- */
function renderComResumen(){
  if(!COM_BASE.length){const k=document.getElementById('com-res-kpi');if(k)k.innerHTML='<div class="ind-loading">Sin datos — hoja "base".</div>';return;}
  const totalMsj=COM_BASE.reduce((a,r)=>a+r.mensajeros,0);
  const ciudades=uniq(COM_BASE.map(r=>r.ciudad));
  kpiCards('com-res-kpi',[
    {l:'Droguerías',v:COM_BASE.length,ic:'fa-store',c:'blue'},
    {l:'Mensajeros',v:totalMsj,ic:'fa-person-biking',c:'green'},
    {l:'Ciudades',v:ciudades.length,ic:'fa-city',c:'purple'},
    {l:'Prom. mensajeros/droguería',v:COM_BASE.length?totalMsj/COM_BASE.length:0,dec:1,ic:'fa-chart-simple',c:'yellow'}
  ]);
  const byCiudad=sortObj(groupSum(COM_BASE,r=>r.ciudad,r=>r.mensajeros));
  mkChart('com-res-ciudad',{type:'bar',data:{labels:Object.keys(byCiudad),datasets:[{data:Object.values(byCiudad),backgroundColor:palette(Object.keys(byCiudad).length),borderRadius:6}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  const byTipo=sortObj(groupCount(COM_BASE,r=>r.tipoMensajero));
  mkChart('com-res-tipo',{type:'doughnut',data:{labels:Object.keys(byTipo),datasets:[{data:Object.values(byTipo),backgroundColor:palette(Object.keys(byTipo).length),borderColor:'#0b1120',borderWidth:2}]},options:{...BC.base,plugins:{legend:legBase}}});
  renderTable('com-res-table',['DROGUERÍA','CIUDAD','COORDINADOR','TIPO MENSAJERO','MENSAJEROS','OPERACIÓN'],
    [...COM_BASE].sort((a,b)=>b.mensajeros-a.mensajeros).map(r=>[r.drogueria,r.ciudad,r.coordinador,r.tipoMensajero,r.mensajeros,r.operacion]));
  const cEl=document.getElementById('com-res-count');if(cEl)cEl.textContent=COM_BASE.length+' droguerías';
}

/* ---------- Per Cápita (comparte Mes/Ciudad del filtro superior + Punto propio) ---------- */
function renderComPercap(){
  if(!COM_PERCAP.length){const k=document.getElementById('com-ipc-kpi');if(k)k.innerHTML='<div class="ind-loading">Sin datos — hoja "percapita".</div>';return;}
  const money=n=>'$ '+Math.round(n||0).toLocaleString('es-CO');
  const mes=ms('com-fMes'),ciudad=ms('com-fCiudad');
  const baseMC=COM_PERCAP.filter(r=>(!mes.length||mes.includes(r.mes))&&(!ciudad.length||ciudad.includes(r.ciudad)));
  MultiSelect.setOptions('com-ipc-fDrog',uniq(baseMC.map(r=>r.punto)),{placeholder:'Todos',onChange:renderComPercap});
  const drog=ms('com-ipc-fDrog');
  const D=baseMC.filter(r=>!drog.length||drog.includes(r.punto));
  if(!D.length){
    const k=document.getElementById('com-ipc-kpi');if(k)k.innerHTML='<div class="ind-loading">Sin datos para este filtro</div>';
    ['com-ipc-mes','com-ipc-top','com-ipc-drog','com-ipc-ciudad'].forEach(id=>{if(comCharts[id]){comCharts[id].destroy();delete comCharts[id];}});
    renderTable('com-ipc-table',['PUNTO','CIUDAD','MES','ENTREGAS','COSTO','PER CÁPITA'],[]);
    return;
  }
  const pcP=groupAvg(D,r=>r.punto,r=>r.pc);
  const entriesP=Object.entries(pcP).sort((a,b)=>b[1]-a[1]);
  const pcM=groupAvg(D,r=>r.mes,r=>r.pc);
  const costoCity=groupSum(D,r=>r.ciudad,r=>r.costo),entCity=groupSum(D,r=>r.ciudad,r=>r.entregas);
  const totalCosto=D.reduce((a,r)=>a+r.costo,0),totalEnt=D.reduce((a,r)=>a+r.entregas,0);
  const globalPC=totalEnt>0?totalCosto/totalEnt:0;
  kpiCards('com-ipc-kpi',[
    {l:'Per cápita global prom.',txt:money(globalPC),ic:'fa-coins',c:'yellow'},
    {l:'PC más alto',txt:money(entriesP[0]?entriesP[0][1]:0),ic:'fa-arrow-up',c:'red',t:entriesP[0]?entriesP[0][0]:'—',up:0},
    {l:'PC más bajo',txt:money(entriesP.length?entriesP[entriesP.length-1][1]:0),ic:'fa-arrow-down',c:'green',t:entriesP.length?entriesP[entriesP.length-1][0]:'—',up:1},
    {l:'Costo total',txt:money(totalCosto),ic:'fa-dollar-sign',c:'purple'},
    {l:'Total entregas',v:totalEnt,ic:'fa-boxes-stacked',c:'blue'},
    {l:'Puntos',v:uniq(D.map(r=>r.punto)).length,ic:'fa-store',c:'yellow'}
  ]);
  const moneyTipY={callbacks:{label:c=>' '+money(c.parsed.y!=null?c.parsed.y:c.parsed)}};
  const mesL=sortMes(Object.keys(pcM));
  mkChart('com-ipc-mes',{type:'line',data:{labels:mesL,datasets:[{label:'Per cápita',data:mesL.map(m=>Math.round(pcM[m])),borderColor:CO.yellow,backgroundColor:gradFill('#EAB308'),fill:true,tension:.35,borderWidth:2.4,pointRadius:3}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  const top5=entriesP.slice(0,5);
  mkChart('com-ipc-top',{type:'bar',data:{labels:top5.map(e=>e[0]),datasets:[{data:top5.map(e=>Math.round(e[1])),backgroundColor:CO.red,borderRadius:6}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  const drogArr=entriesP.slice(0,16);
  mkChart('com-ipc-drog',{type:'bar',data:{labels:drogArr.map(e=>e[0]),datasets:[{data:drogArr.map(e=>Math.round(e[1])),backgroundColor:palette(drogArr.length),borderRadius:6}]},options:{...BC.base,indexAxis:'y',plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:{...BC.grid,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});
  const cityArr=Object.entries(costoCity).sort((a,b)=>b[1]-a[1]);
  mkChart('com-ipc-ciudad',{type:'bar',data:{labels:cityArr.map(e=>e[0]),datasets:[{data:cityArr.map(e=>e[1]),backgroundColor:palette(cityArr.length),borderRadius:6}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  renderTable('com-ipc-table',['PUNTO','CIUDAD','MES','ENTREGAS','COSTO','PER CÁPITA'],
    D.slice().sort((a,b)=>b.pc-a.pc).slice(0,500).map(r=>[r.punto,r.ciudad,r.mes,r.entregas.toLocaleString('es-CO'),money(r.costo),money(r.pc)]));
  const cEl=document.getElementById('com-ipc-count');if(cEl)cEl.textContent=D.length.toLocaleString('es')+' registros'+(D.length>500?' (mostrando 500)':'');
}

/* ---------- Ventas (comparte Mes/Ciudad del filtro superior) ---------- */
function renderComVentas(){
  if(!COM_VENTAS.length){const k=document.getElementById('com-vt-kpi');if(k)k.innerHTML='<div class="ind-loading">Sin datos — hoja "ventas".</div>';return;}
  const money=n=>'$ '+Math.round(n||0).toLocaleString('es-CO');
  const mes=ms('com-fMes'),ciudad=ms('com-fCiudad');
  const D=COM_VENTAS.filter(r=>(!mes.length||mes.includes(r.mes))&&(!ciudad.length||ciudad.includes(r.ciudad)));
  const total=D.reduce((a,r)=>a+r.venta,0);
  const porFecha=groupSum(D,r=>r.fecha,r=>r.venta);
  const dias=Object.keys(porFecha).length;
  const mejor=Object.entries(porFecha).sort((a,b)=>b[1]-a[1])[0]||['—',0];
  kpiCards('com-vt-kpi',[
    {l:'Venta total',txt:money(total),ic:'fa-dollar-sign',c:'green'},
    {l:'Venta promedio/día',txt:money(dias?total/dias:0),ic:'fa-chart-simple',c:'blue'},
    {l:'Transacciones',v:D.length,ic:'fa-receipt',c:'purple'},
    {l:'Mejor día',txt:money(mejor[1]),ic:'fa-arrow-up-right-dots',c:'yellow',t:mejor[0],up:1}
  ]);
  const baseCity=ciudad.length?COM_VENTAS.filter(r=>ciudad.includes(r.ciudad)):COM_VENTAS;
  const mesesAll=sortMes(uniq(baseCity.map(r=>r.mes)));
  const moneyTipY={callbacks:{label:c=>' '+money(c.parsed.y!=null?c.parsed.y:c.parsed)}};
  mkChart('com-vt-mes',{type:'bar',data:{labels:mesesAll,datasets:[{data:mesesAll.map(m=>baseCity.filter(r=>r.mes===m).reduce((a,r)=>a+r.venta,0)),backgroundColor:CO.green,borderRadius:6,maxBarThickness:44}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  const fechas=uniq(D.map(r=>r.fecha)).sort((a,b)=>(parseD(a)||0)-(parseD(b)||0));
  mkChart('com-vt-dia',{type:'line',data:{labels:fechas,datasets:[{label:'Venta',data:fechas.map(f=>porFecha[f]),borderColor:CO.blue,backgroundColor:gradFill('#2563EB'),fill:true,tension:.25,borderWidth:1.6,pointRadius:0}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:{...BC.grid,ticks:{...(BC.grid.ticks||{}),maxTicksLimit:12}},y:BC.grid}}});
  const byCiudad=sortObj(groupSum(D,r=>r.ciudad,r=>r.venta));
  mkChart('com-vt-ciudad',{type:'bar',data:{labels:Object.keys(byCiudad),datasets:[{data:Object.values(byCiudad),backgroundColor:palette(Object.keys(byCiudad).length),borderRadius:6}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  renderTable('com-vt-table',['FECHA','MES','CIUDAD','DROGUERÍA','ESTADO','VENTA'],
    [...D].sort((a,b)=>(b._d||0)-(a._d||0)).slice(0,500).map(r=>[r.fecha,r.mes,r.ciudad,r.drogueria,r.estado,money(r.venta)]));
  const cEl=document.getElementById('com-vt-count');if(cEl)cEl.textContent=D.length.toLocaleString('es')+' registros'+(D.length>500?' (mostrando 500)':'');
}

/* ---------- Nov. Cancelación (comparte Mes/Ciudad del filtro superior) ---------- */
function renderComNovCancel(){
  if(!COM_NOVCANCEL.length){const k=document.getElementById('com-nc-kpi');if(k)k.innerHTML='<div class="ind-loading">Sin datos — hoja "novcancel".</div>';return;}
  const mes=ms('com-fMes'),ciudad=ms('com-fCiudad');
  const D=COM_NOVCANCEL.filter(r=>(!mes.length||mes.includes(r.mes))&&(!ciudad.length||ciudad.includes(r.ciudad)));
  const total=D.reduce((a,r)=>a+r.count,0);
  const byRazonTotal=sortObj(groupSum(D,r=>r.razon,r=>r.count));
  const topRazon=Object.entries(byRazonTotal)[0]||['—',0];
  kpiCards('com-nc-kpi',[
    {l:'Total cancelaciones',v:total,ic:'fa-ban',c:'red'},
    {l:'Razón más frecuente',txt:topRazon[0],ic:'fa-circle-exclamation',c:'yellow'},
    {l:'Ciudades',v:uniq(D.map(r=>r.ciudad)).length,ic:'fa-city',c:'purple'}
  ]);
  const topRazones=Object.entries(byRazonTotal).slice(0,16);
  mkChart('com-nc-tipo',{type:'bar',data:{labels:topRazones.map(e=>e[0]),datasets:[{data:topRazones.map(e=>e[1]),backgroundColor:palette(topRazones.length),borderRadius:6}]},options:{...BC.base,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:BC.grid,y:{...BC.grid,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});
  const baseCity=ciudad.length?COM_NOVCANCEL.filter(r=>ciudad.includes(r.ciudad)):COM_NOVCANCEL;
  const mesesAll=sortMes(uniq(baseCity.map(r=>r.mes)));
  mkChart('com-nc-mes',{type:'bar',data:{labels:mesesAll,datasets:[{data:mesesAll.map(m=>baseCity.filter(r=>r.mes===m).reduce((a,r)=>a+r.count,0)),backgroundColor:CO.red,borderRadius:8,maxBarThickness:50}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  const byCiudad=sortObj(groupSum(D,r=>r.ciudad,r=>r.count));
  mkChart('com-nc-ciudad',{type:'bar',data:{labels:Object.keys(byCiudad),datasets:[{data:Object.values(byCiudad),backgroundColor:palette(Object.keys(byCiudad).length),borderRadius:6}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  renderTable('com-nc-table',['MES','CIUDAD','DROGUERÍA','RAZÓN','CANTIDAD'],
    [...D].sort((a,b)=>b.count-a.count).slice(0,500).map(r=>[r.mes,r.ciudad,r.drogueria,r.razon,r.count]));
  const cEl=document.getElementById('com-nc-count');if(cEl)cEl.textContent=D.length.toLocaleString('es')+' registros'+(D.length>500?' (mostrando 500)':'');
}

async function ensureCom(){
  if(comLoaded||comLoading)return;
  comLoading=true;
  const k=document.getElementById('com-kpi');if(k)k.innerHTML='<div class="ind-loading">Cargando datos de Comercial — son más de 65.000 registros en 7 hojas, puede tardar unos segundos…</div>';
  try{
    const [roster,cant,nov,tiempos,percap,ventas,novcancel]=await Promise.all([
      fetchCom(COM_CFG.roster()),
      fetchCom(COM_CFG.cantidad()),
      fetchCom(COM_CFG.novedades()),
      fetchCom(COM_CFG.tiempos()),
      fetchCom(COM_CFG.percapita()),
      fetchCom(COM_CFG.ventas()),
      fetchCom(COM_CFG.novcancel())
    ]);
    COM_BASE=parseComRoster(roster);
    COM_CANT=parseComCantidad(cant);
    COM_NOV=parseComNovedades(nov);
    COM_TIEMPOS=parseComTiempos(tiempos);
    COM_PERCAP=parseComPercap(percap);
    COM_VENTAS=parseComVentas(ventas);
    COM_NOVCANCEL=parseComNovCancel(novcancel);
    comLoaded=true;
    renderComAll();
    setTimeout(()=>{if(window.resizeAllCharts)resizeAllCharts();},160);
  }catch(e){console.warn('Comercial: fallo de carga',e);const k2=document.getElementById('com-kpi');if(k2)k2.innerHTML='<div class="ind-loading">Error al conectar con el Google Sheet de Comercial.</div>';}
  comLoading=false;
}
function renderComAll(){
  renderCom();renderComResumen();renderComPercap();renderComVentas();renderComNovCancel();
}

/* ---------- Wiring ---------- */
document.querySelector('.nav-item[data-view="com-nacional"]')?.addEventListener('click',()=>{
  ensureCom();
  if(comLoaded){try{renderComAll();}catch(e){console.warn('re-render Comercial',e);}}
  setTimeout(()=>{if(window.resizeAllCharts)resizeAllCharts();},60);
});
const comR=document.getElementById('com-reset');if(comR)comR.addEventListener('click',()=>{['com-fMes','com-fCiudad','com-ipc-fDrog'].forEach(id=>MultiSelect.clear(id));renderComAll();});
if(window.wireSubtabs)wireSubtabs('#com-subtabs','com-tab-',()=>{});
if(window.wireDetalleToggle){
  wireDetalleToggle('com-detalle-toggle','com-detalle-card','Cantidad');
  wireDetalleToggle('com-ipc-detalle-toggle','com-ipc-detalle-card','Per Cápita');
  wireDetalleToggle('com-vt-detalle-toggle','com-vt-detalle-card','Ventas');
  wireDetalleToggle('com-nc-detalle-toggle','com-nc-detalle-card','Nov. Cancelación');
}

window.ensureCom=ensureCom;
})();
