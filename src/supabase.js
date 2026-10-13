import {createClient} from '@supabase/supabase-js';
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL || 'https://ufpgotssjxatrxjbjxfv.supabase.co', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_TnpK06bw0gDRAZzFDKXb8w_7DG4aqUv');
export async function getData(user){
 const results=await Promise.all(['profiles','subjects','assessments','notes'].map(t=>supabase.from(t).select('*').eq(t==='profiles'?'id':'user_id',user.id)));
 const err=results.find(r=>r.error);if(err)throw err.error;
 return {profile:results[0].data[0]||null,subjects:results[1].data,assessments:results[2].data,notes:results[3].data};
}
