/* ===================== MOTOR INDICADORES MENSUALES =====================
   Port fiel del módulo "Indicadores Mensuales" del dashboard anterior
   (index.html raíz): comparativo 2025 vs 2026 para Cafam Comercial,
   Institucional y Biológicos + Área Administrativa (organigrama).
   Se abre como modal desde el botón de la barra inferior (junto a
   "Maryuri López"), no como pestaña del sidebar. Fuente: Google Sheet
   propio de indicadores (hojas COMERCIAL, INSTITUCIONAL, BIOLOGICOS,
   EVIDENCIAS, AREA ADMINISTRATIVA), leído por nombre vía gviz. */
(function(){
const IND_CFG={sheetId:'1tgl1BWOeyDLo02-djSMUZ6bUWaRJ8ExKgmgAnOeNO40',
  url(s){return `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(s)}`;}};
let indLoaded=false,indLoading=false;const indCharts={};
const DATA={};
const MES=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const mi=m=>MES.indexOf(String(m||'').trim().toUpperCase());
const cell=(r,i)=>{const v=r&&r[i];return v==null?'':String(v).trim();};
const iNum=v=>{const s=String(v==null?'':v).replace(/[^0-9\-]/g,'');return (s===''||s==='-')?null:parseInt(s,10);};
const pNum=v=>{const m=String(v==null?'':v).replace(/\./g,'').replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?parseFloat(m[0]):null;};
const yr=v=>{const m=String(v||'').match(/20\d\d/);return m?+m[0]:null;};
const isConc=e=>{const u=String(e||'').trim().toUpperCase();return u==='CONCILIADO'||u==='CONSOLIDADO';};
const PAL=['#2563EB','#22C55E','#EAB308','#A855F7','#EF4444','#38bdf8','#fb7185','#0E8A78','#C97B20','#64748B','#f472b6','#14b8a6'];
const palette=n=>{const a=[];for(let i=0;i<n;i++)a.push(PAL[i%PAL.length]);return a;};
const CO={blue:'#2563EB',green:'#22C55E',yellow:'#EAB308',red:'#EF4444',gray:'#94A3B8',purple:'#A855F7'};
const BASE={responsive:true,maintainAspectRatio:false,interaction:{mode:'nearest',intersect:false},plugins:{legend:{labels:{color:'#94A3B8',font:{family:'Plus Jakarta Sans',size:11.5},padding:14,usePointStyle:true,pointStyle:'circle'}},tooltip:{intersect:false,mode:'nearest'}},scales:{}};
const GRID={grid:{color:'rgba(148,163,184,.08)'},ticks:{color:'#64748B',font:{family:'Plus Jakarta Sans',size:11}}};
const C25='#64748b',LEG={labels:{color:'#94A3B8',font:{size:11},boxWidth:12}};
const money=x=>x==null?'—':'$ '+Math.round(x).toLocaleString('es-CO');
const n0=x=>x==null?'—':x.toLocaleString('es-CO');
const p1=x=>x==null?'—':x.toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
function mkc(id,cfg){const el=document.getElementById(id);if(!el)return;if(indCharts[id]){indCharts[id].destroy();}indCharts[id]=new Chart(el,cfg);}
function tbl(id,headers,rows){const t=document.getElementById(id);if(!t)return;if(!rows||!rows.length){t.innerHTML='<thead><tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody><tr><td colspan="'+headers.length+'" style="text-align:center;color:var(--text-soft);padding:18px">Sin datos cargados en el periodo</td></tr></tbody>';return;}t.innerHTML='<thead><tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${c==null?'':c}</td>`).join('')+'</tr>').join('')+'</tbody>';}
function emptyIf(id,empty,msg){if(empty){const el=document.getElementById(id);if(el){const w=el.closest('.chart-wrap')||el.parentElement;if(w)w.innerHTML='<div class="ind-loading">'+(msg||'Sin datos cargados en el periodo')+'</div>';}return true;}return false;}
const card=(t,s,id,h)=>`<div class="card"><div class="card-h"><div><h3>${t}</h3>${s?`<div class="sub">${s}</div>`:''}</div></div><div class="card-body"><div class="chart-wrap ${h||'lg'}"><canvas id="${id}"></canvas></div></div></div>`;
const tcard=(t,s,id)=>`<div class="card"><div class="card-h"><div><h3>${t}</h3>${s?`<div class="sub">${s}</div>`:''}</div></div><div class="card-body"><div class="ins-table-wrap"><table class="ins-table" id="${id}"></table></div></div></div>`;
const secT=(ic,t)=>`<div class="ind-sec-title"><i class="fa-solid ${ic}"></i> ${t}</div>`;
function cmpCard(label,a,b,fmt){fmt=fmt||n0;
  const va=(a!=null&&b!=null&&a!==0)?((b-a)/Math.abs(a)*100):null;
  const cls=va==null?'cc-fl':va>0?'cc-up':va<0?'cc-dn':'cc-fl',ar=va==null?'':va>0?'▲':va<0?'▼':'■';
  return `<div class="cmp-card"><div class="cc-l">${label}</div>
    <div class="cc-rows"><div><div class="cc-y">2025</div><div class="cc-v" style="color:#94a3b8">${fmt(a)}</div></div>
    <div><div class="cc-y">2026</div><div class="cc-v" style="color:#60a5fa">${fmt(b)}</div></div></div>
    <div class="cc-var ${cls}">${ar} ${va==null?'s/d':(va>0?'+':'')+va.toFixed(1)+'% vs 2025'}</div></div>`;
}
function hero(ic,grad,title,desc,meta){
  return `<div class="ind-hero"><div class="ind-hero-top"><div class="ind-hero-ic" style="background:${grad}"><i class="fa-solid ${ic}"></i></div>
    <div><h2>${title}</h2><span class="ind-badge">Comparativo mensual 2025 vs 2026</span></div></div>
    <div class="ind-desc">${desc}</div><div class="ind-meta">${meta}</div></div>`;
}
/* ---------- Parsers ---------- */
function pReg(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const a=yr(cell(r,o)),m=cell(r,o+1).toUpperCase();if(!a||mi(m)<0)continue;
  out.push({anio:a,mes:m,entregado:iNum(r[o+2]),pctEnt:pNum(r[o+3]),cancelado:iNum(r[o+4]),pctCanc:pNum(r[o+5]),conc:isConc(cell(r,o+6))});}return out;}
function pFact(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const m=cell(r,o).toUpperCase();if(mi(m)<0)continue;
  const v25=iNum(r[o+1]),v26=iNum(r[o+2]);let va=iNum(r[o+3]);if(va==null&&v25!=null&&v26!=null)va=v26-v25;
  const pctNum=(v25!=null&&v25!==0&&va!=null)?(va/Math.abs(v25)*100):null;
  out.push({mes:m,v2025:v25,v2026:v26,variacion:va,pctTxt:cell(r,o+4),pctNum,conc:isConc(cell(r,o+5))});}return out;}
function pNov(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const nv=cell(r,o+2);if(!nv)continue;
  out.push({anio:cell(r,o),mes:cell(r,o+1).toUpperCase(),novedad:nv,cant:iNum(r[o+3]),pct:cell(r,o+4)});}return out;}
function pBioReg(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const m=cell(r,o).toUpperCase();if(mi(m)<0)continue;
  out.push({mes:m,v2025:iNum(r[o+1]),v2026:iNum(r[o+2]),variacion:iNum(r[o+3]),conc:isConc(cell(r,o+4))});}return out;}
function pCumpl(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const a=yr(cell(r,o)),m=cell(r,o+1).toUpperCase();if(!a||mi(m)<0)continue;
  out.push({anio:a,mes:m,entregado:pNum(r[o+2]),cancelado:pNum(r[o+3]),conc:isConc(cell(r,o+4))});}return out;}
/* Cumplimiento de ingreso (carrys) — Biológicos */
function pRutaIng(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const m=cell(r,o).toUpperCase(),ruta=cell(r,o+1);if(mi(m)<0||!ruta)continue;
  out.push({mes:m,ruta,aTiempo:iNum(r[o+2]),aTiempoPct:pNum(r[o+3]),retraso:iNum(r[o+4]),retrasoPct:pNum(r[o+5])});}return out;}
function pCantIng(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const m=cell(r,o).toUpperCase();if(mi(m)<0)continue;
  out.push({mes:m,aTiempo:iNum(r[o+1]),retraso:iNum(r[o+2]),total:iNum(r[o+3])});}return out;}
function pPlanta(rows,o,withModel){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const c=cell(r,o),p=cell(r,o+1);if(!c||!p)continue;
  out.push({ciudad:c,punto:p,cant:iNum(r[o+2]),modelo:withModel?cell(r,o+3):''});}return out;}
function durMin(s){const m=String(s||'').match(/(\d+):(\d{2}):(\d{2})/);if(!m)return null;return (+m[1])*60+(+m[2])+(+m[3])/60;}
function fmtDur(min){if(min==null||isNaN(min))return '—';const tot=Math.round(min*60);const h=Math.floor(tot/3600),m=Math.floor((tot%3600)/60),s=tot%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function pTiempos(rows){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const m=cell(r,27).toUpperCase();if(mi(m)<0)continue;
  out.push({anio:yr(cell(r,13)),mes:m,c1:cell(r,28),c2:cell(r,29),c3:cell(r,30),c4:cell(r,31),otros:cell(r,32),total:cell(r,33),totMin:durMin(cell(r,33)),conc:isConc(cell(r,34))});}return out;}
