import {supabase,getData} from './supabase';
export const hasBackend=!!import.meta.env.VITE_API_URL;
const base=import.meta.env.VITE_API_URL?.replace(/\/$/,'');
export async function apiRequest(path,options={}){const {data:{session}}=await supabase.auth.getSession();if(!base)throw new Error('El servidor todavía no está configurado.');const res=await fetch(base+path,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token}`}});if(!res.ok){let message='No se pudo completar la solicitud.';try{message=(await res.json()).error||message;}catch{}throw new Error(message);}return res.status===204?null:res.json();}
const request=apiRequest;
export const loadWorkspace=user=>base?request('/api/workspace'):getData(user);
export async function upsertRecord(table,record,user){const t=table==='profile'?'profiles':table;const payload=table==='profile'?{...record,id:user.id}:{...record,user_id:user.id};if(base)return request(`/api/${t}/${payload.id}`,{method:'PUT',body:JSON.stringify(payload)});const {data,error}=await supabase.from(t).upsert(payload).select().single();if(error)throw error;return data;}
export async function deleteRecord(table,id,user){if(base)return request(`/api/${table}/${id}`,{method:'DELETE'});const {error}=await supabase.from(table).delete().eq('id',id).eq('user_id',user.id);if(error)throw error;}
