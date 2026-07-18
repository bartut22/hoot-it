// supabase/functions/login-otp/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    const { data } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = data.users.some(u => u.email === email)

    if (userExists) {
      await supabaseAdmin.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
    }

    return new Response(
      JSON.stringify({ message: 'If an account exists with that email, a magic link has been sent.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})