function pHist(rows,o){const out=[];for(let i=2;i<rows.length;i++){const r=rows[i];if(!r)continue;
  const f=cell(r,o+2);if(!f)continue;
  out.push({anio:cell(r,o),mes:cell(r,o+1),fecha:f,mod:cell(r,o+3)});}return out;}
function pEvid(rows){const out=[];if(!rows||!rows.length)return out;
  let h=-1;for(let i=0;i<Math.min(rows.length,6);i++){if((rows[i]||[]).some(c=>String(c).trim().toUpperCase()==='SEGMENTO')){h=i;break;}}
  if(h<0)return out;const hd=(rows[h]||[]).map(c=>String(c||'').trim().toUpperCase());
  const ix=(...nn)=>{for(const n of nn){const j=hd.indexOf(n);if(j>=0)return j;}return -1;};
  const iS=ix('SEGMENTO'),iA=ix('AÑO','ANO'),iM=ix('MES'),iT=ix('TITULO','TÍTULO','TITULO'),iU=ix('URL','ENLACE','LINK'),iV=ix('VARIACION','VARIACIÓN');
  for(let i=h+1;i<rows.length;i++){const r=rows[i];if(!r)continue;
    let seg=String(r[iS]||'').trim().toLowerCase();const url=iU>=0?String(r[iU]||'').trim():'';
    if(!seg||!url)continue;
    if(seg.indexOf('biol')>=0)seg='biologicos';else if(seg.indexOf('institu')>=0)seg='institucional';else if(seg.indexOf('comerc')>=0)seg='comercial';
    out.push({seg,anio:iA>=0?String(r[iA]||'').trim():'',mes:iM>=0?String(r[iM]||'').trim().toUpperCase():'',titulo:iT>=0?String(r[iT]||'').trim():'',url,variacion:iV>=0?String(r[iV]||'').trim():''});}
  return out;}
/* ---------- Helpers de render ---------- */
const monthsOf=arr=>[...new Set(arr.map(x=>x.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));
const regVal=(reg,m,y,f)=>{const r=reg.find(x=>x.mes===m&&x.anio===y);return r?r[f]:null;};
const lastMes=(reg)=>{const ms=monthsOf((reg||[]).filter(r=>r.anio===2026&&r.conc&&r.entregado!=null));return ms.length?ms[ms.length-1]:(monthsOf((reg||[]).filter(r=>r.conc)).slice(-1)[0]||null);};
function novTop(nov){const by={};nov.forEach(n=>{if(n.cant!=null)by[n.novedad]=(by[n.novedad]||0)+n.cant;});return Object.entries(by).sort((a,b)=>b[1]-a[1]);}
/* ---- Responsable de cada novedad: QUICK · CAFAM · CLIENTE ----
   Editable: agrega/mueve novedades aquí. Clave en MAYÚSCULAS exactas del Sheet. */
const RESP_MAP={
  'FALLA MECANICA':'Quick','AUSENCIA':'Quick','AUSENCIAS':'Quick','RETRASO':'Quick','RETRASOS':'Quick',
  'ABANDONO':'Quick','INCUMPLIMIENTO':'Quick','MALA PRESENTACION':'Quick','NO GESTIONADO POR TIEMPO':'Quick',
  'CLIENTE CANCELA POR DEMORA EN LA ENTREGA':'Quick','NEVERA GESTIONADA DÍA 1':'Quick','NEVERA GESTIONADA DÍA 2':'Quick','NEVERA GESTION DÍA 3':'Quick',
  'RECLAMO':'Quick','SOLICITUD':'Quick','CLIENTE NO LO PUEDE ESPERAR':'Quick',
  'MEDICAMENTOS NO DISPONIBLES':'Cafam','MEDICAMENTOS INCOMPLETOS':'Cafam','ERROR ASESOR':'Cafam','ERROR DE CREACION':'Cafam','ERROR DE SISTEMAS':'Cafam',
  'DIRECCION ERRADA':'Cafam','DIRECCION INCOMPLETA':'Cafam','CANCELACION POR GUIA SIN COBERTURA':'Cafam','CANCELACION POR GUIA DUPLICADA':'Cafam',
  'ENTRAGADO EN PUNTO CAFAM':'Cafam','NOVEDAD TRANSFERENCIA':'Cafam','CANCELACION POR ZONA ROJA':'Cafam','ZONA ROJA':'Cafam',
  'CLIENTE YA NO DESEA EL DOMICILIO':'Cliente','CLIENTE NO CONTESTA':'Cliente','CLIENTE COMPRO PRODUCTO EN OTRA CADENA':'Cliente','CLIENTE COMPRO POR OTRO CANAL':'Cliente',
  'ERROR DEL CLIENTE EN SOLICITUD DE PRODUCTO':'Cliente','CLIENTE NO TIENE DINERO PARA PAGAR':'Cliente','NO CUENTA CON MEDIO DE PAGO':'Cliente',
  'CLIENTE NO LO REQUIERE POR CAMBIO DE FORMULA MEDICA':'Cliente','NO SE ENCUENTRA EL USUARIO':'Cliente','NADIE PARA RECIBIR':'Cliente','NADIE PARA RECIBIR 2DA VISITA':'Cliente',
  'CLIENTE NO RESIDE':'Cliente','RECHAZADO POR EL USUARIO':'Cliente'
};
const RESP_COL={Quick:'#2563EB',Cafam:'#A855F7',Cliente:'#EAB308','Sin clasificar':'#94A3B8'};
function novResp(nv){const k=String(nv||'').trim().toUpperCase();if(RESP_MAP[k])return RESP_MAP[k];
  if(/CLIENTE|USUARIO/.test(k))return 'Cliente';
  if(/CAFAM|MEDICAMENTO|ASESOR|SISTEMA|DIRECCION|GUIA|CREACION|TRANSFERENCIA|COBERTURA/.test(k))return 'Cafam';
  if(/FALLA|AUSENC|RETRAS|DEMORA|ABANDONO|INCUMPLIMIENTO|MENSAJERO|RUTA|NEVERA|GESTIONADO/.test(k))return 'Quick';
  return 'Sin clasificar';}
function respBreakdown(nov){const rc={};nov.forEach(n=>{if(n.cant!=null){const r=novResp(n.novedad);rc[r]=(rc[r]||0)+n.cant;}});return rc;}
function plantaKpis(planta){const pts=planta.length,cant=planta.reduce((a,p)=>a+(p.cant||0),0),ciu=new Set(planta.map(p=>p.ciudad)).size;return {pts,cant,ciu};}

/* ============ Motor v2: sub-pestañas, filtros, resumen, evidencias ============ */
const SEG={
 comercial:{body:'indc-body',title:'Cafam Comercial',ic:'fa-store',grad:'linear-gradient(135deg,#2563EB,#1d4ed8)',contrato:'20180123',otrosi:'27/05/2026',
   desc:'Servicio integral de domicilios: recibo, conducción y entrega de medicamentos, insumos, dispositivos médicos y documentos en los domicilios de los usuarios, a nivel local y nacional.',
   tabs:['portada','registros','novedades','tiempos','facturacion','cobertura','historico','evidencias']},
 institucional:{body:'indi-body',title:'Cafam Institucional & Adulto Mayor',ic:'fa-building-columns',grad:'linear-gradient(135deg,#0E8A78,#074E44)',contrato:'20180123',otrosi:'27/05/2026',
   desc:'Recepción de servicios a partir de los pendientes emitidos por los convenios de Cafam; se suben a la plataforma vía Call y se asignan a ruta según disponibilidad y alistamiento de la farmacia.',
   tabs:['portada','registros','novedades','facturacion','cobertura','historico','evidencias']},
 biologicos:{body:'indb-body',title:'Cafam Biológicos',ic:'fa-flask-vial',grad:'linear-gradient(135deg,#A855F7,#7c3aed)',contrato:'20190233',otrosi:'27/05/2026',
   desc:'Transporte de muestras biológicas desde las IPS de Cafam hasta la central de procesamiento, con cadena de frío (neveras con geles congelados y control de temperatura) y recolección de residuos.',
   tabs:['portada','registros','novedades','facturacion','carrys','evidencias']}
};
const TLBL={portada:['Portada','fa-house-chimney'],registros:['Registros y efectividad','fa-chart-column'],novedades:['Novedades','fa-triangle-exclamation'],tiempos:['Tiempos','fa-clock'],facturacion:['Facturación','fa-dollar-sign'],carrys:['Cumplimiento ingreso carrys','fa-truck-fast'],cobertura:['Cobertura','fa-store'],historico:['Histórico','fa-clock-rotate-left'],evidencias:['Evidencias','fa-camera']};
const stt={comercial:{sub:'portada',anio:'',mes:''},institucional:{sub:'portada',anio:'',mes:''},biologicos:{sub:'portada',anio:'',mes:''}};
const segData=seg=>DATA[seg.toUpperCase()];
const segReg=(d,seg)=>seg==='biologicos'?d.bioReg:d.reg;
function allYears(d,seg){const ys=new Set();(segReg(d,seg)||[]).forEach(r=>{if(seg==='biologicos'){if(r.v2025!=null)ys.add(2025);if(r.v2026!=null)ys.add(2026);}else if(r.anio)ys.add(r.anio);});(d.fact||[]).forEach(f=>{if(f.v2025!=null)ys.add(2025);if(f.v2026!=null)ys.add(2026);});return [...ys].sort();}
function allMonths(d,seg){const s=new Set();(segReg(d,seg)||[]).forEach(r=>s.add(r.mes));(d.fact||[]).forEach(f=>s.add(f.mes));return [...s].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));}
const cap=m=>m?m.charAt(0)+m.slice(1).toLowerCase():'';
const showY=(st,y)=>!st.anio||st.anio===String(y);
const yrLbl=st=>st.anio?('Año '+st.anio):'Comparativo 2025 vs 2026';
function groupedF(id,labels,g25,g26,st,c25,c26,fmt){const ds=[];
  if(showY(st,2025))ds.push({label:'2025',data:labels.map(g25),backgroundColor:c25,borderRadius:5,maxBarThickness:BW(st)});
  if(showY(st,2026))ds.push({label:'2026',data:labels.map(g26),backgroundColor:c26,borderRadius:5,maxBarThickness:BW(st)});
  mkc(id,{type:'bar',data:{labels,datasets:ds},options:{...BASE,plugins:{legend:LEG,tooltip:fmt?{callbacks:{label:c=>c.dataset.label+': '+fmt(c.parsed.y)}}:{}},scales:{x:GRID,y:GRID}}});}
