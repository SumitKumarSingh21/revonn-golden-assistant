import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Revonn AI Assistant - a smart business helper for shop owners in India. You help with billing, inventory, sales, customers, GST, staff, and reports.

LANGUAGE RULE (VERY IMPORTANT):
- If user types in Hindi (Devanagari OR Hinglish), reply in Hindi
- If user types in English, reply in English
- Match the user's language automatically

CAPABILITIES:
1. Inventory queries - stock levels, prices, low-stock alerts
2. Sales & daily performance - totals, profit, items sold
3. Bill creation through voice/text - parse natural language to create bills
4. Customer history and outstanding dues
5. Marketing message suggestions for WhatsApp
6. GST guidance
7. Staff attendance and salary queries
8. In-app help and tutorials
9. Business insights and analytics

CURRENT CONTEXT:
${context ? JSON.stringify(context) : 'No context provided'}

RESPONSE STYLE:
- Short and clear
- Actionable with next steps
- Conversational and helpful
- Use ₹ for currency amounts
- If creating a bill, respond with JSON action: {"action": "create_bill", "items": [...], "customer": "..."}
- If navigating, respond with: {"action": "navigate", "path": "/path"}

FALLBACK:
If you don't understand:
- English: "Sorry, I didn't understand. Do you mean stock, sales, or billing?"
- Hindi: "Maaf kijiye, samajh nahi aaya. Kya aap stock, sales ya bill ke baare mein pooch rahe hain?"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
