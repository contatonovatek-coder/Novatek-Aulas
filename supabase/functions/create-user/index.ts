// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
  const body = await req.json();
  const { email, password, name, role, status, avatar, plan_id } = body;

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ success: false, error: "Dados obrigatórios ausentes" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Supabase com SERVICE ROLE
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Criar usuário no Auth
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 2️⃣ Inserir na tabela users
    const { error: dbError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        nome: name,
        email,
        funcao: role,
        status,
        avatar,
        plan_id: plan_id ?? null
      });


    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, userId: authUser.user.id }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});