const sumF=(rows,f)=>rows.reduce((a,r)=>a+(r[f]||0),0);
const BW=st=>st.mes?96:46;
/* yearrow: filas con anio (reg, cumpl, tiempos). Ambos→solo conc; un año→conc+pend */
function visYR(arr,st){const ys=st.anio?[+st.anio]:[2025,2026];return arr.filter(r=>ys.includes(r.anio)&&(st.anio||r.conc)&&(!st.mes||r.mes===st.mes));}
/* mesrow: filas con v2025/v2026 (fact, bioReg). Ambos→solo conc; un año→todo */
function visMS(arr,st){let r=st.anio?arr.slice():arr.filter(x=>x.conc);if(st.mes)r=r.filter(x=>x.mes===st.mes);return r;}
function groupedYR(id,rows,f,st,c25,c26,fmt,months){
  const val=(m,y)=>{const r=rows.find(x=>x.mes===m&&x.anio===y);return r?r[f]:null;};
  months=months||[...new Set(rows.filter(r=>r[f]!=null).map(r=>r.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));
  const ds=[];
  if(showY(st,2025))ds.push({label:'2025',data:months.map(m=>val(m,2025)),backgroundColor:c25,borderRadius:5,maxBarThickness:BW(st)});
  if(showY(st,2026))ds.push({label:'2026',data:months.map(m=>val(m,2026)),backgroundColor:c26,borderRadius:5,maxBarThickness:BW(st)});
  mkc(id,{type:'bar',data:{labels:months,datasets:ds},options:{...BASE,plugins:{legend:LEG,tooltip:{callbacks:{label:c=>{let s=c.dataset.label+': '+fmt(c.parsed.y);if(c.dataset.label==='2026'){const v=val(months[c.dataIndex],2025);if(v!=null&&c.parsed.y!=null){const dd=c.parsed.y-v;s+=' · '+(dd>=0?'+':'')+fmt(dd)+' vs 2025';}}return s;}}}},scales:{x:GRID,y:GRID}}});}
function lineYR(id,rows,f,st,fmt,pct,months){
  const val=(m,y)=>{const r=rows.find(x=>x.mes===m&&x.anio===y);return r?r[f]:null;};
  months=months||[...new Set(rows.filter(r=>r[f]!=null).map(r=>r.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));
  const ds=[];
  if(showY(st,2025))ds.push({label:'2025',data:months.map(m=>val(m,2025)),borderColor:C25,borderWidth:2.4,tension:.35,pointRadius:3,spanGaps:true});
  if(showY(st,2026))ds.push({label:'2026',data:months.map(m=>val(m,2026)),borderColor:CO.green,borderWidth:2.6,tension:.35,pointRadius:3,spanGaps:true});
  mkc(id,{type:'line',data:{labels:months,datasets:ds},options:{...BASE,plugins:{legend:LEG,tooltip:fmt?{callbacks:{label:c=>{let s=c.dataset.label+': '+fmt(c.parsed.y);if(c.dataset.label==='2026'){const v=val(months[c.dataIndex],2025);if(v!=null&&c.parsed.y!=null){const dd=c.parsed.y-v;s+=' · '+(dd>=0?'+':'')+dd.toFixed(1)+' pts vs 2025';}}return s;}}}:{}},scales:{x:GRID,y:pct?{...GRID,suggestedMin:90,suggestedMax:100}:GRID}}});}
function groupedMS(id,rows,st,c25,c26,fmt,months){
  const get=(m,k)=>{const r=rows.find(x=>x.mes===m);return r?r[k]:null;};
  months=months||[...new Set(rows.map(r=>r.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b)).filter(m=>(showY(st,2025)&&get(m,'v2025')!=null)||(showY(st,2026)&&get(m,'v2026')!=null));
  const ds=[];
  if(showY(st,2025))ds.push({label:'2025',data:months.map(m=>get(m,'v2025')),backgroundColor:c25,borderRadius:5,maxBarThickness:BW(st)});
  if(showY(st,2026))ds.push({label:'2026',data:months.map(m=>get(m,'v2026')),backgroundColor:c26,borderRadius:5,maxBarThickness:BW(st)});
  mkc(id,{type:'bar',data:{labels:months,datasets:ds},options:{...BASE,plugins:{legend:LEG,tooltip:{callbacks:{label:c=>{let s=c.dataset.label+': '+fmt(c.parsed.y);if(c.dataset.label==='2026'){const v=get(months[c.dataIndex],'v2025');if(v!=null&&c.parsed.y!=null){const dd=c.parsed.y-v;s+=' · '+(dd>=0?'+':'')+fmt(dd)+' vs 2025';}}return s;}}}},scales:{x:GRID,y:GRID}}});}
const GR_SLATE='linear-gradient(135deg,#64748b,#475569)',GR_GREEN='linear-gradient(135deg,#22C55E,#15803d)',GR_BLUE='linear-gradient(135deg,#2563EB,#1d4ed8)',GR_PURPLE='linear-gradient(135deg,#A855F7,#7c3aed)';
function totStrip(items){return '<div class="ind-tot">'+items.map(it=>`<div class="t"><div class="ic" style="background:${it.grad||GR_BLUE}"><i class="fa-solid ${it.ic}"></i></div><div><div class="lbl">${it.label}</div><div class="vv">${it.value}</div></div></div>`).join('')+'</div>';}
/* chips sensibles al filtro (st.mes / st.anio); el sufijo del mes se muestra si hay filtro */
function chipItems(lbl,v25,v26,fmt,st,word){st=st||{};word=word||'';
  const sfx=st.mes?(' · '+cap(st.mes)):'';const it=[];
  if(!st.anio||st.anio==='2025')it.push({ic:'fa-layer-group',grad:GR_SLATE,label:`${lbl} 2025${sfx} · conciliado + pendiente`,value:fmt(v25)});
  if(!st.anio||st.anio==='2026')it.push({ic:'fa-circle-check',grad:GR_GREEN,label:`${lbl} 2026${sfx} · conciliado`,value:fmt(v26)});
  return totStrip(it);}
function chips2(t25,t26,fmt,lbl,st){lbl=lbl||'Total';return chipItems(lbl,t25,t26,fmt,st);}
function chipsYR(reg,f,fmt,lbl,st){st=st||{};const flt=(y,oc)=>reg.filter(r=>r.anio===y&&(oc?r.conc:true)&&(!st.mes||r.mes===st.mes));return chipItems(lbl,sumF(flt(2025,false),f),sumF(flt(2026,true),f),fmt,st);}
function chipsMS(rows,fmt,lbl,st){st=st||{};const flt=oc=>rows.filter(r=>(oc?r.conc:true)&&(!st.mes||r.mes===st.mes));return chipItems(lbl,sumF(flt(false),'v2025'),sumF(flt(true),'v2026'),fmt,st);}
function chipsAvg(reg,f,fmt,st){st=st||{};const a=(y,oc)=>{const rr=reg.filter(r=>r.anio===y&&(oc?r.conc:true)&&r[f]!=null&&(!st.mes||r.mes===st.mes));return rr.length?rr.reduce((s,r)=>s+r[f],0)/rr.length:null;};
  const sfx=st.mes?(' · '+cap(st.mes)):'';const it=[];
  if(!st.anio||st.anio==='2025')it.push({ic:'fa-layer-group',grad:GR_SLATE,label:`Promedio 2025${sfx} · conciliado + pendiente`,value:fmt(a(2025,false))});
  if(!st.anio||st.anio==='2026')it.push({ic:'fa-circle-check',grad:GR_GREEN,label:`Promedio 2026${sfx} · conciliado`,value:fmt(a(2026,true))});
  return totStrip(it);}
/* ---- Meses según el año filtrado (por defecto 2026) ---- */
const refYear=st=>st.anio?+st.anio:2026;
function monthsForYear(d,seg,year){const s=new Set();
  if(seg==='biologicos'){(d.bioReg||[]).forEach(r=>{if((year===2025?r.v2025:r.v2026)!=null)s.add(r.mes);});(d.cumpl||[]).forEach(r=>{if(r.anio===year&&r.entregado!=null)s.add(r.mes);});}
  else{(segReg(d,seg)||[]).forEach(r=>{if(r.anio===year&&(r.entregado!=null||r.cancelado!=null))s.add(r.mes);});}
  (d.fact||[]).forEach(f=>{if((year===2025?f.v2025:f.v2026)!=null)s.add(f.mes);});
  return [...s].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));}
function dispMonthsYR(rows,st,field){const ry=refYear(st);let mr=rows.filter(r=>r.anio===ry&&(!field||r[field]!=null));if(!st.anio)mr=mr.filter(r=>r.conc);let ms=[...new Set(mr.map(r=>r.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));if(st.mes)ms=ms.filter(m=>m===st.mes);return ms;}
function dispMonthsMS(rows,st){const ry=refYear(st),k=ry===2025?'v2025':'v2026';let mr=rows.filter(r=>r[k]!=null);if(!st.anio)mr=mr.filter(r=>r.conc);let ms=[...new Set(mr.map(r=>r.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));if(st.mes)ms=ms.filter(m=>m===st.mes);return ms;}
function subtabBar(cfg,st){return '<div class="ind-subtabs">'+cfg.tabs.map(t=>`<button class="ind-stab${st.sub===t?' active':''}" data-sub="${t}"><i class="fa-solid ${TLBL[t][1]}"></i> ${TLBL[t][0]}</button>`).join('')+'</div>';}
function filterBar(seg,d,st){if(st.sub==='portada'||st.sub==='cobertura'||st.sub==='carrys')return '';
  const ys=allYears(d,seg),px=SEG[seg].body;
  const mss=monthsForYear(d,seg,st.anio?+st.anio:2026);
  const yOpt='<option value="">Ambos años</option>'+ys.map(y=>`<option value="${y}"${st.anio===String(y)?' selected':''}>${y}</option>`).join('');
  const mOpt='<option value="">Todos los meses</option>'+mss.map(m=>`<option value="${m}"${st.mes===m?' selected':''}>${m}</option>`).join('');
  if(st.sub==='evidencias'){const em='<option value="">Todos los meses</option>'+allMonths(d,seg).map(m=>`<option value="${m}"${st.mes===m?' selected':''}>${m}</option>`).join('');return `<div class="ind-fbar"><div class="fld"><label>Mes</label><select id="${px}-mes">${em}</select></div></div>`;}
  return `<div class="ind-fbar"><div class="fld"><label>Año</label><select id="${px}-anio">${yOpt}</select></div><div class="fld"><label>Mes</label><select id="${px}-mes">${mOpt}</select></div></div>`;}
/* ---- Informe descargable por segmento (PDF, según filtro año/mes) ---- */
function reportSummary(seg,d){let h=smartSummary(seg,d);
  return h.replace(/<h4>[\s\S]*?<\/h4>/g,'').replace(/<li>/g,'• ').replace(/<\/li>/g,'\n').replace(/<\/p>/g,'\n').replace(/<[^>]+>/g,'').replace(/\n{2,}/g,'\n').replace(/[ \t]{2,}/g,' ').trim();}
function segReport(seg){
  if(!window.pdfMake){alert('No se pudo cargar el generador de PDF (pdfMake).');return;}
  const cfg=SEG[seg],d=segData(seg),st=stt[seg];if(!d)return;
  const bio=seg==='biologicos',reg=segReg(d,seg)||[];
  const filtLbl=(st.anio?('Año '+st.anio):'Comparativo 2025 vs 2026')+(st.mes?(' · '+cap(st.mes)):' · Todos los meses');
  const mss=monthsForYear(d,seg,2026),lm=st.mes||mss.slice(-1)[0]||null;
  const fLast=(d.fact||[]).find(f=>f.mes===lm)||{};
  const ny=n=>+(yr(n.anio)||n.anio)||null;
  let kpiBody;
  if(bio){const rL=(d.bioReg||[]).find(b=>b.mes===lm)||{},c25=(d.cumpl||[]).find(c=>c.mes===lm&&c.anio===2025),c26=(d.cumpl||[]).find(c=>c.mes===lm&&c.anio===2026);
    kpiBody=[['Indicador ('+(lm||'—')+')','2025','2026'],['Registros gestionados',n0(rL.v2025),n0(rL.v2026)],['Cumplimiento %',c25?p1(c25.entregado):'—',c26?p1(c26.entregado):'—'],['Facturación',money(fLast.v2025),money(fLast.v2026)]];
  }else{kpiBody=[['Indicador ('+(lm||'—')+')','2025','2026'],['Registros entregados',n0(regVal(reg,lm,2025,'entregado')),n0(regVal(reg,lm,2026,'entregado'))],['Efectividad %',p1(regVal(reg,lm,2025,'pctEnt')),p1(regVal(reg,lm,2026,'pctEnt'))],['Cancelados',n0(regVal(reg,lm,2025,'cancelado')),n0(regVal(reg,lm,2026,'cancelado'))],['Facturación',money(fLast.v2025),money(fLast.v2026)]];}
  const C=[];
  C.push({canvas:[{type:'rect',x:0,y:0,w:515,h:74,r:6,color:'#0B0F19'}],absolutePosition:{x:40,y:30}});
  C.push({text:'QUICK · Informe de seguimiento',style:'coverTitle',margin:[16,14,16,0]});
  C.push({text:cfg.title,style:'coverSeg',margin:[16,3,16,24]});
  C.push({text:cfg.desc,style:'p',margin:[0,8,0,10]});
  C.push({stack:[
    {text:[{text:'Filtro seleccionado: ',bold:true},filtLbl],style:'p'},
    {text:[{text:'Contrato: ',bold:true},cfg.contrato,'    Fecha otrosí: ',cfg.otrosi],style:'p'},
    {text:[{text:'Último mes cerrado: ',bold:true},lm||'—'],style:'p'},
    {text:[{text:'Meses cerrados 2026: ',bold:true},(mss.map(cap).join(' · ')||'—')],style:'p'},
    {text:[{text:'Generado: ',bold:true},new Date().toLocaleString('es-CO')],style:'muted'}
  ]});
  C.push({text:'Indicadores clave',style:'h2'});
  C.push({table:{headerRows:1,widths:['*','auto','auto'],body:kpiBody},layout:tableLayout()});
  C.push({text:'Resumen ejecutivo',style:'h2'});
  C.push({text:reportSummary(seg,d),style:'p'});
  C.push({text:'',pageBreak:'after'});
  /* Registros / gestión */
  if(bio){const rows=visMS(d.bioReg||[],st).slice().sort((a,b)=>mi(a.mes)-mi(b.mes));
    if(rows.length){C.push({text:'Registros gestionados por mes',style:'h2'});C.push({table:{headerRows:1,widths:['*','auto','auto'],body:[['Mes','2025','2026'],...rows.map(r=>[cap(r.mes),n0(r.v2025),n0(r.v2026)])]},layout:tableLayout()});}
    const cr=visYR(d.cumpl||[],st).slice().sort((a,b)=>mi(a.mes)-mi(b.mes)||(a.anio-b.anio));
    if(cr.length){C.push({text:'Cumplimiento y cancelación (%)',style:'h2'});C.push({table:{headerRows:1,widths:['*','auto','auto','auto'],body:[['Mes','Año','Cumplimiento','% Cancelado'],...cr.map(r=>[cap(r.mes),r.anio,p1(r.entregado),p1(r.cancelado)])]},layout:tableLayout()});}
  }else{const rows=visYR(reg,st).slice().sort((a,b)=>mi(a.mes)-mi(b.mes)||(a.anio-b.anio));
    if(rows.length){C.push({text:'Registros y efectividad por mes',style:'h2'});C.push({table:{headerRows:1,widths:['*','auto','auto','auto','auto'],body:[['Mes','Año','Entregados','Efectividad','Cancelados'],...rows.map(r=>[cap(r.mes),r.anio,n0(r.entregado),p1(r.pctEnt),n0(r.cancelado)])]},layout:tableLayout()});}}
  /* Novedades + responsable */
  let novf=(d.nov||[]).slice();if(st.anio)novf=novf.filter(n=>String(ny(n))===st.anio);if(st.mes)novf=novf.filter(n=>n.mes===st.mes);
  const nt=novTop(novf);
  if(nt.length){const rc=respBreakdown(novf),rTot=Object.values(rc).reduce((a,b)=>a+b,0)||1;
    C.push({text:'Novedades por responsable',style:'h2'});
    C.push({table:{headerRows:1,widths:['*','auto','auto'],body:[['Responsable','Casos','%'],...['Quick','Cafam','Cliente','Sin clasificar'].filter(k=>rc[k]).map(k=>[k,n0(rc[k]),(rc[k]/rTot*100).toFixed(1)+'%'])]},layout:tableLayout()});
    C.push({text:'Detalle de novedades',style:'h2'});
    C.push({table:{headerRows:1,widths:['*','auto','auto','auto'],body:[['Novedad','Responsable','Casos','%'],...nt.map(([nv,c])=>[cap(nv),novResp(nv),n0(c),(c/rTot*100).toFixed(1)+'%'])]},layout:tableLayout()});}
  /* Facturación */
  const fms=dispMonthsMS(d.fact||[],st),frows=(d.fact||[]).filter(f=>fms.indexOf(f.mes)>=0).sort((a,b)=>mi(a.mes)-mi(b.mes));
  if(frows.length){C.push({text:'Facturación',style:'h2'});C.push({table:{headerRows:1,widths:['*','auto','auto','auto','auto'],body:[['Mes','2025','2026','Variación','% Var'],...frows.map(f=>[cap(f.mes),money(f.v2025),money(f.v2026),money(f.variacion),(f.pctTxt&&f.pctTxt!==''?f.pctTxt:(f.pctNum!=null?(f.pctNum>0?'+':'')+f.pctNum.toFixed(1)+'%':'—'))])]},layout:tableLayout()});}
  /* Tiempos (comercial) */
  if(seg==='comercial'&&(d.tiempos||[]).length){const tv=visYR(d.tiempos,st).slice().sort((a,b)=>mi(a.mes)-mi(b.mes)||(a.anio-b.anio));
    if(tv.length){C.push({text:'Tiempos de entrega',style:'h2'});C.push({table:{headerRows:1,widths:['*','auto','auto'],body:[['Mes','Año','Total (H:MM:SS)'],...tv.map(t=>[cap(t.mes),t.anio,fmtDur(t.totMin)])]},layout:tableLayout()});}}
  const fn='informe-cafam-'+seg+(st.anio?('-'+st.anio):'-2025-2026')+(st.mes?('-'+st.mes.toLowerCase()):'')+'-'+new Date().toISOString().slice(0,10)+'.pdf';
  const doc={pageSize:'A4',pageMargins:[40,46,40,44],content:C,
    styles:{coverTitle:{fontSize:16,bold:true,color:'#FFFFFF'},coverSeg:{fontSize:12,color:'#CBD5E1'},h2:{fontSize:13,bold:true,color:'#0B0F19',margin:[0,14,0,7]},p:{fontSize:10,lineHeight:1.35,color:'#334155',margin:[0,0,0,4]},muted:{fontSize:8.5,color:'#64748B',margin:[0,4,0,0]}},
    defaultStyle:{fontSize:9.5,color:'#0f172a'},
    footer:(cur,tot)=>({text:'QUICK · Seguimiento Cafam — '+cfg.title+'    ·    Página '+cur+' de '+tot,alignment:'center',fontSize:8,color:'#94A3B8',margin:[0,10,0,0]})};
  pdfMake.createPdf(doc).download(fn);}
function tableLayout(){return {fillColor:(row)=>row===0?'#E2E8F0':null,hLineColor:()=> '#CBD5E1',vLineColor:()=> '#CBD5E1',hLineWidth:()=>.5,vLineWidth:()=>.5};}
function renderSeg(seg){const cfg=SEG[seg],d=segData(seg),st=stt[seg];const body=document.getElementById(cfg.body);if(!body||!d)return;
  body.innerHTML=subtabBar(cfg,st)+filterBar(seg,d,st)+`<div class="ind-panel" id="${cfg.body}-panel"></div>`;
  body.querySelectorAll('.ind-stab').forEach(b=>b.addEventListener('click',()=>{stt[seg].sub=b.dataset.sub;renderSeg(seg);}));
  const ya=document.getElementById(cfg.body+'-anio');if(ya)ya.addEventListener('change',()=>{stt[seg].anio=ya.value;
    const mss=monthsForYear(d,seg,ya.value?+ya.value:2026);
    if(stt[seg].mes&&mss.indexOf(stt[seg].mes)<0)stt[seg].mes='';
    const msel=document.getElementById(cfg.body+'-mes');
    if(msel)msel.innerHTML='<option value="">Todos los meses</option>'+mss.map(m=>`<option value="${m}"${stt[seg].mes===m?' selected':''}>${m}</option>`).join('');
    renderPanel(seg);});
  const ms=document.getElementById(cfg.body+'-mes');if(ms)ms.addEventListener('change',()=>{stt[seg].mes=ms.value;renderPanel(seg);});
  renderPanel(seg);
  setTimeout(()=>Object.values(indCharts).forEach(c=>{try{c.resize();}catch(e){}}),80);}
function renderPanel(seg){const d=segData(seg),st=stt[seg],p=document.getElementById(SEG[seg].body+'-panel');if(!p||!d)return;
  if(st.sub==='portada')return panelPortada(seg,d,p);
  if(st.sub==='registros')return panelReg(seg,d,st,p);
  if(st.sub==='novedades')return panelNov(seg,d,st,p);
  if(st.sub==='tiempos')return panelTiempos(seg,d,st,p);
  if(st.sub==='facturacion')return panelFact(seg,d,st,p);
  if(st.sub==='carrys')return panelCarrys(seg,d,st,p);
  if(st.sub==='cobertura')return panelCobertura(seg,d,st,p);
  if(st.sub==='historico')return panelHistorico(seg,d,st,p);
  if(st.sub==='evidencias')return panelEvid(seg,st,p);}
function panelPortada(seg,d,p){const cfg=SEG[seg],reg=segReg(d,seg),ys=allYears(d,seg),mss=monthsForYear(d,seg,2026);
  const lm=mss.slice(-1)[0]||(seg==='biologicos'?null:lastMes(reg));
  const fLast=(d.fact||[]).find(f=>f.mes===lm)||{};
  let kpis;
  if(seg==='biologicos'){const rLast=(d.bioReg||[]).find(b=>b.mes===lm)||{};const c25=(d.cumpl||[]).find(c=>c.mes===lm&&c.anio===2025),c26=(d.cumpl||[]).find(c=>c.mes===lm&&c.anio===2026);
    kpis=cmpCard('Registros gestionados ('+(lm||'')+')',rLast.v2025,rLast.v2026,n0)+cmpCard('Cumplimiento % ('+(lm||'')+')',c25?c25.entregado:null,c26?c26.entregado:null,p1)+cmpCard('Facturación ('+(fLast.mes||'')+')',fLast.v2025,fLast.v2026,money);
  }else{kpis=cmpCard('Registros entregados ('+(lm||'')+')',regVal(reg,lm,2025,'entregado'),regVal(reg,lm,2026,'entregado'),n0)+cmpCard('Efectividad % ('+(lm||'')+')',regVal(reg,lm,2025,'pctEnt'),regVal(reg,lm,2026,'pctEnt'),p1)+cmpCard('Cancelados ('+(lm||'')+')',regVal(reg,lm,2025,'cancelado'),regVal(reg,lm,2026,'cancelado'),n0)+cmpCard('Facturación ('+(fLast.mes||'')+')',fLast.v2025,fLast.v2026,money);}
  p.innerHTML=hero(cfg.ic,cfg.grad,cfg.title,cfg.desc,'Contrato <b>'+cfg.contrato+'</b> · Fecha otrosí: <b>'+cfg.otrosi+'</b> · Último mes cerrado: <b>'+(lm||'—')+'</b>')
    +`<div class="ind-reg-info"><span class="ind-chip"><i class="fa-solid fa-calendar"></i> Años registrados: ${ys.join(' · ')||'—'}</span><span class="ind-chip g"><i class="fa-solid fa-circle-check"></i> Meses cerrados: ${mss.map(cap).join(' · ')||'—'}</span></div>`
    +'<div class="cmp-grid">'+kpis+'</div>'
    +secT('fa-brain','Resumen general inteligente')+'<div class="card"><div class="card-body"><div class="ia-report">'+smartSummary(seg,d)+'</div></div></div>';}
function smartSummary(seg,d){const reg=segReg(d,seg)||[],fact=d.fact||[];
  const totR=y=>seg==='biologicos'?reg.reduce((a,r)=>a+(r[y===2025?'v2025':'v2026']||0),0):reg.filter(r=>r.anio===y).reduce((a,r)=>a+(r.entregado||0),0);
  const e25=totR(2025),e26=totR(2026),vR=e25?((e26-e25)/e25*100):null;
  const f25=fact.reduce((a,f)=>a+(f.v2025||0),0),f26=fact.reduce((a,f)=>a+(f.v2026||0),0),vF=f25?((f26-f25)/f25*100):null;
  const topNov=novTop(d.nov||[])[0];const col=v=>v==null?'#94a3b8':v>=0?'#4ade80':'#f87171';
  const rl=seg==='biologicos'?'registros gestionados':'registros entregados';
  let efe='';if(seg!=='biologicos'){const avg=y=>{const a=reg.filter(r=>r.anio===y&&r.pctEnt!=null);return a.length?a.reduce((s,r)=>s+r.pctEnt,0)/a.length:null;};const a25=avg(2025),a26=avg(2026);if(a25!=null&&a26!=null)efe=` La efectividad promedio pasó de <b>${p1(a25)}</b> (2025) a <b style="color:${a26>=a25?'#4ade80':'#f87171'}">${p1(a26)}</b> (2026).`;}
  let r=`<h4>Lectura ejecutiva · ${SEG[seg].title}</h4><p>En los meses cerrados, los <b>${rl}</b> sumaron <b>${n0(e25)}</b> en 2025 y <b>${n0(e26)}</b> en 2026`;
  r+=vR==null?'.':`, una <b style="color:${col(vR)}">${vR>=0?'variación de +':'caída de '}${vR>=0?vR.toFixed(1):Math.abs(vR).toFixed(1)}%</b> frente a 2025.`;
  r+=efe;
  if(f25||f26){r+=` La facturación acumulada fue <b>${money(f25)}</b> (2025) vs <b>${money(f26)}</b> (2026)`;r+=vF==null?'.':`, <b style="color:${col(vF)}">${vF>=0?'+':''}${vF.toFixed(1)}%</b>.`;}
  if(topNov)r+=` La novedad más frecuente es <b>${topNov[0]}</b> (${n0(topNov[1])} casos).`;
  r+='</p><ul>';
  r+=`<li>${vR!=null&&vR<0?'Volumen a la baja vs 2025: revisar demanda y cobertura por punto.':'Volumen estable o creciente: sostener la capacidad operativa.'}</li>`;
  if(vF!=null)r+=`<li>${vF<0?'Facturación menor que 2025: validar novedades y cancelaciones que impactan el ingreso.':'Facturación al alza: mantener el nivel de servicio para sostenerla.'}</li>`;
  if(topNov)r+=`<li>Atacar la causa raíz de <b>${topNov[0]}</b> para reducir reprocesos y mejorar la efectividad.</li>`;
  return r+'</ul>';}
function panelReg(seg,d,st,p){const px=SEG[seg].body;
  if(seg==='biologicos'){const bioReg=d.bioReg||[],cumpl=d.cumpl||[];
    const rows=visMS(bioReg,st),crows=visYR(cumpl,st);
    const bM=dispMonthsMS(bioReg,st),cM=dispMonthsYR(cumpl,st,'entregado');
    p.innerHTML=chipsMS(bioReg,n0,'Registros',st)+card('Registros gestionados por mes',yrLbl(st),px+'-reg')
      +chipsAvg(cumpl,'entregado',p1,st)+card('Cumplimiento de entrega (%) por mes','Cumplimiento de frecuencias',px+'-ent')
      +card('% Cancelado por mes',yrLbl(st),px+'-canc');
    groupedMS(px+'-reg',rows,st,C25,CO.purple,n0,bM);
    lineYR(px+'-ent',crows,'entregado',st,p1,true,cM);
    groupedYR(px+'-canc',crows,'cancelado',st,C25,CO.red,p1,cM);return;}
  const reg=d.reg||[],rows=visYR(reg,st),M=dispMonthsYR(reg,st,'entregado');
  p.innerHTML=chipsYR(reg,'entregado',n0,'Registros',st)+card('Registros entregados por mes',yrLbl(st),px+'-reg')
    +chipsAvg(reg,'pctEnt',p1,st)+card('Efectividad de entrega (%)',yrLbl(st),px+'-efe')
    +card('Cancelados por mes',yrLbl(st),px+'-canc');
  groupedYR(px+'-reg',rows,'entregado',st,C25,CO.blue,n0,M);
  lineYR(px+'-efe',rows,'pctEnt',st,p1,true,M);
  groupedYR(px+'-canc',rows,'cancelado',st,C25,CO.red,n0,M);}
function panelNov(seg,d,st,p){const px=SEG[seg].body;const nov0=(d.nov||[]);
  const ny=n=>+(yr(n.anio)||n.anio)||null;
  let novf=nov0.slice();if(st.anio)novf=novf.filter(n=>String(ny(n))===st.anio);if(st.mes)novf=novf.filter(n=>n.mes===st.mes);
  const nt=novTop(novf);
  const refY=refYear(st);
  let months=[...new Set(nov0.filter(n=>ny(n)===refY).map(n=>n.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));
  if(st.mes)months=months.filter(m=>m===st.mes);
  const sumNov=(m,y)=>nov0.filter(n=>n.mes===m&&ny(n)===y).reduce((a,n)=>a+(n.cant||0),0);
  p.innerHTML=card('Total de novedades por mes',yrLbl(st),px+'-novmes')
    +card('Responsable de las novedades','% según a quién corresponde — Quick · Cafam · Cliente',px+'-novresp')
    +tcard('Detalle por responsable','Qué tipo de novedad corresponde a cada responsable',px+'-novrespt')
    +card('Novedades por tipo','Cantidad por tipo de novedad (mayor a menor)',px+'-nov','tall');
  const rc=respBreakdown(novf),rEnt=Object.entries(rc).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]),rTot=rEnt.reduce((a,e)=>a+e[1],0);
  if(!emptyIf(px+'-novresp',rTot===0,'Sin novedades para el filtro seleccionado'))mkc(px+'-novresp',{type:'doughnut',data:{labels:rEnt.map(e=>e[0]+' · '+(e[1]/rTot*100).toFixed(1)+'%'),datasets:[{data:rEnt.map(e=>e[1]),backgroundColor:rEnt.map(e=>RESP_COL[e[0]]||CO.gray),borderWidth:0,hoverOffset:8}]},options:{...BASE,cutout:'58%',plugins:{legend:{position:'right',labels:LEG.labels},tooltip:{callbacks:{label:c=>String(c.label).split(' · ')[0]+': '+n0(c.parsed)+' ('+(rTot?(c.parsed/rTot*100):0).toFixed(1)+'%)'}}}}});
  const RORD={Quick:0,Cafam:1,Cliente:2,'Sin clasificar':3};
  const detRows=nt.map(([nv,c])=>({r:novResp(nv),nv,c})).sort((a,b)=>(RORD[a.r]-RORD[b.r])||(b.c-a.c))
    .map(x=>[`<b style="color:${RESP_COL[x.r]||CO.gray}">● ${x.r}</b>`,x.nv.charAt(0)+x.nv.slice(1).toLowerCase(),n0(x.c),rTot?((x.c/rTot*100).toFixed(1)+'%'):'—']);
  tbl(px+'-novrespt',['Responsable','Novedad','Casos','% del total'],detRows);
  const ds=[];
  if(showY(st,2025))ds.push({label:'2025',data:months.map(m=>sumNov(m,2025)),backgroundColor:C25,borderRadius:5,maxBarThickness:BW(st)});
  if(showY(st,2026))ds.push({label:'2026',data:months.map(m=>sumNov(m,2026)),backgroundColor:CO.yellow,borderRadius:5,maxBarThickness:BW(st)});
  if(!emptyIf(px+'-novmes',months.length===0,'Sin novedades para el filtro seleccionado'))mkc(px+'-novmes',{type:'bar',data:{labels:months,datasets:ds},options:{...BASE,plugins:{legend:LEG,tooltip:{callbacks:{label:c=>c.dataset.label+': '+n0(c.parsed.y)}}},scales:{x:GRID,y:GRID}}});
  if(!emptyIf(px+'-nov',nt.length===0,'Sin novedades para el filtro seleccionado'))mkc(px+'-nov',{type:'bar',data:{labels:nt.map(e=>e[0]),datasets:[{data:nt.map(e=>e[1]),backgroundColor:palette(nt.length),borderRadius:6}]},options:{...BASE,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:GRID,y:{...GRID,ticks:{color:'#94A3B8',font:{size:11},autoSkip:false}}}}});}
function panelTiempos(seg,d,st,p){const px=SEG[seg].body;const tAll=d.tiempos||[];const tv=visYR(tAll,st);
  const avg=rows=>{const rr=rows.filter(x=>x.totMin!=null);return rr.length?rr.reduce((a,x)=>a+x.totMin,0)/rr.length:null;};
  p.innerHTML=chips2(avg(tAll.filter(x=>x.anio===2025&&(!st.mes||x.mes===st.mes))),avg(tAll.filter(x=>x.anio===2026&&x.conc&&(!st.mes||x.mes===st.mes))),fmtDur,'Total general prom.',st)
    +card('Total general por mes','Tiempo total de entrega (H:MM) — 2025 vs 2026',px+'-ttot')
    +tcard('Tiempos de entrega por mes','Promedios por etapa (HH:MM:SS)',px+'-tt');
  groupedYR(px+'-ttot',tv,'totMin',st,C25,CO.blue,fmtDur,dispMonthsYR(tAll,st,'totMin'));
  const ch=Chart.getChart(px+'-ttot');if(ch){ch.options.scales.y.ticks={...(ch.options.scales.y.ticks||{}),callback:v=>fmtDur(v)};ch.update('none');}
  tbl(px+'-tt',['MES','AÑO','1 Prioritario','2 Trans. fuera zona','3 Preprogramado','4 Transf. dentro zona','Otros','Total general'],tv.slice().sort((a,b)=>mi(a.mes)-mi(b.mes)||(a.anio||0)-(b.anio||0)).map(x=>[x.mes,x.anio||'—',x.c1,x.c2,x.c3,x.c4,x.otros,`<b>${x.total}</b>`]));}
function panelFact(seg,d,st,p){const px=SEG[seg].body;const fact=d.fact||[];const ms=dispMonthsMS(fact,st);
  const frows=fact.filter(f=>ms.indexOf(f.mes)>=0).sort((a,b)=>mi(a.mes)-mi(b.mes));
  p.innerHTML=chipsMS(fact,money,'Total ingreso',st)+card('Facturación por mes',yrLbl(st),px+'-fact')+tcard('Detalle de facturación','Variación y % variación — verde aumenta, rojo disminuye',px+'-factt');
  groupedF(px+'-fact',ms,m=>{const f=fact.find(x=>x.mes===m);return f?f.v2025:null;},m=>{const f=fact.find(x=>x.mes===m);return f?f.v2026:null;},st,C25,CO.green,money);
  tbl(px+'-factt',['MES','2025','2026','Variación','% Variación'],frows.map(f=>{const up=(f.variacion||0)>0,dn=(f.variacion||0)<0;const c=up?'#4ade80':dn?'#f87171':'#94a3b8',ar=up?'▲':dn?'▼':'■';
    const pct=(f.pctTxt&&f.pctTxt!=='')?f.pctTxt:(f.pctNum!=null?(f.pctNum>0?'+':'')+f.pctNum.toFixed(1)+'%':'—');
    return [f.mes,money(f.v2025),money(f.v2026),`<b style="color:${c}">${money(f.variacion)}</b>`,`<b style="color:${c}">${ar} ${pct}</b>`];}));}
/* ---- Cumplimiento de ingreso (carrys) — Biológicos ---- */
function panelCarrys(seg,d,st,p){const px=SEG[seg].body;const ci=(d.cantIng||[]),ri=(d.rutaIng||[]);
  const meses=[...new Set(ci.map(x=>x.mes))].filter(m=>mi(m)>=0).sort((a,b)=>mi(a)-mi(b));
  const tA=ci.reduce((a,x)=>a+(x.aTiempo||0),0),tR=ci.reduce((a,x)=>a+(x.retraso||0),0),tT=tA+tR;
  const pctG=tT?(tA/tT*100):null;
  p.innerHTML=totStrip([
      {ic:'fa-truck-fast',grad:GR_GREEN,label:'Ingresos a tiempo · periodo',value:n0(tA)},
      {ic:'fa-clock',grad:GR_SLATE,label:'Ingresos con retraso · periodo',value:n0(tR)},
      {ic:'fa-circle-check',grad:GR_GREEN,label:'% Cumplimiento global',value:p1(pctG)}])
    +card('Cantidad por mes de ingreso','Servicios a tiempo vs. con retraso, por mes',px+'-cimes')
    +card('% Cumplimiento vs. no cumplimiento','Participación total del periodo — a tiempo vs. retraso',px+'-cipie')
    +tcard('Detalle · cantidad por mes de ingreso','Cantidades y % de cumplimiento por mes',px+'-cimest')
    +card('% Cumplimiento de rutas por ingreso','A tiempo % por ruta (consolidado del periodo)',px+'-ciruta','tall')
    +tcard('Detalle · cumplimiento de rutas por ingreso','Por mes y ruta — a tiempo y retraso',px+'-cirutat');
  if(!emptyIf(px+'-cimes',meses.length===0,'Sin datos de ingreso carrys')){
    const at=meses.map(m=>{const r=ci.find(x=>x.mes===m);return r?(r.aTiempo||0):0;}),rt=meses.map(m=>{const r=ci.find(x=>x.mes===m);return r?(r.retraso||0):0;});
    mkc(px+'-cimes',{type:'bar',data:{labels:meses.map(cap),datasets:[
      {label:'A tiempo',data:at,backgroundColor:CO.green,borderRadius:5,maxBarThickness:54},
      {label:'Retraso',data:rt,backgroundColor:CO.red,borderRadius:5,maxBarThickness:54}]},
      options:{...BASE,plugins:{legend:LEG,tooltip:{callbacks:{label:c=>c.dataset.label+': '+n0(c.parsed.y)}}},scales:{x:GRID,y:GRID}}});}
  if(!emptyIf(px+'-cipie',tT===0,'Sin datos de ingreso carrys'))
    mkc(px+'-cipie',{type:'doughnut',data:{labels:['Cumplimiento (a tiempo) · '+(tT?(tA/tT*100).toFixed(1):0)+'%','No cumplimiento (retraso) · '+(tT?(tR/tT*100).toFixed(1):0)+'%'],datasets:[{data:[tA,tR],backgroundColor:[CO.green,CO.red],borderWidth:0,hoverOffset:8}]},options:{...BASE,cutout:'58%',plugins:{legend:{position:'right',labels:LEG.labels},tooltip:{callbacks:{label:c=>String(c.label).split(' · ')[0]+': '+n0(c.parsed)+' ('+(tT?(c.parsed/tT*100):0).toFixed(1)+'%)'}}}}});
  tbl(px+'-cimest',['Mes','A tiempo','Retraso','Total','% Cumplimiento'],meses.map(m=>{const r=ci.find(x=>x.mes===m)||{};const t=(r.total!=null?r.total:((r.aTiempo||0)+(r.retraso||0)));const pc=t?((r.aTiempo||0)/t*100):null;return [cap(m),n0(r.aTiempo),n0(r.retraso),n0(t),`<b style="color:${pc==null?'#94a3b8':pc>=95?'#4ade80':pc>=85?'#eab308':'#f87171'}">${p1(pc)}</b>`];}));
  const byR={};ri.forEach(x=>{const k=x.ruta;if(!byR[k])byR[k]={a:0,r:0};byR[k].a+=(x.aTiempo||0);byR[k].r+=(x.retraso||0);});
  const rE=Object.entries(byR).map(([ruta,v])=>({ruta,pct:(v.a+v.r)?v.a/(v.a+v.r)*100:0,tot:v.a+v.r})).sort((a,b)=>a.pct-b.pct||b.tot-a.tot);
  if(!emptyIf(px+'-ciruta',rE.length===0,'Sin datos de rutas'))
    mkc(px+'-ciruta',{type:'bar',data:{labels:rE.map(e=>e.ruta),datasets:[{label:'A tiempo %',data:rE.map(e=>+e.pct.toFixed(1)),backgroundColor:rE.map(e=>e.pct>=95?CO.green:e.pct>=85?CO.yellow:CO.red),borderRadius:5}]},options:{...BASE,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>'A tiempo: '+p1(c.parsed.x)+' ('+n0(rE[c.dataIndex].tot)+' ingresos)'}}},scales:{x:{...GRID,max:100,ticks:{color:'#94A3B8',callback:v=>v+'%'}},y:{...GRID,ticks:{color:'#94A3B8',font:{size:10},autoSkip:false}}}}});
  tbl(px+'-cirutat',['Mes','Ruta','A tiempo','A tiempo %','Retraso','Retraso %'],ri.slice().sort((a,b)=>mi(a.mes)-mi(b.mes)||(b.aTiempo||0)-(a.aTiempo||0)).map(x=>[cap(x.mes),x.ruta,n0(x.aTiempo),p1(x.aTiempoPct),n0(x.retraso),p1(x.retrasoPct)]));}
