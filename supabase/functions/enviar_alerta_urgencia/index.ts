import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { soberano_token, radio_km } = await req.json();
    
    // En Deno (Supabase Edge Functions), se usa Deno.env.get en lugar de process.env
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar prestadores en radio de 5km (protocolo interno)
    // Usamos el radio_km provisto o 5 por defecto
    const { data: prestadores, error } = await supabase.rpc('buscar_prestadores_cercanos', { radio: radio_km || 5 });

    if (error) {
      console.error("Error buscando prestadores:", error);
      return new Response(JSON.stringify({ error: "Error buscando prestadores" }), { status: 500 });
    }

    if (prestadores && prestadores.length > 0) {
      // Enviar push a cada uno (Bulk insert para mayor eficiencia en lugar de un forEach)
      const notificaciones = prestadores.map((p: any) => ({
        user_id: p.id,
        titulo: '⚠️ EMERGENCIA - U.G.O. OS',
        mensaje: 'Servicio de alta prioridad detectado. Verifique su radar ahora.'
      }));

      const { error: insertError } = await supabase.from('notificacoes').insert(notificaciones);
      
      if (insertError) {
        console.error("Error insertando notificaciones:", insertError);
        return new Response(JSON.stringify({ error: "Error enviando alertas" }), { status: 500 });
      }
    }

    return new Response("Alerta desplegada.", { status: 200 });
  } catch (err) {
    console.error("Error procesando la solicitud:", err);
    return new Response("Error interno del servidor", { status: 500 });
  }
});
