/* ===================== MOTOR CAFAM INSTITUCIONAL =====================
   Fuente: Google Sheet en vivo (hojas CANT NACIONAL, NOVEDADES NACIONAL,
   RECIBIDO CALLE 51, PER CAPITA). Vistas activas: Nacional, Recibido
   Calle 51, Per Cápita. Las demás (Novedades Calle 51, Gestión,
   Pendiente Cross, Resumen IA) se agregarán cuando se reconstruyan. */
(function(){
const INST_CFG={
  sheetId:'1vQlOjv1jBl06nWzYkNt7opdSa6ZrMgPMDonlbnvlCcU',
  url(s){return `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(s)}`;}
};

/* ---------- Estado ---------- */
let NAC=[],NOVNAC=[],RECI=[],PCAP=[];
let instCharts={},instLoaded=false,instLoading=false;
let recVeh='';

/* ---------- Utilidades ---------- */
const COLORS={blue:'#2563EB',green:'#22C55E',yellow:'#EAB308',red:'#EF4444',gray:'#94A3B8',purple:'#A855F7'};
const chartBase={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#94A3B8',font:{family:'Plus Jakarta Sans',size:11.5},padding:14,usePointStyle:true,pointStyle:'circle'}}},scales:{}};
const gridScale={grid:{color:'rgba(148,163,184,.08)'},ticks:{color:'#64748B',font:{family:'Plus Jakarta Sans',size:11}}};
const PAL=['#2563EB','#22C55E','#EAB308','#A855F7','#EF4444','#38bdf8','#fb7185','#0E8A78','#C97B20','#64748B','#f472b6','#14b8a6'];
const palette=n=>{const a=[];for(let i=0;i<n;i++)a.push(PAL[i%PAL.length]);return a;};
const uniq=a=>[...new Set(a.filter(x=>x!=null&&String(x).trim()!==''))];
const ms=id=>MultiSelect.getValues(id);
const pick=(local,fallback)=>local.length?local:fallback;
const num=x=>parseFloat(String(x==null?'':x).replace(/[^0-9.\-]/g,''))||0;
const sortObj=o=>Object.fromEntries(Object.entries(o).sort((a,b)=>b[1]-a[1]));
const groupCount=(arr,key)=>arr.reduce((a,r)=>{const k=key(r)||'—';a[k]=(a[k]||0)+1;return a;},{});
const groupSum=(arr,key,val)=>arr.reduce((a,r)=>{const k=key(r)||'—';a[k]=(a[k]||0)+(val(r)||0);return a;},{});
function groupAvg(arr,key,val){const s={},c={};arr.forEach(r=>{const vv=val(r);if(vv==null||isNaN(vv))return;const k=key(r)||'—';s[k]=(s[k]||0)+vv;c[k]=(c[k]||0)+1;});const o={};Object.keys(s).forEach(k=>{o[k]=s[k]/c[k];});return o;}
const DOW=['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
const DOW_LBL=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const dowIdx=ts=>{if(!ts)return null;const g=new Date(+ts).getDay();return g===0?6:g-1;};
function byDow(arr,valFn){const a=[0,0,0,0,0,0,0];arr.forEach(r=>{const k=dowIdx(r._d);if(k!=null)a[k]+=(valFn?valFn(r):1);});return a;}
const setHTML=(id,html)=>{const e=document.getElementById(id);if(e)e.innerHTML=html;};
const MES_ORDER=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const sortMes=arr=>[...arr].sort((a,b)=>MES_ORDER.indexOf(a)-MES_ORDER.indexOf(b));
const CITY_COLOR={'Bucaramanga':'#2563EB','Cúcuta':'#22C55E','Santa Marta':'#EAB308'};
function parseD(s){const m=String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);if(!m)return null;let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1]);}
function isoWeek(dt){const d=new Date(Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate()));const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);const ys=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil(((d-ys)/86400000+1)/7);}
const weekKey=dt=>dt.getFullYear()+'-S'+String(isoWeek(dt)).padStart(2,'0');
function gradFill(hex){return c=>{const ctx=c.chart.ctx;const g=ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,hex+'66');g.addColorStop(1,hex+'00');return g;};}
const stampNow=()=>new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
function mkChart(id,cfg){const el=document.getElementById(id);if(!el)return;if(instCharts[id]){instCharts[id].destroy();}instCharts[id]=new Chart(el,cfg);}
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
function slope(y){const n=y.length;if(n<2)return 0;const xs=y.map((_,i)=>i);const mx=xs.reduce((a,b)=>a+b,0)/n,my=y.reduce((a,b)=>a+b,0)/n;let nu=0,de=0;for(let i=0;i<n;i++){nu+=(xs[i]-mx)*(y[i]-my);de+=(xs[i]-mx)**2;}return de?nu/de:0;}
const cumplPill=c=>`<span class="pill ${c>=85?'pill-g':c>=70?'pill-y':'pill-r'}">${c}%</span>`;
const BC={base:chartBase,grid:gridScale};
const CO=COLORS;
const legBase={labels:chartBase.plugins.legend.labels};