function panelCobertura(seg,d,st,p){const px=SEG[seg].body;const fija=d.fija||[],colab=d.colab||[];
  const kf=plantaKpis(fija),kc=plantaKpis(colab);
  const ciudades=new Set([...fija,...colab].map(x=>x.ciudad).filter(Boolean)).size;
  const kpis=[
    ['Puntos planta fija',kf.pts,'fa-store','blue'],
    ['Mensajeros planta fija',kf.cant,'fa-people-group','green']
  ];
  if(colab.length){kpis.push(['Puntos colaborativos',kc.pts,'fa-handshake','purple']);kpis.push(['Mensajeros colaborativos',kc.cant,'fa-user-group','yellow']);}
  kpis.push(['Ciudades cubiertas',ciudades,'fa-city','yellow']);
  const byCity={};[...fija,...colab].forEach(x=>{const c=x.ciudad||'—';byCity[c]=(byCity[c]||0)+(x.cant||0);});
  const cl=Object.keys(byCity).sort((a,b)=>byCity[b]-byCity[a]);
  p.innerHTML=totStrip([{ic:'fa-location-dot',grad:GR_BLUE,label:'Total puntos de operación',value:n0(kf.pts+kc.pts)},{ic:'fa-people-group',grad:GR_GREEN,label:'Total mensajeros',value:n0(kf.cant+kc.cant)}])
    +`<div class="kpi-grid">`+kpis.map(k=>`<div class="kpi"><div class="top"><div><div class="label">${k[0]}</div></div><div class="ic bg-${k[3]}"><i class="fa-solid ${k[2]}"></i></div></div><div class="val">${n0(k[1])}</div></div>`).join('')+`</div>`
    +card('Mensajeros por ciudad','Recurso total por ciudad (planta fija + colaborativa)',px+'-cov')
    +(colab.length
      ?`<div class="grid-2">${tcard('Planta fija','Mensajeros por punto / ciudad',px+'-fija')}${tcard('Planta colaborativa','Puntos en modelo colaborativo',px+'-colab')}</div>`
      :tcard('Planta fija','Mensajeros por punto / ciudad',px+'-fija'));
  if(!emptyIf(px+'-cov',cl.length===0,'Sin información de planta cargada'))mkc(px+'-cov',{type:'bar',data:{labels:cl,datasets:[{label:'Mensajeros',data:cl.map(c=>byCity[c]),backgroundColor:palette(cl.length),borderRadius:6,maxBarThickness:64}]},options:{...BASE,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+n0(c.parsed.y)+' mensajeros'}}},scales:{x:GRID,y:GRID}}});
  tbl(px+'-fija',['CIUDAD','PUNTO','Mensajeros','MODELO'],fija.map(x=>[x.ciudad,x.punto,n0(x.cant),x.modelo||'—']));
  if(colab.length)tbl(px+'-colab',['CIUDAD','PUNTO','Mensajeros','Inicio modelo'],colab.map(x=>[x.ciudad,x.punto,n0(x.cant),x.modelo||'—']));}
