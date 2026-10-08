/* ===================== UI compartida (todos los módulos) =====================
   - MultiSelect: filtro desplegable de selección múltiple (reemplaza <select>).
     Las opciones se muestran en el orden que reciben (el llamador debe ordenarlas
     cronológicamente — meses ENE..DIC, días Lun..Dom — nunca se ordenan aquí).
   - initChartExpand: agrega botón de expandir/contraer a cada tarjeta con gráfica;
     los filtros propios de la gráfica (.cf-bar) quedan ocultos y solo aparecen
     cuando la tarjeta está expandida. */
(function(){

/* ---------- MultiSelect ---------- */
const reg={};
function closeAll(except){
  document.querySelectorAll('.msel.open').forEach(m=>{if(m!==except)m.classList.remove('open');});
}
function labelFor(st){
  if(!st.options.length)return st.placeholder;
  if(st.selected.size===0||st.selected.size===st.options.length)return st.placeholder;
  if(st.selected.size<=2)return [...st.selected].join(', ');
  return st.selected.size+' seleccionados';
}
function render(id){
  const st=reg[id];if(!st)return;
  const root=document.getElementById(id);if(!root)return;
  const isOpen=root.classList.contains('open');
  root.className='msel'+(st.sm?' sm':'')+(isOpen?' open':'');
  const allChecked=st.options.length>0&&st.selected.size===st.options.length;
  root.innerHTML=`<button type="button" class="msel-btn"><span>${labelFor(st)}</span><i class="fa-solid fa-chevron-down"></i></button>
    <div class="msel-panel">
      ${st.options.length?`<label class="msel-all"><input type="checkbox" class="msel-allcb" ${allChecked?'checked':''}> Seleccionar todo</label>`:'<div style="padding:10px;color:var(--text-soft);font-size:12.5px">Sin opciones</div>'}
      ${st.options.map(o=>`<label class="msel-opt"><input type="checkbox" value="${o}" ${st.selected.has(o)?'checked':''}> ${o}</label>`).join('')}
    </div>`;
  const allcb=root.querySelector('.msel-allcb');
  if(allcb)allcb.indeterminate=st.selected.size>0&&st.selected.size<st.options.length;
}
const MultiSelect={
  setOptions(id,options,opts){
    opts=opts||{};
    let st=reg[id];
    if(!st){st=reg[id]={options:[],selected:new Set(),placeholder:opts.placeholder||'Todos',onChange:opts.onChange||function(){},sm:!!opts.sm};}
    else{
      if(opts.placeholder!=null)st.placeholder=opts.placeholder;
      if(opts.onChange)st.onChange=opts.onChange;
      if(opts.sm!=null)st.sm=opts.sm;
    }
    st.options=options.slice();
    st.selected=new Set([...st.selected].filter(v=>st.options.indexOf(v)>=0));
    render(id);
  },
  getValues(id){const st=reg[id];return st?[...st.selected]:[];},
  setSelected(id,arr){const st=reg[id];if(!st)return;st.selected=new Set((arr||[]).filter(v=>st.options.indexOf(v)>=0));render(id);},
  clear(id){this.setSelected(id,[]);}
};
window.MultiSelect=MultiSelect;

document.addEventListener('click',function(e){
  const btn=e.target.closest('.msel-btn');
  if(btn){
    const root=btn.closest('.msel');
    const wasOpen=root.classList.contains('open');
    closeAll();
    if(!wasOpen)root.classList.add('open');
    e.stopPropagation();
    return;
  }
  if(!e.target.closest('.msel-panel'))closeAll();
});
document.addEventListener('change',function(e){
  const panel=e.target.closest('.msel-panel');
  if(!panel)return;
  const root=panel.closest('.msel');const id=root.id;const st=reg[id];if(!st)return;
  if(e.target.classList.contains('msel-allcb')){
    st.selected=e.target.checked?new Set(st.options):new Set();
  }else{
    const val=e.target.value;
    if(e.target.checked)st.selected.add(val);else st.selected.delete(val);
  }
  render(id);
  document.getElementById(id).classList.add('open'); // mantener abierto tras marcar
  st.onChange();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll();});

/* ---------- Expandir / contraer gráficas ---------- */
let backdrop=null,expandedCard=null,expandedAnchor=null,expandedFilters=null,expandedFiltersAnchor=null;
function ensureBackdrop(){
  if(backdrop)return backdrop;
  backdrop=document.createElement('div');backdrop.className='chart-backdrop';
  backdrop.addEventListener('click',collapseCurrent);
  document.body.appendChild(backdrop);
  return backdrop;
}
function resizeChartsIn(card){
  card.querySelectorAll('canvas').forEach(cv=>{try{const ch=window.Chart&&Chart.getChart(cv);if(ch)ch.resize();}catch(err){}});
}
function collapseCurrent(){
  if(!expandedCard)return;
  const card=expandedCard,anchor=expandedAnchor;
  card.classList.remove('expanded');
  ensureBackdrop().classList.remove('show');
  const btn=card.querySelector('.chart-expand-btn i');if(btn){btn.classList.remove('fa-compress');btn.classList.add('fa-expand');}
  if(expandedFilters&&expandedFiltersAnchor&&expandedFiltersAnchor.parentNode){
    expandedFilters.classList.remove('in-expanded');
    expandedFiltersAnchor.parentNode.replaceChild(expandedFilters,expandedFiltersAnchor);
  }
  expandedFilters=null;expandedFiltersAnchor=null;
  if(anchor&&anchor.parentNode)anchor.parentNode.replaceChild(card,anchor);
  expandedCard=null;expandedAnchor=null;
  setTimeout(()=>resizeChartsIn(card),50);
}
function expand(card){
  if(expandedCard&&expandedCard!==card)collapseCurrent();
  /* Capturar la vista ANTES de mover la tarjeta — una vez portada a
     <body> ya no tiene un ancestro .view del que colgar los filtros. */
  const view=card.closest('.view');
  const filters=view?view.querySelector('.view-filters'):null;
  /* Portal: mover la tarjeta a <body> evita que un ancestro con animación
     (transform) la atrape como "containing block" y rompa position:fixed. */
  const anchor=document.createComment('expanded-card-anchor');
  card.parentNode.insertBefore(anchor,card);
  document.body.appendChild(card);
  expandedAnchor=anchor;
  card.classList.add('expanded');
  ensureBackdrop().classList.add('show');
  const btn=card.querySelector('.chart-expand-btn i');if(btn){btn.classList.remove('fa-expand');btn.classList.add('fa-compress');}
  /* Traer los filtros de la vista (mes/ciudad/vehículo) dentro de la
     tarjeta expandida, justo debajo del título, para poder ajustarlos
     sin salir del modo ampliado. */
  if(filters){
    const fAnchor=document.createComment('expanded-filters-anchor');
    filters.parentNode.insertBefore(fAnchor,filters);
    const h=card.querySelector('.card-h');
    if(h&&h.nextSibling)h.parentNode.insertBefore(filters,h.nextSibling);
    else card.insertBefore(filters,card.firstChild);
    filters.classList.add('in-expanded');
    expandedFilters=filters;expandedFiltersAnchor=fAnchor;
  }
  expandedCard=card;
  setTimeout(()=>resizeChartsIn(card),50);
}
function initChartExpand(){
  document.querySelectorAll('.card').forEach(card=>{
    if(card.dataset.expandInit)return;
    const wrap=card.querySelector('.card-body .chart-wrap');
    if(!wrap)return;
    card.dataset.expandInit='1';
    const h=card.querySelector('.card-h');
    const btn=document.createElement('button');
    btn.type='button';btn.className='chart-expand-btn';btn.title='Expandir';
    btn.innerHTML='<i class="fa-solid fa-expand"></i>';
    btn.addEventListener('click',()=>{card.classList.contains('expanded')?collapseCurrent():expand(card);});
    if(h){
      const cf=h.querySelector('.cf-bar');
      if(cf){cf.appendChild(btn);}else{h.appendChild(btn);}
    }
  });
}
window.initChartExpand=initChartExpand;
document.addEventListener('DOMContentLoaded',initChartExpand);
if(document.readyState==='complete'||document.readyState==='interactive')initChartExpand();

})();
