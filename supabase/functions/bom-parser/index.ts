import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, text, mimeType = "image/jpeg" } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!image && !text) {
      throw new Error("Either image (base64) or text is required");
    }

    const systemPrompt = `You are an expert at extracting item information from bills, invoices, and inventory lists.

TASK: Extract items from the provided bill/invoice/list.

OUTPUT FORMAT (STRICT JSON):
{
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "price": 0,
      "size": "",
      "color": ""
    }
  ]
}

RULES:
1. Extract ACTUAL items from the document - DO NOT make up fake data
2. If quantity is not visible, default to 1
3. If price is not visible, set to 0
4. Extract size and color if mentioned
5. Ignore headers, footers, company names, dates, invoice numbers
6. Handle messy handwriting - extract what you can read
7. For Hindi text, translate item names to English
8. Return ONLY valid JSON, no explanations`;

    let userContent: any[];

    if (image) {
      // Image-based parsing using vision
      const imageData = image.replace(/^data:image\/\w+;base64,/, "");
      userContent = [
        { type: "text", text: systemPrompt + "\n\nExtract items from this image:" },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageData}`
          }
        }
      ];
    } else {
      // Text-based parsing
      userContent = [
        { type: "text", text: systemPrompt + "\n\nDocument content:\n" + text }
      ];
    }

    console.log("Calling AI Gateway for BOM parsing...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again.", items: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI BOM response:", JSON.stringify(data, null, 2));

    const textContent = data.choices?.[0]?.message?.content;
    
    if (!textContent) {
      throw new Error("No response from AI");
    }

    // Extract JSON from response
    let parsedItems;
    try {
      // Try to find JSON in the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedItems = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw:", textContent);
      parsedItems = { items: [] };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...parsedItems,
        raw_response: textContent
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("BOM parser error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        items: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
