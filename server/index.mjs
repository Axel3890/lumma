import express from 'express';
import cors from 'cors';
import {createClient} from '@supabase/supabase-js';
import {progress} from '../src/domain.mjs';
import {startBackgroundJobs} from './reminders.mjs';
import {publicFeed,privateIntegrations} from './integrations.mjs';
const app=express();
const url=process.env.SUPABASE_URL||'https://ufpgotssjxatrxjbjxfv.supabase.co';
const key=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_TnpK06bw0gDRAZzFDKXb8w_7DG4aqUv';
const admin=process.env.SUPABASE_SERVICE_ROLE_KEY?createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;
app.disable('x-powered-by');
app.use(cors({origin:(process.env.ALLOWED_ORIGIN||'http://127.0.0.1:5173').split(',')}));
app.use(express.json({limit:'100kb'}));
app.get('/api/health',(_,res)=>res.json({ok:true,service:'cursiva-api'}));
publicFeed(app,admin);
app.use('/api',async(req,res,next)=>{
 try{const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)return res.status(401).json({error:'Iniciá sesión para continuar.'});
 const db=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return res.status(401).json({error:'Sesión inválida o vencida.'});
 req.db=db;req.user=user;next();}catch{res.status(503).json({error:'No se pudo verificar la sesión.'});}
});
privateIntegrations(app,admin);
app.get('/api/workspace',async(req,res)=>{
 const results=await Promise.all(['profiles','subjects','assessments','notes'].map(t=>req.db.from(t).select('*').eq(t==='profiles'?'id':'user_id',req.user.id)));
 const failed=results.find(r=>r.error);if(failed)return res.status(400).json({error:failed.error.message});
 res.json({profile:results[0].data[0]||null,subjects:results[1].data,assessments:results[2].data,notes:results[3].data});
});
const fields={profiles:['full_name','career','university','years','current_year','timezone'],subjects:['name','year','semester','teacher','schedule','description','color','status'],assessments:['subject_id','title','type','date','topics','status','grade','weight','recovery_of','reminder_enabled'],notes:['subject_id','title','content','url','created_at']};
app.put('/api/:table/:id',async(req,res)=>{
 const {table,id}=req.params;if(!fields[table])return res.sendStatus(404);
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:'Identificador inválido.'});
 if(table==='profiles'&&id!==req.user.id)return res.sendStatus(403);
 const record=Object.fromEntries(fields[table].filter(k=>Object.hasOwn(req.body,k)).map(k=>[k,req.body[k]]));
 if(table==='profiles'&&record.timezone){try{new Intl.DateTimeFormat('es',{timeZone:record.timezone});}catch{return res.status(400).json({error:'Zona horaria inválida.'});}}
 Object.assign(record,{id},table==='profiles'?{}:{user_id:req.user.id});
 const {data,error}=await req.db.from(table).upsert(record).select().single();
 if(error)return res.status(400).json({error:error.message});res.json(data);
});
app.delete('/api/:table/:id',async(req,res)=>{
 const {table,id}=req.params;if(!fields[table]||table==='profiles')return res.sendStatus(404);
 const {error}=await req.db.from(table).delete().eq('id',id).eq('user_id',req.user.id);
 if(error)return res.status(400).json({error:error.message});res.status(204).end();
});
app.get('/api/summary',async(req,res)=>{
 const {data,error}=await req.db.from('assessments').select('*').eq('user_id',req.user.id);
 if(error)return res.status(400).json({error:error.message});res.json({activityProgress:progress(data),assessmentCount:data.length});
});
app.use((error,req,res,next)=>res.status(error.status||500).json({error:error.status===413?'Contenido demasiado grande.':'No se pudo completar la solicitud.'}));
if(admin)startBackgroundJobs(admin);
app.listen(Number(process.env.PORT||3001),process.env.HOST||'127.0.0.1',()=>console.log(`Cursiva API http://127.0.0.1:${process.env.PORT||3001}`));