/* ---------- Parsers ---------- */
function fetchInst(sheet,header){return new Promise((res,rej)=>{Papa.parse(INST_CFG.url(sheet),{download:true,header:header,skipEmptyLines:true,complete:r=>res(r.data),error:rej});});}
function parseHora(s){const m=String(s||'').trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);if(!m)return null;const h=+m[1]+(+m[2])/60+(m[3]?(+m[3])/3600:0);return h>=0&&h<24?h:null;}
function hhmm(h){if(h==null||isNaN(h))return '—';let hh=Math.floor(h),mm=Math.round((h-hh)*60);if(mm===60){hh+=1;mm=0;}return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
function parseNacional(rows){
  const blocks=[{city:'Bucaramanga',off:0},{city:'Cúcuta',off:9},{city:'Santa Marta',off:18}];
  const out=[];
  for(let i=1;i<rows.length;i++){const r=rows[i];if(!r)continue;
    blocks.forEach(b=>{
      const fecha=String(r[b.off]||'').trim();
      if(!/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(fecha))return;
      const ef=num(r[b.off+1]),nv=num(r[b.off+2]),tot=num(r[b.off+3])||(ef+nv);
      const d=parseD(fecha);const horaStr=String(r[b.off+7]||'').trim();
      out.push({city:b.city,fecha,efectivo:ef,novedad:nv,total:tot,mes:String(r[b.off+4]||'').trim().toUpperCase(),
        hora:horaStr,horaH:parseHora(horaStr),
        _d:+(d||0),dow:d?DOW[d.getDay()]:'',week:d?weekKey(d):''});
    });
  }
  return out;
}
function parseNovNac(rows){
  const cities=['Bucaramanga','Cúcuta','Santa Marta'];
  const months=['MAR','ABR','MAY','JUN'];
  const out=[];let ci=-1;
  rows.forEach(r=>{
    if(!r||!r.length)return;
    const first=String(r[0]||'').trim();
    if(first.toUpperCase()==='NOVEDAD'){ci++;return;}
    if(ci<0||ci>=cities.length||!first)return;
    months.forEach((m,j)=>{const val=num(r[1+j]);if(val)out.push({city:cities[ci],novedad:first,mes:m,count:val});});
  });
  return out;
}
function parseRecibido(raw){return raw.map(r=>{
  const fecha=(r.FECHA||'').trim();const d=parseD(fecha);
  return {mes:(r.MES||'').trim().toUpperCase(),fecha,tipo:(r.TIPO||'').trim(),guia:(r['GUÍA']||'').toString().trim(),
    diaSem:(r['DÍA SEMANA']||'').trim(),vehiculo:(r.VEHICULO||'').trim().toUpperCase(),total:num(r.TOTAL)||1,
    _d:+(d||0),week:d?weekKey(d):''};
}).filter(r=>r.fecha);}

/* ---------- PER CÁPITA (costo operativo por entrega) ---------- */
function copNumI(x){var s=String(x==null?'':x).replace(/[^0-9]/g,'');return s?parseInt(s,10):0;}
function parsePercap(raw){return (raw||[]).map(function(r){
  // En la hoja, las columnas "CANT ENTREGAS" y "COSTO" vienen intercambiadas:
  // el costo (con "$") queda bajo CANT ENTREGAS. Detectar el costo por el "$"
  // (o, en su defecto, por magnitud: el costo es mucho mayor que las entregas).
  var v1=String(r['CANT ENTREGAS']==null?'':r['CANT ENTREGAS']),v2=String(r.COSTO==null?'':r.COSTO);
  var costo,ent;
  if(v1.indexOf('$')>=0){costo=copNumI(v1);ent=copNumI(v2);}
  else if(v2.indexOf('$')>=0){costo=copNumI(v2);ent=copNumI(v1);}
  else{var a=copNumI(v1),b=copNumI(v2);costo=Math.max(a,b);ent=Math.min(a,b);}
  var pc=copNumI(r['PER CAPITA']);if(!pc&&ent>0)pc=Math.round(costo/ent);
  return {ciudad:(r.CIUDAD||'').trim(),mes:(r.MES||'').trim().toUpperCase(),
    punto:(r.DROUERIA||r.DROGUERIA||r['DROGUERIA NOMBRE CORTO']||'').trim(),
    entregas:ent,costo:costo,pc:pc};
}).filter(function(x){return x.ciudad||x.punto;});}
function renderPercap(){
  const money=n=>'$ '+Math.round(n||0).toLocaleString('es-CO');
  const tc=s=>s?s.charAt(0)+s.slice(1).toLowerCase():'';
  const st=document.getElementById('ipc-stamp');if(st)st.textContent=stampNow();
  if(!PCAP.length){const k=document.getElementById('ipc-kpi');if(k)k.innerHTML='<div class="ind-loading">Sin datos de Per Cápita — verifica la hoja "PER CAPITA" en el Google Sheet.</div>';return;}
  MultiSelect.setOptions('ipc-fMes',sortMes(uniq(PCAP.map(r=>r.mes))),{placeholder:'Todos',onChange:renderPercap});
  MultiSelect.setOptions('ipc-fCiudad',uniq(PCAP.map(r=>r.ciudad)),{placeholder:'Todas',onChange:renderPercap});
  MultiSelect.setOptions('ipc-fDrog',uniq(PCAP.map(r=>r.punto)),{placeholder:'Todos',onChange:renderPercap});
  const mes=ms('ipc-fMes'),city=ms('ipc-fCiudad'),drog=ms('ipc-fDrog');
  const D=PCAP.filter(r=>(!mes.length||mes.includes(r.mes))&&(!city.length||city.includes(r.ciudad))&&(!drog.length||drog.includes(r.punto)));
  if(!D.length){document.getElementById('ipc-kpi').innerHTML='<div class="ind-loading">Sin datos para los filtros seleccionados</div>';['ipc-mes','ipc-top','ipc-drog','ipc-ciudad','ipc-pcciudad','ipc-entciudad'].forEach(id=>{if(instCharts[id])instCharts[id].destroy();});renderTable('ipc-table',['PUNTO','CIUDAD','MES','Entregas','Costo','Per cápita'],[]);return;}
  const pcP=groupAvg(D,r=>r.punto,r=>r.pc);
  const entriesP=Object.entries(pcP).sort((a,b)=>b[1]-a[1]);
  const topP=entriesP,botP=entriesP.slice().reverse();
  const pcM=groupAvg(D,r=>r.mes,r=>r.pc);
  const costoCity=groupSum(D,r=>r.ciudad,r=>r.costo),entCity=groupSum(D,r=>r.ciudad,r=>r.entregas);
  const totalCosto=D.reduce((a,r)=>a+r.costo,0),totalEnt=D.reduce((a,r)=>a+r.entregas,0);
  const globalPC=totalEnt>0?totalCosto/totalEnt:0;
  const pcCity={};Object.keys(costoCity).forEach(c=>{pcCity[c]=entCity[c]>0?costoCity[c]/entCity[c]:0;});
  kpiCards('ipc-kpi',[
    {l:'Per cápita global prom.',txt:money(globalPC),ic:'fa-coins',c:'yellow'},
    {l:'PC más alto',txt:money(topP[0]?topP[0][1]:0),ic:'fa-arrow-up',c:'red',t:topP[0]?topP[0][0]:'—',up:0},
    {l:'PC más bajo',txt:money(botP[0]?botP[0][1]:0),ic:'fa-arrow-down',c:'green',t:botP[0]?botP[0][0]:'—',up:1},
    {l:'Costo total',txt:money(totalCosto),ic:'fa-dollar-sign',c:'purple'},
    {l:'Total entregas',v:totalEnt,ic:'fa-boxes-stacked',c:'blue'},
    {l:'Puntos de operación',v:uniq(D.map(r=>r.punto)).length,ic:'fa-store',c:'yellow'}
  ]);
  const moneyTipY={callbacks:{label:c=>' '+money(c.parsed.y!=null?c.parsed.y:c.parsed)}};
  const mesL=sortMes(Object.keys(pcM));
  mkChart('ipc-mes',{type:'line',data:{labels:mesL,datasets:[{label:'Per cápita prom.',data:mesL.map(m=>Math.round(pcM[m])),borderColor:CO.yellow,backgroundColor:gradFill('#EAB308'),fill:true,tension:.35,borderWidth:2.6,pointRadius:3}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  const top5=topP.slice(0,5);
  mkChart('ipc-top',{type:'bar',data:{labels:top5.map(e=>e[0]),datasets:[{label:'Per cápita',data:top5.map(e=>Math.round(e[1])),backgroundColor:CO.red,borderRadius:6,maxBarThickness:52}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  const drogArr=topP.slice(0,14);
  mkChart('ipc-drog',{type:'bar',data:{labels:drogArr.map(e=>e[0]),datasets:[{label:'Per cápita',data:drogArr.map(e=>Math.round(e[1])),backgroundColor:palette(drogArr.length),borderRadius:6}]},options:{...BC.base,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+money(c.parsed.x!=null?c.parsed.x:c.parsed)}}},scales:{x:BC.grid,y:{...BC.grid,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});
  const cityArr=Object.entries(costoCity).sort((a,b)=>b[1]-a[1]);
  mkChart('ipc-ciudad',{type:'bar',data:{labels:cityArr.map(e=>e[0]),datasets:[{label:'Costo total',data:cityArr.map(e=>e[1]),backgroundColor:palette(cityArr.length),borderRadius:6,maxBarThickness:66}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  const pcCityArr=Object.entries(pcCity).sort((a,b)=>b[1]-a[1]);
  mkChart('ipc-pcciudad',{type:'bar',data:{labels:pcCityArr.map(e=>e[0]),datasets:[{label:'Per cápita',data:pcCityArr.map(e=>Math.round(e[1])),backgroundColor:palette(pcCityArr.length),borderRadius:6,maxBarThickness:66}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:moneyTipY},scales:{x:BC.grid,y:BC.grid}}});
  const entCityArr=Object.entries(entCity).sort((a,b)=>b[1]-a[1]);
  mkChart('ipc-entciudad',{type:'doughnut',data:{labels:entCityArr.map(e=>e[0]),datasets:[{data:entCityArr.map(e=>e[1]),backgroundColor:palette(entCityArr.length),borderColor:'#0b1120',borderWidth:2}]},options:{...BC.base,plugins:{legend:legBase}}});
  renderTable('ipc-table',['PUNTO','CIUDAD','MES','Entregas','Costo','Per cápita'],D.slice().sort((a,b)=>b.pc-a.pc).map(r=>[r.punto,r.ciudad,tc(r.mes),r.entregas.toLocaleString('es-CO'),money(r.costo),money(r.pc)]));
  const cnt=document.getElementById('ipc-count');if(cnt)cnt.textContent=D.length+' registros';
  const alerta=topP.filter(e=>e[1]>globalPC*1.3);
  const ia=document.getElementById('ipc-ia');if(ia)ia.innerHTML=
    '<b>Per cápita promedio global:</b> '+money(globalPC)+' por entrega · <b>Total entregas:</b> '+totalEnt.toLocaleString('es-CO')+' · <b>Costo total:</b> '+money(totalCosto)+'<br><br>'+
    '<b>🔴 Top 5 puntos más costosos:</b><br>'+topP.slice(0,5).map((e,i)=>{const p=globalPC>0?Math.round((e[1]/globalPC-1)*100):0;return (i+1)+'. '+e[0]+': '+money(e[1])+' ('+(p>=0?'+':'')+p+'% vs promedio)';}).join('<br>')+'<br><br>'+
    '<b>🟢 Top 5 puntos más eficientes:</b><br>'+botP.slice(0,5).map((e,i)=>(i+1)+'. '+e[0]+': '+money(e[1])).join('<br>')+
    (alerta.length?'<br><br><b style="color:#f87171">⚠ Puntos en alerta</b> (per cápita &gt;30% sobre el promedio): '+alerta.length+' punto(s) — revisar volumen y modelo de operación.':'');
}

async function ensureInst(){
  if(instLoaded||instLoading)return;
  instLoading=true;
  ['nac-count','rec-count'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='Cargando datos de Google Sheets…';});
  try{
    const [cn,nn,rc,pc]=await Promise.all([
      fetchInst('CANT NACIONAL',false),
      fetchInst('NOVEDADES NACIONAL',false),
      fetchInst('RECIBIDO CALLE 51',true),
      fetchInst('PER CAPITA',true).catch(()=>[])
    ]);
    NAC=parseNacional(cn);NOVNAC=parseNovNac(nn);RECI=parseRecibido(rc);PCAP=parsePercap(pc);
    instLoaded=true;
    renderNacional();renderRecibido();renderPercap();
    setTimeout(()=>Object.values(instCharts).forEach(ch=>{try{ch.resize();}catch(e){}}),160);
  }catch(e){console.warn('Institucional: fallo de carga',e);const el=document.getElementById('nac-count');if(el)el.textContent='Error al conectar con Google Sheets (verifica que la hoja sea pública: "Cualquiera con el enlace · Lector").';}
  instLoading=false;
}

/* ---------- NACIONAL ---------- */
function renderNacional(){
  if(!NAC.length)return;
  const allCities=uniq(NAC.map(r=>r.city)),allMeses=sortMes(uniq(NAC.map(r=>r.mes)));
  MultiSelect.setOptions('nac-fCity',allCities,{placeholder:'Todas',onChange:renderNacional});
  MultiSelect.setOptions('nac-fMes',allMeses,{placeholder:'Todos',onChange:renderNacional});
  ['nac-dia-city','nac-sem-city','nac-novciu-city','nac-hdia-city'].forEach(id=>MultiSelect.setOptions(id,allCities,{placeholder:'Ciudad: todas',sm:true,onChange:renderNacional}));
  ['nac-dia-mes','nac-sem-mes','nac-novmes-mes','nac-hdia-mes'].forEach(id=>MultiSelect.setOptions(id,allMeses,{placeholder:'Mes: todos',sm:true,onChange:renderNacional}));
  const city=ms('nac-fCity'),mes=ms('nac-fMes');
  document.querySelectorAll('#nac-cityseg .seg-btn').forEach(b=>b.classList.toggle('active',(b.dataset.city||'')===(city.length===1?city[0]:'')));
  const ciuRow=document.getElementById('nac-ciudad-row');if(ciuRow)ciuRow.style.display=city.length?'none':'';
  const D=NAC.filter(r=>(!city.length||city.includes(r.city))&&(!mes.length||mes.includes(r.mes)));
  const ef=D.reduce((a,r)=>a+r.efectivo,0),nv=D.reduce((a,r)=>a+r.novedad,0),tot=D.reduce((a,r)=>a+r.total,0);
  const cumpl=tot?ef/tot*100:0;
  const porFecha=groupSum(D,r=>r.fecha,r=>r.efectivo);
  const pico=Object.entries(porFecha).sort((a,b)=>b[1]-a[1])[0]||['—',0];
  const horasD=D.filter(r=>r.horaH!=null).map(r=>r.horaH);
  const avgHora=horasD.length?horasD.reduce((a,b)=>a+b,0)/horasD.length:null;
  kpiCards('nac-kpi',[
    {l:'Total efectivo',v:ef,ic:'fa-circle-check',c:'green'},
    {l:'Total novedades',v:nv,ic:'fa-triangle-exclamation',c:'red'},
    {l:'Total general',v:tot,ic:'fa-boxes-stacked',c:'blue'},
    {l:'% Cumplimiento',v:cumpl,suf:'%',dec:1,ic:'fa-gauge-high',c:cumpl>=90?'green':cumpl>=80?'yellow':'red',t:cumpl>=90?'Óptimo':'Revisar',up:cumpl>=90?1:0},
    {l:'Hora promedio gral.',txt:hhmm(avgHora),ic:'fa-clock',c:'yellow',t:'Hora militar (24h)',up:1},
    {l:'Ciudades',v:uniq(D.map(r=>r.city)).length,ic:'fa-city',c:'purple'},
    {l:'Día pico',v:pico[1],suf:' ent',ic:'fa-arrow-up-right-dots',c:'green',t:pico[0],up:1}
  ]);
  const cities=city.length?city:uniq(NAC.map(r=>r.city));
  const meses=sortMes(uniq(NAC.map(r=>r.mes)));
  const sumCM=(c,m,f)=>NAC.filter(r=>r.city===c&&r.mes===m).reduce((a,r)=>a+r[f],0);
  mkChart('nac-efmes',{type:'bar',data:{labels:meses,datasets:cities.map(c=>({label:c,data:meses.map(m=>sumCM(c,m,'efectivo')),backgroundColor:CITY_COLOR[c]||CO.gray,borderRadius:6,maxBarThickness:44}))},options:{...BC.base,plugins:{legend:legBase},scales:{x:BC.grid,y:BC.grid}}});
  mkChart('nac-nvmes',{type:'bar',data:{labels:meses,datasets:cities.map(c=>({label:c,data:meses.map(m=>sumCM(c,m,'novedad')),backgroundColor:CITY_COLOR[c]||CO.gray,borderRadius:6,maxBarThickness:44}))},options:{...BC.base,plugins:{legend:legBase},scales:{x:BC.grid,y:BC.grid}}});
  mkChart('nac-ciudad',{type:'bar',data:{labels:cities,datasets:[
    {label:'Efectivo',data:cities.map(c=>D.filter(r=>r.city===c).reduce((a,r)=>a+r.efectivo,0)),backgroundColor:CO.green,borderRadius:6,maxBarThickness:54},
    {label:'Novedades',data:cities.map(c=>D.filter(r=>r.city===c).reduce((a,r)=>a+r.novedad,0)),backgroundColor:CO.red,borderRadius:6,maxBarThickness:54}
  ]},options:{...BC.base,plugins:{legend:legBase},scales:{x:BC.grid,y:BC.grid}}});
  mkChart('nac-cumpl',{type:'bar',data:{labels:cities,datasets:[{data:cities.map(c=>{const cd=D.filter(r=>r.city===c);const t=cd.reduce((a,r)=>a+r.total,0),e=cd.reduce((a,r)=>a+r.efectivo,0);return t?+(e/t*100).toFixed(1):0;}),backgroundColor:cities.map(c=>CITY_COLOR[c]||CO.gray),borderRadius:8,maxBarThickness:70}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:{...BC.grid,suggestedMax:100}}}});
  const diaCity=pick(ms('nac-dia-city'),city),diaMes=pick(ms('nac-dia-mes'),mes);
  const Ddia=NAC.filter(r=>(!diaCity.length||diaCity.includes(r.city))&&(!diaMes.length||diaMes.includes(r.mes)));
  const fechas=uniq(Ddia.map(r=>r.fecha)).sort((a,b)=>(parseD(a)||0)-(parseD(b)||0));
  mkChart('nac-dia',{type:'line',data:{labels:fechas,datasets:[{label:'Efectivo',data:fechas.map(f=>Ddia.filter(r=>r.fecha===f).reduce((a,r)=>a+r.efectivo,0)),borderColor:CO.blue,backgroundColor:gradFill('#2563EB'),fill:true,tension:.35,borderWidth:2.4,pointRadius:2}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  const semCity=pick(ms('nac-sem-city'),city),semMes=pick(ms('nac-sem-mes'),mes);
  const Dsem=NAC.filter(r=>(!semCity.length||semCity.includes(r.city))&&(!semMes.length||semMes.includes(r.mes)));
  mkChart('nac-sem',{type:'bar',data:{labels:DOW_LBL,datasets:[{label:'Total movido',data:byDow(Dsem,r=>r.total),backgroundColor:CO.purple,borderRadius:7,maxBarThickness:54}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  /* ----- Tiempos (HORA PROMEDIO) ----- */
  const horaTip={callbacks:{label:c=>' '+hhmm(c.parsed.y!=null?c.parsed.y:c.parsed)}};
  const horaY={...BC.grid,ticks:{...(BC.grid.ticks||{}),callback:v=>hhmm(v)}};
  const avgOf=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
  const hdiaCity=pick(ms('nac-hdia-city'),city),hdiaMes=pick(ms('nac-hdia-mes'),mes);
  const Dh=NAC.filter(r=>r.horaH!=null&&(!hdiaCity.length||hdiaCity.includes(r.city))&&(!hdiaMes.length||hdiaMes.includes(r.mes)));
  const hfechas=uniq(Dh.map(r=>r.fecha)).sort((a,b)=>(parseD(a)||0)-(parseD(b)||0));
  const hpd=groupAvg(Dh,r=>r.fecha,r=>r.horaH);
  setHTML('nac-hdia-sub','Promedio general: <b style="color:#facc15">'+hhmm(avgOf(Dh.map(r=>r.horaH)))+'</b> (formato militar 24h)');
  mkChart('nac-hdia',{type:'line',data:{labels:hfechas,datasets:[{label:'Hora promedio',data:hfechas.map(f=>hpd[f]!=null?+hpd[f].toFixed(3):null),borderColor:CO.yellow,backgroundColor:gradFill('#EAB308'),fill:true,tension:.35,borderWidth:2.4,pointRadius:2,spanGaps:true}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:horaTip},scales:{x:BC.grid,y:horaY}}});
  const hcCities=city.length?city:uniq(NAC.map(r=>r.city));
  const Dhc=NAC.filter(r=>r.horaH!=null&&(!mes.length||mes.includes(r.mes)));
  const hpc=groupAvg(Dhc,r=>r.city,r=>r.horaH);
  setHTML('nac-hciu-sub','Promedio general: <b style="color:#facc15">'+hhmm(avgOf(Dhc.map(r=>r.horaH)))+'</b> (formato militar 24h)');
  setHTML('nac-hmes-sub','Promedio general: <b style="color:#facc15">'+hhmm(avgOf(NAC.filter(r=>r.horaH!=null&&(!mes.length||mes.includes(r.mes))).map(r=>r.horaH)))+'</b> · por ciudad (24h)');
  mkChart('nac-hciu',{type:'bar',data:{labels:hcCities,datasets:[{data:hcCities.map(c=>hpc[c]!=null?+hpc[c].toFixed(3):0),backgroundColor:hcCities.map(c=>CITY_COLOR[c]||CO.gray),borderRadius:8,maxBarThickness:70}]},options:{...BC.base,plugins:{legend:{display:false},tooltip:horaTip},scales:{x:BC.grid,y:horaY}}});
  mkChart('nac-hmes',{type:'bar',data:{labels:meses,datasets:hcCities.map(c=>({label:c,data:meses.map(m=>{const md=NAC.filter(r=>r.city===c&&r.mes===m&&r.horaH!=null);return md.length?+(md.reduce((a,r)=>a+r.horaH,0)/md.length).toFixed(3):null;}),backgroundColor:CITY_COLOR[c]||CO.gray,borderRadius:6,maxBarThickness:40}))},options:{...BC.base,plugins:{legend:legBase,tooltip:horaTip},scales:{x:BC.grid,y:horaY}}});
  const novD=NOVNAC.filter(r=>!city.length||city.includes(r.city));
  const novmesMes=pick(ms('nac-novmes-mes'),mes);
  const mesesNov=['MAR','ABR','MAY','JUN'].filter(m=>!novmesMes.length||novmesMes.includes(m));
  const totNovmes=t=>novD.filter(r=>r.novedad===t&&mesesNov.indexOf(r.mes)>=0).reduce((a,r)=>a+r.count,0);
  const tipos=uniq(novD.map(r=>r.novedad)).sort((a,b)=>totNovmes(b)-totNovmes(a));
  mkChart('nac-novmes',{type:'bar',data:{labels:tipos,datasets:mesesNov.map((m,i)=>({label:m,data:tipos.map(t=>novD.filter(r=>r.novedad===t&&r.mes===m).reduce((a,r)=>a+r.count,0)),backgroundColor:PAL[i],borderRadius:5}))},options:{...BC.base,indexAxis:'y',plugins:{legend:legBase},scales:{x:BC.grid,y:{...BC.grid,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});
  const novciuCity=pick(ms('nac-novciu-city'),city);
  const citiesNov=novciuCity.length?novciuCity:uniq(NOVNAC.map(r=>r.city));
  const totNovciu=t=>NOVNAC.filter(r=>r.novedad===t&&citiesNov.indexOf(r.city)>=0&&(!mes.length||mes.includes(r.mes))).reduce((a,r)=>a+r.count,0);
  const tiposAll=uniq(NOVNAC.map(r=>r.novedad)).sort((a,b)=>totNovciu(b)-totNovciu(a));
  mkChart('nac-novciu',{type:'bar',data:{labels:tiposAll,datasets:citiesNov.map(c=>({label:c,data:tiposAll.map(t=>NOVNAC.filter(r=>r.novedad===t&&r.city===c&&(!mes.length||mes.includes(r.mes))).reduce((a,r)=>a+r.count,0)),backgroundColor:CITY_COLOR[c]||CO.gray,borderRadius:5}))},options:{...BC.base,indexAxis:'y',plugins:{legend:legBase},scales:{x:BC.grid,y:{...BC.grid,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});
  renderTable('nac-table',['CIUDAD','FECHA','MES','EFECTIVO','NOVEDAD','TOTAL','% CUMPL'],
    [...D].sort((a,b)=>(b._d||0)-(a._d||0)).slice(0,600).map(r=>[r.city,r.fecha,r.mes,r.efectivo,r.novedad,r.total,cumplPill(r.total?+(r.efectivo/r.total*100).toFixed(0):0)]));
  const cEl=document.getElementById('nac-count');if(cEl)cEl.textContent=D.length.toLocaleString('es')+' registros'+(D.length>600?' (mostrando 600)':'');
  const ia=iaNacional();setHTML('nac-ia-r',ia.r||'Sin datos.');setHTML('nac-ia-s',ia.s||'—');setHTML('nac-ia-a',ia.a||'—');
  const sEl=document.getElementById('nac-stamp');if(sEl)sEl.textContent=stampNow();
}

/* ---------- RECIBIDO CALLE 51 ---------- */
function renderRecibido(){
  if(!RECI.length)return;
  const allMeses=sortMes(uniq(RECI.map(r=>r.mes)));
  MultiSelect.setOptions('rec-fMes',allMeses,{placeholder:'Todos',onChange:renderRecibido});
  MultiSelect.setOptions('rec-fTipo',uniq(RECI.map(r=>r.tipo)),{placeholder:'Todos',onChange:renderRecibido});
  ['rec-dia-mes','rec-sem-mes','rec-tipo-mes'].forEach(id=>MultiSelect.setOptions(id,allMeses,{placeholder:'Mes: todos',sm:true,onChange:renderRecibido}));
  const mes=ms('rec-fMes'),tipo=ms('rec-fTipo');
  const D=RECI.filter(r=>(!recVeh||r.vehiculo===recVeh)&&(!mes.length||mes.includes(r.mes))&&(!tipo.length||tipo.includes(r.tipo)));
  const Bveh=RECI.filter(r=>(!recVeh||r.vehiculo===recVeh)&&(!tipo.length||tipo.includes(r.tipo)));
  const Bmt=RECI.filter(r=>(!mes.length||mes.includes(r.mes))&&(!tipo.length||tipo.includes(r.tipo)));
  const dias=uniq(D.map(r=>r.fecha)).length;
  kpiCards('rec-kpi',[
    {l:'Total guías',v:D.length,ic:'fa-barcode',c:'blue'},
    {l:'Tipos',v:uniq(D.map(r=>r.tipo)).length,ic:'fa-tags',c:'purple'},
    {l:'Días',v:dias,ic:'fa-calendar-day',c:'yellow'},
    {l:'Promedio/día',v:dias?D.length/dias:0,dec:1,ic:'fa-chart-simple',c:'green'},
    {l:'Motorizado',v:Bmt.filter(r=>r.vehiculo==='MOTORIZADO').length,ic:'fa-motorcycle',c:'blue'},
    {l:'Carry',v:Bmt.filter(r=>r.vehiculo==='CARRY').length,ic:'fa-truck',c:'green'}
  ]);
  const pm=groupCount(D,r=>r.mes);const meses=sortMes(Object.keys(pm));
  mkChart('rec-mes',{type:'bar',data:{labels:meses,datasets:[{data:meses.map(m=>pm[m]),backgroundColor:CO.blue,borderRadius:8,maxBarThickness:60}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  const diaMes=pick(ms('rec-dia-mes'),mes);const Ddia=Bveh.filter(r=>!diaMes.length||diaMes.includes(r.mes));
  const fechas=uniq(Ddia.map(r=>r.fecha)).sort((a,b)=>(parseD(a)||0)-(parseD(b)||0));const pf=groupCount(Ddia,r=>r.fecha);
  mkChart('rec-dia',{type:'line',data:{labels:fechas,datasets:[{label:'Guías',data:fechas.map(f=>pf[f]),borderColor:CO.green,backgroundColor:gradFill('#22C55E'),fill:true,tension:.35,borderWidth:2.4,pointRadius:2}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  const semMes=pick(ms('rec-sem-mes'),mes);const Dsem=Bveh.filter(r=>!semMes.length||semMes.includes(r.mes));
  mkChart('rec-sem',{type:'bar',data:{labels:DOW_LBL,datasets:[{label:'Guías',data:byDow(Dsem),backgroundColor:CO.purple,borderRadius:7,maxBarThickness:54}]},options:{...BC.base,plugins:{legend:{display:false}},scales:{x:BC.grid,y:BC.grid}}});
  const tipoMes=pick(ms('rec-tipo-mes'),mes);const Dtipo=Bveh.filter(r=>!tipoMes.length||tipoMes.includes(r.mes));
  const pt=sortObj(groupCount(Dtipo,r=>r.tipo));
  mkChart('rec-tipo',{type:'bar',data:{labels:Object.keys(pt),datasets:[{data:Object.values(pt),backgroundColor:palette(Object.keys(pt).length),borderRadius:6}]},options:{...BC.base,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:BC.grid,y:{...BC.grid,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});
  renderTable('rec-table',['MES','FECHA','TIPO','GUÍA','DÍA SEMANA','VEHÍCULO'],
    [...D].sort((a,b)=>(b._d||0)-(a._d||0)).slice(0,500).map(r=>[r.mes,r.fecha,r.tipo,r.guia,r.diaSem,r.vehiculo]));
  const cEl=document.getElementById('rec-count');if(cEl)cEl.textContent=D.length.toLocaleString('es')+' guías'+(D.length>500?' (mostrando 500)':'');
  const ia=iaCalle51();setHTML('rec-ia-r',ia.r||'Sin datos.');setHTML('rec-ia-s',ia.s||'—');setHTML('rec-ia-a',ia.a||'—');
  const sEl=document.getElementById('rec-stamp');if(sEl)sEl.textContent=stampNow();
}

/* ---------- MOTOR IA (resúmenes ejecutivos de Nacional y Calle 51) ---------- */
function trendWord(x){return x>0.5?'una <b style="color:#4ade80">mejora</b>':x<-0.5?'una <b style="color:#f87171">caída</b>':'<b>estabilidad</b>';}
function iaNacional(){
  if(!NAC.length)return{r:'<p>Sin datos nacionales.</p>',s:'',a:''};
  const cities=uniq(NAC.map(r=>r.city));
  const byCity=cities.map(c=>{const cd=NAC.filter(r=>r.city===c);const e=cd.reduce((a,r)=>a+r.efectivo,0),n=cd.reduce((a,r)=>a+r.novedad,0),t=cd.reduce((a,r)=>a+r.total,0);return{c,e,n,t,cumpl:t?e/t*100:0};});
  const ef=byCity.reduce((a,x)=>a+x.e,0),nv=byCity.reduce((a,x)=>a+x.n,0),tot=byCity.reduce((a,x)=>a+x.t,0);
  const cumpl=tot?ef/tot*100:0;
  const bestCity=[...byCity].sort((a,b)=>b.cumpl-a.cumpl)[0],worstCity=[...byCity].sort((a,b)=>a.cumpl-b.cumpl)[0];
  const topNov=sortObj(groupSum(NOVNAC,r=>r.novedad,r=>r.count));
  const topNovE=Object.entries(topNov)[0]||['—',0];
  const sem=groupSum(NAC,r=>r.week,r=>r.total);const semVals=Object.keys(sem).filter(k=>k&&k!=='—').sort().map(k=>sem[k]);
  const tr=slope(semVals);
  const r=`<h4>Resumen ejecutivo · Nacional</h4>
    <p>Se gestionaron <b>${tot.toLocaleString('es')}</b> envíos en ${cities.length} ciudades: <b>${ef.toLocaleString('es')}</b> efectivos y <b>${nv.toLocaleString('es')}</b> novedades, con un <b>cumplimiento global de <span style="color:${cumpl>=90?'#4ade80':cumpl>=80?'#facc15':'#f87171'}">${cumpl.toFixed(1)}%</span></b>. El volumen semanal muestra ${trendWord(tr)}.</p>
    <p>Mejor ciudad en cumplimiento: <b>${bestCity.c}</b> (${bestCity.cumpl.toFixed(1)}%). La de mayor oportunidad: <b>${worstCity.c}</b> (${worstCity.cumpl.toFixed(1)}%). La novedad más frecuente a nivel nacional es <b>${topNovE[0]}</b> (${topNovE[1]} casos).</p>`;
  const s=`<ul>
    <li>Enfocar plan de mejora en <b>${worstCity.c}</b>, la ciudad con menor cumplimiento (${worstCity.cumpl.toFixed(1)}%).</li>
    <li>Atacar la causa raíz de <b>${topNovE[0]}</b>, principal motivo de novedad — depurar bases de direcciones y confirmar datos antes del despacho.</li>
    <li>Replicar las buenas prácticas de <b>${bestCity.c}</b> en el resto de ciudades.</li>
    <li>${tr>0.5?'El volumen crece: anticipar recurso para sostener el nivel de servicio.':tr<-0.5?'El volumen decrece: revisar demanda y estacionalidad.':'Volumen estable: mantener la planeación.'}</li></ul>`;
  const a=`<ul>
    ${cumpl<80?'<li><span class="pill pill-r">Crítico</span> Cumplimiento nacional por debajo del 80%.</li>':''}
    ${worstCity.cumpl<80?`<li><span class="pill pill-y">Atención</span> ${worstCity.c} con cumplimiento de ${worstCity.cumpl.toFixed(1)}%.</li>`:''}
    ${cumpl>=90?'<li><span class="pill pill-g">OK</span> Cumplimiento nacional en nivel óptimo.</li>':''}</ul>`;
  return{r,s,a};
}
function iaCalle51(){
  const totRec=RECI.length;
  const topTipo=Object.entries(sortObj(groupCount(RECI,r=>r.tipo)))[0]||['—',0];
  const mot=RECI.filter(r=>r.vehiculo==='MOTORIZADO').length,car=RECI.filter(r=>r.vehiculo==='CARRY').length;
  const r=`<h4>Resumen ejecutivo · Calle 51</h4>
    <p>Se recibieron <b>${totRec.toLocaleString('es')}</b> guías (${mot.toLocaleString('es')} motorizado, ${car.toLocaleString('es')} carry). Tipo de guía dominante: <b>${topTipo[0]}</b>.</p>`;
  const s=`<ul>
    <li>Balancear la carga entre motorizado (${mot.toLocaleString('es')}) y carry (${car.toLocaleString('es')}) según volumen por zona.</li></ul>`;
  const a=`<ul><li><span class="pill pill-g">OK</span> Recepción de guías dentro de los parámetros normales.</li></ul>`;
  return{r,s,a};
}

/* ---------- Wiring ---------- */
const INST_RENDER={'inst-nacional':renderNacional,'inst-recibido':renderRecibido,'inst-percapita':renderPercap};
document.querySelectorAll('.nav-item[data-view^="inst-"]').forEach(n=>n.addEventListener('click',()=>{
  ensureInst();
  if(!instLoaded)return;
  const fn=INST_RENDER[n.dataset.view];
  if(fn){try{fn();}catch(e){console.warn('re-render',e);}}
  setTimeout(()=>Object.values(instCharts).forEach(c=>{try{c.resize();}catch(e){}}),60);
}));
// Nacional (los MultiSelect ya re-renderizan solos al cambiar — ver onChange en setOptions)
const nacR=document.getElementById('nac-reset');if(nacR)nacR.addEventListener('click',()=>{['nac-fCity','nac-fMes','nac-dia-city','nac-dia-mes','nac-sem-city','nac-sem-mes','nac-novmes-mes','nac-novciu-city','nac-hdia-city','nac-hdia-mes'].forEach(id=>MultiSelect.clear(id));renderNacional();});
document.querySelectorAll('#nac-cityseg .seg-btn').forEach(b=>b.addEventListener('click',()=>{MultiSelect.setSelected('nac-fCity',b.dataset.city?[b.dataset.city]:[]);renderNacional();}));
// Recibido
const recR=document.getElementById('rec-reset');if(recR)recR.addEventListener('click',()=>{['rec-fMes','rec-fTipo','rec-dia-mes','rec-sem-mes','rec-tipo-mes'].forEach(id=>MultiSelect.clear(id));renderRecibido();});
document.querySelectorAll('#rec-toggle .seg-btn').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#rec-toggle .seg-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');recVeh=b.dataset.veh;renderRecibido();}));
// Per Cápita
const ipcR=document.getElementById('ipc-reset');if(ipcR)ipcR.addEventListener('click',()=>{['ipc-fMes','ipc-fCiudad','ipc-fDrog'].forEach(id=>MultiSelect.clear(id));renderPercap();});

window.ensureInst=ensureInst;
})();
