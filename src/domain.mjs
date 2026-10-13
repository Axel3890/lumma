export const progress = (items) => { const weight=x=>Math.max(0,Number(x.weight??1));const total=items.reduce((a,x)=>a+weight(x),0);return total ? Math.round(items.filter(x=>x.status==='Aprobado'||x.status==='Completado').reduce((a,x)=>a+weight(x),0)/total*100) : 0; };
export const dateLabel = (value, options={day:'numeric',month:'short'}) => value ? new Date(value+'T12:00:00').toLocaleDateString('es-AR',options) : 'Sin fecha';
export const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const uid = () => crypto.randomUUID();
export const emptyData = () => ({profile:null,subjects:[],assessments:[],notes:[]});