function panelHistorico(seg,d,st,p){const px=SEG[seg].body;let hist=(d.hist||[]).slice();
  if(st.anio)hist=hist.filter(h=>String(yr(h.anio)||h.anio).indexOf(st.anio)>=0);
  if(st.mes)hist=hist.filter(h=>String(h.mes).trim().toUpperCase()===st.mes);
  hist.sort((a,b)=>((+yr(a.anio)||0)-(+yr(b.anio)||0))||(mi(a.mes)-mi(b.mes)));
  p.innerHTML=totStrip([{ic:'fa-clock-rotate-left',grad:GR_BLUE,label:'Cambios registrados en el periodo',value:n0(hist.length)}])
    +tcard('Histórico de cambios','Modificaciones del contrato / operación realizadas en el periodo',px+'-hist');
  tbl(px+'-hist',['AÑO','MES','FECHA','Modificación'],hist.map(h=>[h.anio||'—',h.mes||'—',h.fecha||'—',h.mod||'—']));}
function panelEvid(seg,st,p){const ev=(DATA.EVID||[]).filter(e=>e.seg===seg&&(!st.mes||e.mes===st.mes));
  if(!ev.length){p.innerHTML='<div class="card"><div class="card-body"><div class="ind-loading">Aún no hay evidencias para este filtro.<br><br>Para publicarlas (visibles en el link), agrega una hoja <b>EVIDENCIAS</b> al Sheet con columnas:<br><b>SEGMENTO</b> (comercial / institucional / biologicos) · <b>AÑO</b> · <b>MES</b> · <b>TITULO</b> · <b>URL</b> (enlace de imagen o carpeta de Google Drive) · <b>VARIACION</b> (opcional).</div></div></div>';return;}
  p.innerHTML='<div class="evid-grid">'+ev.map(e=>{const src=evidImg(e.url);
    const img=src?`<img src="${src}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">`:'';
    return `<div class="evid-card">${img}<div class="ev-b"><div class="ev-t">${e.titulo||'Evidencia'}</div><div class="ev-m">${cap(e.mes)} ${e.anio||''}${e.variacion?' · '+e.variacion:''}</div><a href="${e.url}" target="_blank" rel="noopener" style="display:inline-flex;margin-top:9px;gap:6px;align-items:center;font-size:12px;color:#60a5fa;text-decoration:none"><i class="fa-solid fa-up-right-from-square"></i> Abrir</a></div></div>`;}).join('')+'</div>';}
