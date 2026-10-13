const legacy={sage:'#78945b',lavender:'#a398c0',peach:'#caa589',blue:'#97aec2'};
export const normalizeColor=value=>/^#[0-9a-f]{6}$/i.test(value||'')?value.toLowerCase():legacy[value]||legacy.sage;
export function subjectStyle(value){const hex=normalizeColor(value);const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));const tint=rgb.map(n=>Math.round(n*.16+255*.84));return {'--accent':hex,backgroundColor:`rgb(${tint.join(',')})`};}
