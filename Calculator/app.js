// app.js - logic, uses math.js for safe evaluation
const displayEl = document.getElementById('display');
const historyEl = document.getElementById('history');
let expression = '';
let justCalculated = false;
let memoryValue = 0; // memory for M+, M-, MR

function refreshDisplay(){
  displayEl.textContent = expression === '' ? '0' : expression;
  displayEl.classList.remove('bounce');
  void displayEl.offsetWidth;
  displayEl.classList.add('bounce');
}

function formatResult(num){
  if (!isFinite(num)) return '⚠️ 除数不能为 0';
  let rounded = Math.round(num * 1e12) / 1e12;
  let str = String(rounded);
  if (str.length > 14) str = rounded.toExponential(6);
  return str;
}

function popEmoji(x,y){
  const emojis=['🎉','✨','🌈','💖','🍬','⭐','🥳','🧁'];
  const el=document.createElement('div');el.className='emoji-pop';el.textContent=emojis[Math.floor(Math.random()*emojis.length)];el.style.left=(x-20)+'px';el.style.top=(y-20)+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),900);
}

// Normalize display operators to math.js-friendly ones
function normalize(expr){
  return expr.replace(/\u2212/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/％/g,'%').replace(/\u00A0/g,'');
}

// Replace percentages like 50% -> (50/100)
function replacePercents(expr){
  return expr.replace(/(\d+(?:\.\d+)?)(%+)/g,(m,num,pct)=>{
    let res=num;
    for(let i=0;i<pct.length;i++) res=`(${res}/100)`;
    return res;
  });
}

function safeEvaluate(displayExpr){
  const lib = window.math;
  if (!lib) throw new Error('math.js 未加载');
  let expr = normalize(displayExpr);
  expr = replacePercents(expr);
  // allow digits, operators, parens, decimal and whitespace
  if (!/^[0-9+\-*/().%\s]+$/.test(expr)) throw new Error('非法字符');
  // use math.evaluate which is safer than Function
  return lib.evaluate(expr);
}

function inputValue(val){
  if (justCalculated){
    if (/^[0-9.]$/.test(val)) { expression=''; historyEl.textContent=''; }
    justCalculated=false;
  }
  if (expression.length>200) return;
  const isOperator=['+','−','×','÷','%'].includes(val);
  const last=expression.slice(-1);
  if (isOperator){
    if (expression==='') return;
    if (['+','−','×','÷','%'].includes(last)) expression=expression.slice(0,-1)+val; else expression+=val;
  } else if (val==='.'){
    const parts=expression.split(/[+−×÷%()]/);
    const cur=parts[parts.length-1]||'';
    if (cur.includes('.')) return;
    if (cur==='') expression+='0.'; else expression+='.';
  } else {
    // avoid multiple leading zeros
    if (last==='0' && /^\d$/.test(val) && (expression.length===1 || /[+−×÷%()]/.test(expression.slice(-2,-1)))) expression=expression.slice(0,-1)+val; else expression+=val;
  }
  refreshDisplay();
}

function deleteLast(){ justCalculated=false; expression=expression.slice(0,-1); refreshDisplay(); }
function clearAll(){ expression=''; historyEl.textContent=''; justCalculated=false; refreshDisplay(); }

function calculate(){ if (expression==='') return; let expr=expression; while (/[+−×÷]$/.test(expr)) expr=expr.slice(0,-1); if (expr==='') return; try{ const val=safeEvaluate(expr); const out=formatResult(val); historyEl.textContent=expr+' ='; expression=out.startsWith('⚠️')? '' : out; justCalculated=true; displayEl.textContent=out; displayEl.classList.remove('bounce'); void displayEl.offsetWidth; displayEl.classList.add('bounce'); }catch(e){ displayEl.textContent='😵 出错了'; expression=''; console.error(e); } }

