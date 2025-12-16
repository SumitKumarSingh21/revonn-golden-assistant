import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, text, mimeType = "image/jpeg" } = await req.json();

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
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
8. Return ONLY valid JSON, no explanations

EXAMPLES:
- "Sugar 2kg @50" → {"name": "Sugar", "quantity": 2, "price": 50}
- "चावल 5 किलो" → {"name": "Rice", "quantity": 5, "price": 0}
- "Blue Shirt M x3" → {"name": "Shirt", "quantity": 3, "price": 0, "size": "M", "color": "Blue"}`;

    let requestBody: any;

    if (image) {
      // Image-based parsing using Gemini Vision
      requestBody = {
        contents: [{
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: image.replace(/^data:image\/\w+;base64,/, "")
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048
        }
      };
    } else {
      // Text-based parsing
      requestBody = {
        contents: [{
          parts: [
            { text: systemPrompt + "\n\nDocument content:\n" + text }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048
        }
      };
    }

    console.log("Calling Gemini for BOM parsing...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini BOM response:", JSON.stringify(data, null, 2));

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error("No response from Gemini");
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
      // Return empty items if parsing fails
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
