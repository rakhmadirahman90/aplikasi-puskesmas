const INTEGER = /^-?\d+$/;
const DECIMAL = /^-?\d+\.\d+$/;
const DATE_LIKE = /^\d{4}-\d{1,2}-\d{1,2}$/;
const TIME_LIKE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const ID_LIKE = /^(NIP|NIK|ID|NO\.?|KODE|BATCH|TAHUN|TANGGAL|JAM)/i;
const SKIP = new Set(['SCRIPT','STYLE','TEXTAREA','OPTION','CODE','PRE']);

const idNumber = new Intl.NumberFormat('id-ID',{maximumFractionDigits:20,useGrouping:true});
export const formatSmartNumber=(value:number|string)=>{
  const n=typeof value==='number'?value:Number(value);
  return Number.isFinite(n)?idNumber.format(n):String(value);
};

const eligible=(node:Text)=>{
  const p=node.parentElement;if(!p||SKIP.has(p.tagName)||p.closest('[data-no-smart-number]')) return false;
  if(p.closest('input,textarea,select,[contenteditable="true"]')) return false;
  return true;
};
const transform=(node:Text)=>{
  if(!eligible(node))return;
  const raw=node.nodeValue||''; if(!raw.trim()||DATE_LIKE.test(raw.trim())||TIME_LIKE.test(raw.trim()))return;
  const label=(node.parentElement?.textContent||'').trim(); if(ID_LIKE.test(label))return;
  node.nodeValue=raw.replace(/(?<![\w.,-])-?\d+(?:\.\d+)?(?![\w.,])/g,(m)=>{
    if(!INTEGER.test(m)&&!DECIMAL.test(m))return m;
    if(/^0\d+/.test(m)||/^\d{4}$/.test(m))return m;
    const n=Number(m); if(!Number.isFinite(n)||Math.abs(n)<1000)return m;
    return formatSmartNumber(n);
  });
};
const walk=(root:Node)=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes:Text[]=[];while(w.nextNode())nodes.push(w.currentNode as Text);nodes.forEach(transform);};
export const installSmartNumericFormatting=()=>{
  if(typeof document==='undefined')return;
  const start=()=>{walk(document.body);const obs=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)transform(n as Text);else if(n.nodeType===Node.ELEMENT_NODE)walk(n);})));obs.observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
};