// Memory handlers
function memPlus(){ try{ const cur=parseFloat(safeEvaluate(expression||displayEl.textContent)); if (!isFinite(cur)) return; memoryValue += cur; }catch(e){ console.warn('M+ error',e); } }
function memMinus(){ try{ const cur=parseFloat(safeEvaluate(expression||displayEl.textContent)); if (!isFinite(cur)) return; memoryValue -= cur; }catch(e){ console.warn('M- error',e); } }
function memRecall(){ // insert memory value into expression
  const memStr = String(memoryValue);
  if (justCalculated) { expression = ''; historyEl.textContent=''; justCalculated=false; }
  if (expression==='' || /[+−×÷(]$/.test(expression)) expression += memStr; else expression += memStr; refreshDisplay(); }

// Event binding
document.querySelectorAll('button.btn').forEach(btn=>{
  btn.addEventListener('click',e=>{
    const act=btn.dataset.action; const val=btn.dataset.value;
    if (act==='clear') clearAll(); else if (act==='delete') deleteLast(); else if (act==='equals'){ calculate(); if (!displayEl.textContent.startsWith('⚠️') && !displayEl.textContent.startsWith('😵')) popEmoji(e.clientX,e.clientY); }
    else if (act==='mplus') memPlus(); else if (act==='mminus') memMinus(); else if (act==='mrecall') memRecall(); else if (val!==undefined) inputValue(val);
  });
});

// long-press delete
const btnDel=document.querySelector('.btn-del'); let delInterval=null; if(btnDel){ btnDel.addEventListener('pointerdown',e=>{ deleteLast(); delInterval=setInterval(deleteLast,110); btnDel.setPointerCapture && btnDel.setPointerCapture(e.pointerId); }); ['pointerup','pointercancel','pointerleave'].forEach(ev=>btnDel.addEventListener(ev,()=>{ clearInterval(delInterval); delInterval=null;})); }

// keyboard
document.addEventListener('keydown',e=>{
  const k=e.key; if (/^[0-9]$/.test(k)) inputValue(k); else if (k==='.') inputValue('.'); else if (k==='+') inputValue('+'); else if (k==='-') inputValue('−'); else if (k==='*') inputValue('×'); else if (k==='/'){ e.preventDefault(); inputValue('÷'); } else if (k==='%') inputValue('%'); else if (k==='(') inputValue('('); else if (k===')') inputValue(')'); else if (k==='Enter' || k==='='){ e.preventDefault(); calculate(); } else if (k==='Backspace'){ e.preventDefault(); deleteLast(); } else if (k==='Escape') clearAll();
});

// paste support
document.addEventListener('paste',e=>{
  const text=(e.clipboardData||window.clipboardData).getData('text'); if(!text) return; const norm=normalize(text); if(/^[0-9+\-*/().%]+$/.test(norm)){ if(justCalculated){ expression=''; historyEl.textContent=''; justCalculated=false; } expression+=norm; refreshDisplay(); e.preventDefault(); }
});

// click to copy result
displayEl.addEventListener('click',async()=>{ const text=displayEl.textContent; try{ await navigator.clipboard.writeText(text); popEmoji(window.innerWidth/2,window.innerHeight/2); }catch(e){ console.warn('复制失败',e); } });

// floating bubbles (cosmetic)
const bubbleColors=['#f7a8c4','#f9c8a0','#f7dd8e','#a8dfc0','#a9c4f0','#cbb2f0']; for(let i=0;i<12;i++){ const b=document.createElement('div'); b.className='bubble'; const s=10+Math.random()*40; b.style.width=b.style.height=s+'px'; b.style.left=Math.random()*100+'vw'; b.style.background=bubbleColors[i%bubbleColors.length]; b.style.position='fixed'; b.style.bottom='-60px'; b.style.borderRadius='50%'; b.style.opacity='0.28'; b.style.filter='blur(1px)'; b.style.animation='floatUp '+(8+Math.random()*8)+'s linear infinite'; b.style.zIndex='0'; document.body.appendChild(b); }
