import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Tool definitions for function calling
const tools = [
  {
    type: "function",
    function: {
      name: "addToInventory",
      description: "Add stock quantity to an existing inventory item or create a new item. Use when user says things like 'add 50 keyboards to inventory', 'stock mein 100 jeans add karo', or 'Add 100 Red Pens'",
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
          },
          price: {
            type: "number",
            description: "Price per unit (optional, for new items)"
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
      description: "Create an invoice/bill for a customer with items. Use when user says things like 'create bill for Ramesh 2 blue kurti', 'bill banao customer Amit ke liye', or 'Make a bill for John for 5 apples'",
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

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const systemPrompt = `You are Revonn AI - an intelligent inventory manager assistant for Indian retail shop owners.
You help manage stock and create invoices through natural language commands in Hindi or English.

CAPABILITIES:
1. ADD INVENTORY: When user wants to add stock (e.g., "Add 50 keyboards", "100 jeans stock add karo", "Add 100 Red Pens")
   - Use addToInventory function with product_name and quantity
   - If product doesn't exist, it will be created
   
2. CREATE INVOICE: When user wants to create a bill (e.g., "Create bill for Ramesh 2 kurtis", "Amit ke liye 500 rupees ka bill banao", "Bill John for 2 Apples")
   - Use generateInvoice function with customer_name, items, payment_mode, amount_paid
   
RULES:
- Always respond in the SAME LANGUAGE as the user (Hindi/English)
- If user speaks Hindi, respond in Hindi
- If user speaks English, respond in English
- Keep responses SHORT and helpful
- For greetings like "Hello", respond friendly without calling functions
- If product not found during billing, inform user to add it first
- For payment: cash, card, online, or due (credit)

Current Time: ${new Date().toISOString()}`;

    // Call Lovable AI Gateway with function calling
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const assistantMessage = data.choices?.[0]?.message;
    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    // Check if tool was called
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`Function called: ${functionName}`, args);

      let toolResult: any;

      if (functionName === "addToInventory") {
        // First try to find existing product
        const { data: existingProduct } = await supabase
          .from("inventory")
          .select("id, name, quantity")
          .eq("user_id", userId)
          .ilike("name", `%${args.product_name}%`)
          .limit(1)
          .single();

        if (existingProduct) {
          // Update existing product
          const newQuantity = (existingProduct.quantity || 0) + args.quantity;
          const { error } = await supabase
            .from("inventory")
            .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq("id", existingProduct.id);

          if (error) {
            toolResult = { success: false, error: error.message };
          } else {
            toolResult = {
              success: true,
              product_name: existingProduct.name,
              previous_quantity: existingProduct.quantity,
              added: args.quantity,
              new_quantity: newQuantity
            };
          }
        } else {
          // Create new product
          const { error } = await supabase
            .from("inventory")
            .insert({
              user_id: userId,
              name: args.product_name,
              quantity: args.quantity,
              price: args.price || 0
            });

          if (error) {
            toolResult = { success: false, error: error.message };
          } else {
            toolResult = {
              success: true,
              product_name: args.product_name,
              previous_quantity: 0,
              added: args.quantity,
              new_quantity: args.quantity,
              created_new: true
            };
          }
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
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      const finalMessage = finalData.choices?.[0]?.message?.content || 
        (toolResult.success 
          ? `Done! ${functionName === "addToInventory" ? `Added ${args.quantity} ${args.product_name}` : `Bill created for ${args.customer_name}`}`
          : `Error: ${toolResult.error}`);

      return new Response(
        JSON.stringify({
          message: finalMessage,
          action: functionName,
          result: toolResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No function called - return text response
    return new Response(
      JSON.stringify({
        message: assistantMessage.content || "I'm here to help with inventory and billing.",
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