/* ---------- Área Administrativa (desde hoja AREA ADMINISTRATIVA) ---------- */
const initials=n=>n.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
function driveImg(u){if(!u)return '';const m=String(u).match(/\/d\/([-\w]{20,})/)||String(u).match(/[?&]id=([-\w]{20,})/);return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`:String(u).trim();}
function evidImg(u){u=String(u||'').trim();if(!u)return '';
  if(/\/folders\//i.test(u))return '';
  if(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(u)||/googleusercontent|drive\.google\.com\/uc/i.test(u))return u;
  const m=u.match(/\/d\/([-\w]{20,})/)||u.match(/[?&]id=([-\w]{20,})/);
  return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w600`:'';}
function pAdmin(rows){const out=[];if(!rows||!rows.length)return out;
  for(let i=1;i<rows.length;i++){const r=rows[i];if(!r)continue;
    const nom=cell(r,2);if(!nom)continue;
    out.push({cargo:cell(r,0),op:cell(r,1).trim(),nombre:nom,cel:cell(r,3).trim(),correo:cell(r,4).trim(),foto:driveImg(cell(r,5))});}
  return out;}
const ADM_COMMON=['Operaciones Last Mile Cafam','Área Financiera · GAF'];
const ADM_OPS={comercial:'Cafam Comercial',institucional:'Cafam Institucional',biologicos:'Cafam Biologicos'};
const ADM_TABS=[['comercial','Cafam Comercial','fa-store'],['institucional','Cafam Institucional','fa-building-columns'],['biologicos','Cafam Biológicos','fa-flask-vial']];
const admNorm=s=>String(s||'').trim().toUpperCase();
let admSub='comercial';
function orgCardHTML(pp){const ph=pp.foto?`<img src="${pp.foto}" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()">`:'';
  return `<div class="org-card"><div class="org-av"><span class="org-ini">${initials(pp.nombre)}</span>${ph}</div><div class="org-name">${pp.nombre}</div><div class="org-role">${pp.cargo||''}</div><div class="org-contact">${pp.correo?`<i class="fa-solid fa-envelope"></i> ${pp.correo}<br>`:''}${pp.cel?`<i class="fa-solid fa-phone"></i> ${pp.cel}`:''}</div></div>`;}
