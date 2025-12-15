import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const tools = [
  {
    type: "function",
    function: {
      name: "addToInventory",
      description: "Add stock quantity to an existing inventory item. Use when user says things like 'add 50 keyboards to inventory' or 'stock mein 100 jeans add karo'",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Name of the product to add stock to"
          },
          quantity: {
            type: "integer",
            description: "Quantity to add to the inventory"
          }
        },
        required: ["product_name", "quantity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generateInvoice",
      description: "Create an invoice/bill for a customer with items. Use when user says things like 'create bill for Ramesh 2 blue kurti' or 'bill banao customer Amit ke liye'",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Name of the customer"
          },
          items: {
            type: "array",
            description: "List of items to bill",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                quantity: { type: "integer" }
              },
              required: ["product_name", "quantity"]
            }
          },
          payment_mode: {
            type: "string",
            enum: ["cash", "card", "online", "due"],
            description: "Payment method"
          },
          amount_paid: {
            type: "number",
            description: "Amount paid by customer (0 if due)"
          }
        },
        required: ["customer_name", "items"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const systemPrompt = `You are Revonn AI - an intelligent inventory manager assistant for Indian retail shop owners.
You help manage stock and create invoices through natural language commands in Hindi or English.

CAPABILITIES:
1. ADD INVENTORY: When user wants to add stock (e.g., "Add 50 keyboards", "100 jeans stock add karo")
   - Use addToInventory function with product_name and quantity
   
2. CREATE INVOICE: When user wants to create a bill (e.g., "Create bill for Ramesh 2 kurtis", "Amit ke liye 500 rupees ka bill banao")
   - Use generateInvoice function with customer_name, items, payment_mode, amount_paid
   
RULES:
- Always check product availability before billing
- Match user's language (Hindi/English)
- Keep responses SHORT and helpful
- If product not found, suggest creating it first
- For payment: cash, card, online, or due (credit)

Current Time: ${new Date().toISOString()}`;

    // First call to get tool decision
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Check if tool was called
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`Tool called: ${functionName}`, args);

      let toolResult: any;

      if (functionName === "addToInventory") {
        const { data: result, error } = await supabase.rpc("add_inventory_stock", {
          p_user_id: userId,
          p_product_name: args.product_name,
          p_quantity_to_add: args.quantity,
        });

        if (error) {
          console.error("RPC error:", error);
          toolResult = { success: false, error: error.message };
        } else {
          toolResult = result;
        }
      } else if (functionName === "generateInvoice") {
        const { data: result, error } = await supabase.rpc("create_invoice_transaction", {
          p_user_id: userId,
          p_customer_name: args.customer_name,
          p_items: args.items,
          p_payment_mode: args.payment_mode || "cash",
          p_amount_paid: args.amount_paid || 0,
        });

        if (error) {
          console.error("RPC error:", error);
          toolResult = { success: false, error: error.message };
        } else {
          toolResult = result;
        }
      }

      // Get final response with tool result
      const finalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            assistantMessage,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            },
          ],
        }),
      });

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices[0].message.content;

      return new Response(
        JSON.stringify({
          message: finalMessage,
          action: functionName,
          result: toolResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool called - return direct response
    return new Response(
      JSON.stringify({
        message: assistantMessage.content,
        action: null,
        result: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
