// supabase/functions/sync-avatar/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const { record } = await req.json()
  const userId = record.id
  const avatarUrl = record.avatar_url

  if (!avatarUrl || avatarUrl.includes("supabase.co/storage")) {
    return new Response("Skipped", { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const imageRes = await fetch(avatarUrl)
    if (!imageRes.ok) throw new Error("Failed to fetch avatar")

    const contentType = imageRes.headers.get("content-type") ?? "image/png"
    const ext = contentType.includes("png") ? "png" : "jpg"
    const buffer = await imageRes.arrayBuffer()

    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType, upsert: true })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path)

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq("id", userId)

    return new Response("OK", { status: 200 })
  } catch (err) {
    console.error("Avatar sync failed:", err)
    return new Response("Error", { status: 500 })
  }
})