function renderAdmin(sub){sub=sub||admSub;admSub=sub;const b=document.getElementById('inda-body');if(!b)return;
  const adm=DATA.ADMIN||[];
  const order=[...ADM_COMMON,ADM_OPS[sub]];
  const groups=order.map(op=>({grupo:op,people:adm.filter(pp=>admNorm(pp.op)===admNorm(op))})).filter(g=>g.people.length);
  const subbar='<div class="org-sub">'+ADM_TABS.map(t=>`<button class="org-stab${sub===t[0]?' active':''}" data-osub="${t[0]}"><i class="fa-solid ${t[2]}"></i> ${t[1]}</button>`).join('')+'</div>';
  b.innerHTML=hero('fa-sitemap','linear-gradient(135deg,#EAB308,#ca8a04)','Línea de Gestión Cafam Last Mile','Estructura de gestión y contactos del equipo Quick a cargo de la operación Cafam. Las áreas <b>Operaciones Last Mile Cafam</b> y <b>Financiera · GAF</b> son transversales a las tres operaciones.','Organigrama vigente · con evidencia fotográfica')
    +subbar
    +(groups.length?groups.map(g=>`<div class="org-group"><div class="org-h">${g.grupo}</div><div class="org-grid">${g.people.map(orgCardHTML).join('')}</div></div>`).join('')
      :'<div class="card"><div class="card-body"><div class="ind-loading">No se pudo cargar la hoja <b>AREA ADMINISTRATIVA</b>. Verifica que el Sheet esté compartido como "Cualquiera con el enlace · Lector".</div></div></div>');
  b.querySelectorAll('.org-stab').forEach(btn=>btn.addEventListener('click',()=>renderAdmin(btn.dataset.osub)));}

