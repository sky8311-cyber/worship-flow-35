import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { missingSongs, foundSongs } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    console.log("AI matching request:", { missingSongs, foundSongs });

    // Lovable AI에게 매칭 요청
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that matches Korean worship song titles. Consider spelling variations, spacing differences, and typos. Return ONLY a JSON array."
          },
          {
            role: "user",
            content: `Match these missing songs with found songs:

Missing songs (expected):
${missingSongs.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

Found songs (in MD body):
${foundSongs.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

Return a JSON array of matches:
[
  { "missing": "expected title", "found": "matched title", "confidence": 0.95 },
  ...
]

Only include matches with confidence > 0.7. If no good match, omit that song.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", response.status, error);
      throw new Error(`AI matching failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("AI response:", content);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const matches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    console.log("Parsed matches:", matches);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
