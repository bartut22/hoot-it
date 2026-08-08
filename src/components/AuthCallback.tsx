import { useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const handled = useRef(false)

  useEffect(() => {
    let next = searchParams.get("next") ?? "/"
    if (!next.startsWith("/")) next = "/"

    async function maybeClaimReferral() {
      const pendingCode = localStorage.getItem("owlquest_pending_ref");
      if (!pendingCode) return;

      const { data, error } = await supabase.rpc("stage_referral", { p_code: pendingCode });

      if (!error && data) {
        localStorage.removeItem("owlquest_pending_ref");
      }
    }

    async function processSession(session: any) {
      if (handled.current || !session) return
      handled.current = true

      const { data: userRes } = await supabase.auth.getUser()
      const user = userRes?.user
      if (!user) {
        navigate("/login?error=auth-code-error")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, handle, first_login")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError || !profile) {
        navigate("/login?error=auth-code-error")
        return
      }
      
      maybeClaimReferral();

      if (profile.first_login || !profile.handle) {
        const params = new URLSearchParams({
          next,
          email: user.email ?? "",
        })
        navigate(`/onboarding?${params.toString()}`)
        return
      }

      toast.success(`Logged in as ${profile.display_name} (@${profile.handle})`)
      navigate(next)
    }

    supabase.auth.getSession().then(({ data }) => {
      processSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") processSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [navigate, searchParams])

  return <div>Signing you in…</div>
}