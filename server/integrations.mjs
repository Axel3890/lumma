import {createHash,randomBytes} from 'node:crypto';
import {calendarICS} from '../src/calendar.mjs';
export const hashToken=token=>createHash('sha256').update(token).digest('hex');
export function publicFeed(app,admin){
 app.get('/calendar/:token.ics',async(req,res)=>{res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});if(!admin)return res.status(503).send('Calendar service not configured');if(!/^[0-9a-f]{64}$/.test(req.params.token))return res.sendStatus(404);
 try{const {data:sub,error}=await admin.from('calendar_subscriptions').select('user_id').eq('token_hash',hashToken(req.params.token)).maybeSingle();if(error)throw error;if(!sub)return res.sendStatus(404);
 async function all(table){const rows=[];for(let n=0;;n+=500){const {data,error}=await admin.from(table).select('*').eq('user_id',sub.user_id).order('id').range(n,n+499);if(error)throw error;rows.push(...data);if(data.length<500)return rows;}}
 const [exams,subjects]=await Promise.all([all('assessments'),all('subjects')]);res.type('text/calendar; charset=utf-8').send(calendarICS(exams,subjects));}catch{res.status(503).send('Calendar temporarily unavailable');}});
}
export function privateIntegrations(app,admin){
 app.get('/api/integrations/status',(_,res)=>res.json({reminders:!!admin&&process.env.REMINDERS_ENABLED==='true'&&!!process.env.RESEND_API_KEY&&!!process.env.REMINDER_FROM,calendar:!!admin&&!!process.env.PUBLIC_API_URL}));
 app.get('/api/calendar/subscription',async(req,res)=>{if(!admin)return res.status(503).json({error:'El servicio de calendario todavía no está configurado.'});const {data,error}=await admin.from('calendar_subscriptions').select('created_at').eq('user_id',req.user.id).maybeSingle();if(error)return res.status(503).json({error:'Falta actualizar la configuración del calendario.'});res.json({enabled:!!data});});
 app.post('/api/calendar/subscription',async(req,res)=>{if(!admin||!process.env.PUBLIC_API_URL)return res.status(503).json({error:'El servicio de calendario todavía no está configurado.'});let base;try{base=new URL(process.env.PUBLIC_API_URL);if(base.protocol!=='https:')throw new Error();}catch{return res.status(503).json({error:'La suscripción necesita un servidor público con HTTPS.'});}const token=randomBytes(32).toString('hex');const {error}=await admin.from('calendar_subscriptions').upsert({user_id:req.user.id,token_hash:hashToken(token),created_at:new Date().toISOString()});if(error)return res.status(503).json({error:'No se pudo crear el enlace de calendario.'});res.set('Cache-Control','no-store').json({url:new URL(`/calendar/${token}.ics`,base).href});});
 app.delete('/api/calendar/subscription',async(req,res)=>{if(!admin)return res.status(503).json({error:'Servicio no configurado.'});const {error}=await admin.from('calendar_subscriptions').delete().eq('user_id',req.user.id);if(error)return res.status(503).json({error:'No se pudo revocar el enlace.'});res.status(204).end();});
}