/* ---------- Carga ---------- */
function fetchInd(sheet){return new Promise((res,rej)=>{Papa.parse(IND_CFG.url(sheet),{download:true,header:false,skipEmptyLines:false,complete:r=>res(r.data),error:rej});});}
async function ensureInd(){
  if(indLoaded||indLoading)return;indLoading=true;
  try{
    const [com,ins,bio]=await Promise.all([fetchInd('COMERCIAL'),fetchInd('INSTITUCIONAL'),fetchInd('BIOLOGICOS')]);
    DATA.COMERCIAL={reg:pReg(com,13),nov:pNov(com,21),fact:pFact(com,36),tiempos:pTiempos(com),fija:pPlanta(com,3,true),colab:pPlanta(com,8,true),hist:pHist(com,43)};
    DATA.INSTITUCIONAL={reg:pReg(ins,7),nov:pNov(ins,15),fact:pFact(ins,21),fija:pPlanta(ins,3,false),hist:pHist(ins,28)};
    DATA.BIOLOGICOS={bioReg:pBioReg(bio,3),cumpl:pCumpl(bio,9),nov:pNov(bio,15),fact:pFact(bio,21),rutaIng:pRutaIng(bio,28),cantIng:pCantIng(bio,35)};
    try{const ev=await fetchInd('EVIDENCIAS');DATA.EVID=pEvid(ev);}catch(e){DATA.EVID=[];}
    try{const adm=await fetchInd('AREA ADMINISTRATIVA');DATA.ADMIN=pAdmin(adm);}catch(e){DATA.ADMIN=[];}
    indLoaded=true;
    renderSeg('comercial');renderSeg('institucional');renderSeg('biologicos');renderAdmin();
    setTimeout(()=>Object.values(indCharts).forEach(c=>{try{c.resize();}catch(e){}}),180);
  }catch(e){console.warn('Indicadores: fallo de carga',e);
    ['indc-body','indi-body','indb-body'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="ind-loading">No se pudo cargar el Sheet de indicadores. Verifica que esté compartido como "Cualquiera con el enlace · Lector".</div>';});}
  indLoading=false;
}

/* ---------- Modal: botón en la barra inferior (junto al perfil) ---------- */
const SEG_VIEW={comercial:'ind-comercial',institucional:'ind-institucional',biologicos:'ind-biologicos',admin:'ind-admin'};
let curSeg='comercial';
function openIndModal(){
  const m=document.getElementById('indModal');if(!m)return;
  m.classList.add('show');
  ensureInd();
  setTimeout(()=>Object.values(indCharts).forEach(c=>{try{c.resize();}catch(e){}}),120);
}
function closeIndModal(){const m=document.getElementById('indModal');if(m)m.classList.remove('show');}
function switchIndSeg(seg){
  curSeg=seg;
  document.querySelectorAll('.ind-seg-tab').forEach(b=>b.classList.toggle('active',b.dataset.seg===seg));
  document.querySelectorAll('.ind-view').forEach(v=>v.classList.toggle('active',v.id===SEG_VIEW[seg]));
  const pdfBtn=document.getElementById('indPdfBtn');if(pdfBtn)pdfBtn.style.visibility=(seg==='admin')?'hidden':'visible';
  setTimeout(()=>Object.values(indCharts).forEach(c=>{try{c.resize();}catch(e){}}),80);
}
document.getElementById('indOpenBtn')?.addEventListener('click',openIndModal);
document.getElementById('indModalClose')?.addEventListener('click',closeIndModal);
document.getElementById('indModal')?.addEventListener('click',e=>{if(e.target.id==='indModal')closeIndModal();});
document.querySelectorAll('.ind-seg-tab').forEach(b=>b.addEventListener('click',()=>switchIndSeg(b.dataset.seg)));
document.getElementById('indPdfBtn')?.addEventListener('click',()=>{if(SEG[curSeg])segReport(curSeg);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeIndModal();});

window.ensureInd=ensureInd;window.segReport=segReport;
})();
