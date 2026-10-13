import {nextDate} from '../src/calendar.mjs';
export function reminderDue(exam,timezone,now=new Date()){
 if(!exam.reminder_enabled||!['Pendiente','A recuperar','Desaprobado'].includes(exam.status))return false;
 try{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone||'America/Argentina/Cordoba',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));return nextDate(`${parts.year}-${parts.month}-${parts.day}`)===exam.date&&Number(parts.hour)>=9;}catch{return false;}
}
export async function sendReminder(payload,idempotencyKey,{key,fetchImpl=fetch}){
 const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify(payload)});
 if(!response.ok)throw new Error(`Email provider HTTP ${response.status}`);
 const result=await response.json();if(!result.id)throw new Error('Email provider did not confirm acceptance');return result.id;
}
export function startBackgroundJobs(db){let running=false;const enabled=process.env.REMINDERS_ENABLED==='true'&&!!process.env.RESEND_API_KEY&&!!process.env.REMINDER_FROM;
 async function tick(){if(running)return;running=true;try{
 const {data:cleanups,error:cleanupError}=await db.from('pdf_cleanup_queue').select('path').limit(100);
 if(cleanupError)throw cleanupError;
 for(const item of cleanups||[]){const {error}=await db.storage.from('note-pdfs').remove([item.path]);if(!error)await db.from('pdf_cleanup_queue').delete().eq('path',item.path);}
 if(!enabled)return;
 const now=new Date(),lower=new Date(now.getTime()-86400000).toISOString().slice(0,10),upper=new Date(now.getTime()+2*86400000).toISOString().slice(0,10);
 let offset=0;
 while(true){const {data:exams,error}=await db.from('assessments').select('*').eq('reminder_enabled',true).in('status',['Pendiente','A recuperar','Desaprobado']).gte('date',lower).lte('date',upper).order('id').range(offset,offset+99);if(error)throw error;
 for(const exam of exams){try{
 const {data:profile,error:pe}=await db.from('profiles').select('timezone,full_name').eq('id',exam.user_id).single();if(pe||!reminderDue(exam,profile.timezone,now))continue;
 const {data:{user},error:ue}=await db.auth.admin.getUserById(exam.user_id);if(ue||!user?.email||!user.email_confirmed_at)continue;
 const {data:subject,error:se}=await db.from('subjects').select('name').eq('id',exam.subject_id).eq('user_id',exam.user_id).single();if(se)continue;
 // Payload persistido: los reintentos usan exactamente el mismo contenido.
 const payload={from:process.env.REMINDER_FROM,to:[user.email],subject:`Mañana: ${exam.title} · ${subject.name}`,text:`Hola, ${profile.full_name}.\n\nMañana (${exam.date}) tenés ${exam.title} de ${subject.name}.\n\nTemas: ${exam.topics||'Sin temas definidos'}.\n\nRevisá los detalles en Cursiva. Podés desactivar este aviso desde la evaluación.\nTu carrera, a tu ritmo.`};
 const {error:insertError}=await db.from('reminder_deliveries').upsert({assessment_id:exam.id,exam_date:exam.date,user_id:exam.user_id,payload},{onConflict:'assessment_id,exam_date',ignoreDuplicates:true});if(insertError)throw insertError;
 const {data:delivery,error:de}=await db.from('reminder_deliveries').select('*').eq('assessment_id',exam.id).eq('exam_date',exam.date).single();if(de||delivery.sent_at)continue;
 // Cambiar el correo invalida el aviso pendiente; no enviar a una dirección antigua.
 if(delivery.payload.to[0]!==user.email)continue;
 const {data:claims,error:ce}=await db.rpc('claim_reminder',{delivery_id:delivery.id});if(ce)throw ce;if(!claims?.length)continue;
 const {data:latest,error:le}=await db.from('assessments').select('*').eq('id',exam.id).single();if(le||latest.date!==exam.date||!reminderDue(latest,profile.timezone,new Date()))continue;
 try{await sendReminder(delivery.payload,`cursiva/${delivery.id}`,{key:process.env.RESEND_API_KEY});const {error:markError}=await db.from('reminder_deliveries').update({sent_at:new Date().toISOString(),claim_until:null,last_error:null}).eq('id',delivery.id);if(markError)throw markError;}
 catch(e){await db.from('reminder_deliveries').update({last_error:e.message.slice(0,160)}).eq('id',delivery.id);console.error('Reminder delivery failed; retry scheduled.');}
 }catch{console.error('Could not process a reminder.');}}
 if(exams.length<100)break;offset+=100;}
 }catch{console.error('Background jobs unavailable. Check migration and server configuration.');}finally{running=false;}}
 const timer=setInterval(tick,5*60*1000);timer.unref();tick();return()=>clearInterval(timer);
}
