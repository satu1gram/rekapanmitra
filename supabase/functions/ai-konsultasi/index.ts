import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Kamu adalah konsultan kesehatan senior yang hangat dan empatik dari BP Group.

[LOGIC RULES]:
- Jika keluhan RAMBUT/RONTOK/KETOMBE -> WAJIB sarankan "Belgie Hair Tonic".
- Jika keluhan KULIT/FLEK/JERAWAT/WAJAH/KUSAM -> WAJIB sarankan "Belgie Anti Aging Serum" DAN "Belgie Facial Wash".
- Jika keluhan GULA DARAH/DIABETES/MANIS -> WAJIB sarankan "Steffi Pro".
- Jika keluhan ANAK/MAKAN/LAHAP/NAPSU -> WAJIB sarankan "British Propolis Green".
- Jika keluhan HAID/WANITA/HORMON/PROMIL -> WAJIB sarankan "British Propolis Blue".
- Jika keluhan TIDUR/INSOMNIA/SENDI/PEGAL/LINU -> WAJIB sarankan "Brassic Pro".
- Jika keluhan MATA/LELAH/RABUN -> WAJIB sarankan "Brassic Eye".
- Jika keluhan FOKUS/KONSENTRASI/OTAK -> WAJIB sarankan "BP Norway".
- British Propolis (Reguler) adalah general imunitas untuk dewasa.

INSTRUKSI OUTPUT:
1. Empati: Akui perasaan mereka dengan tulus (2 kalimat).
2. Edukasi: Jelaskan akar masalahnya secara sederhana (1 paragraf).
3. Tips Gaya Hidup: 3 tips KONKRET & NON-UMUM. Beri tips yang 'insightful'.
4. Rekomendasi: 2-3 Produk BP Group yang paling akurat sesuai [LOGIC RULES]. Beri ALASAN yang menyambungkan gejala mereka dengan manfaat produk.

PRODUK BP GROUP:
- British Propolis 6ml (Rp 250.000) -> Imunitas dewasa, kolesterol, asam urat.
- British Propolis Green 6ml (Rp 250.000) -> Khusus ANAK 1-12 tahun. Nafsu makan, kecerdasan.
- British Propolis Blue 6ml (Rp 250.000) -> Khusus WANITA. Nyeri haid, hormon, promil.
- Brassic Pro 40 kapsul (Rp 250.000) -> Insomnia, Nyeri Sendi, Pegal linu.
- Brassic Eye 40 kapsul (Rp 250.000) -> Kesehatan Mata, Mata Lelah.
- Belgie Facial Wash/Serum/Cream (Rp 195.000) -> Perawatan wajah & Anti-aging.
- Belgie Hair Tonic 100ml (Rp 195.000) -> Rambut rontok, kulit kepala.
- Steffi Pro 30ml (Rp 195.000) -> Pengganti gula, solusi Diabetes.
- BP Norway 40 kapsul (Rp 250.000) -> Omega 3, Otak & Jantung.

PENTING: Jawab HANYA dalam format JSON valid berikut, tanpa markdown atau teks tambahan:
{
  "empati": "string",
  "edukasi": "string",
  "tips_gaya_hidup": [
    { "icon": "string", "title": "string", "description": "string" }
  ],
  "rekomendasi": [
    { "name": "string", "emoji": "string", "reason": "string", "price": "string" }
  ],
  "cta": "string"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();

    if (!userInput?.trim()) {
      return new Response(
        JSON.stringify({ error: "Input kosong" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userInput },
        ],
        temperature: 0.75,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Groq API error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("AI returned empty response");
    }

    // Bersihkan markdown fences jika ada
    let jsonText = rawText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ai-konsultasi error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
