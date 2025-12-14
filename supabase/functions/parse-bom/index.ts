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
    const { content, contentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an intelligent BOM (Bill of Materials) parser for an Indian retail inventory system.

TASK: Extract inventory items from the provided bill/invoice content.

For each item found, extract:
- name: Product name (in English)
- quantity: Number of units
- price: Unit price in INR (if available)
- size: Size if mentioned (S, M, L, XL, etc.)
- color: Color if mentioned
- sku: SKU/Article number if available
- category: Inferred category (Clothing, Electronics, etc.)

RULES:
1. Parse carefully - don't miss any items
2. If quantity not specified, assume 1
3. Convert all prices to numbers (remove ₹, Rs, etc.)
4. Normalize sizes (Small → S, Medium → M, etc.)
5. If the content appears to be a CSV, parse each row
6. If it's a photo/OCR text, extract items from the text
7. Handle Hindi/English mixed content

RESPOND ONLY WITH VALID JSON:
{
  "items": [
    {
      "name": "Blue Denim Jeans",
      "quantity": 5,
      "price": 1200,
      "size": "M",
      "color": "Blue",
      "sku": "JNS-001",
      "category": "Clothing"
    }
  ],
  "summary": "Found X items totaling ₹Y"
}`;

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
          { role: "user", content: `Parse this bill/BOM content (type: ${contentType}):\n\n${content}` },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI parse error:", response.status, text);
      return new Response(JSON.stringify({ error: "Failed to parse BOM" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Extract JSON from response
    let parsedItems;
    try {
      // Try to find JSON in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedItems = JSON.parse(jsonMatch[0]);
      } else {
        parsedItems = JSON.parse(aiResponse);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e, aiResponse);
      return new Response(JSON.stringify({ 
        error: "Failed to parse items",
        items: [],
        raw: aiResponse
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsedItems), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("BOM parse error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
