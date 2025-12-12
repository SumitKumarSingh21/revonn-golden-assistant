/**
 * Integration Stubs for Revonn App
 * 
 * This file contains mocked functions and sample payloads for all external integrations.
 * Replace these with real API calls when connecting to backend services.
 * 
 * Environment Variables Required (to be set on server):
 * - WHATSAPP_API_TOKEN: WhatsApp Cloud API access token
 * - OPENAI_API_KEY: OpenAI API key for AI features
 * - STORAGE_BUCKET_URL: Cloud storage URL for PDFs
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_ANON_KEY: Supabase anonymous key
 */

// ============================================
// AUTH STUBS
// ============================================

/**
 * TODO: Replace with actual OTP authentication
 * 
 * Endpoint: POST /auth/send-otp
 * Request: { phone: "+91XXXXXXXXXX" }
 * Response: { success: true, sessionId: "uuid" }
 * 
 * Endpoint: POST /auth/verify-otp
 * Request: { sessionId: "uuid", otp: "123456" }
 * Response: { success: true, user: { id, name, phone, role }, token: "jwt" }
 */
export const authMock = {
  sendOtp: async (phone: string): Promise<{ success: boolean; sessionId: string }> => {
    console.log('[MOCK] Sending OTP to:', phone);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, sessionId: 'mock-session-' + Date.now() };
  },

  verifyOtp: async (sessionId: string, otp: string): Promise<{ success: boolean; user: any; token: string }> => {
    console.log('[MOCK] Verifying OTP:', { sessionId, otp });
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      user: {
        id: 'user-' + Date.now(),
        name: 'Demo Merchant',
        phone: '+919876543210',
        role: 'owner',
        shopName: 'Revonn Demo Store',
        gstin: '27AABCU9603R1ZX',
        state: 'Maharashtra'
      },
      token: 'mock-jwt-token'
    };
  },

  signOut: async (): Promise<{ success: boolean }> => {
    console.log('[MOCK] Signing out');
    return { success: true };
  }
};

// ============================================
// STORAGE STUBS
// ============================================

/**
 * TODO: Replace with actual cloud storage
 * 
 * Endpoint: POST /storage/upload
 * Request: FormData with file
 * Response: { success: true, url: "https://storage.example.com/file.pdf" }
 */
export const storageMock = {
  uploadPdf: async (file: Blob, fileName: string): Promise<{ success: boolean; url: string }> => {
    console.log('[MOCK] Uploading PDF:', fileName);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      url: `mock://storage/${fileName}`
    };
  },

  uploadImage: async (file: Blob, fileName: string): Promise<{ success: boolean; url: string }> => {
    console.log('[MOCK] Uploading Image:', fileName);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      url: `mock://storage/${fileName}`
    };
  }
};

// ============================================
// WHATSAPP STUBS
// ============================================

/**
 * TODO: Replace with WhatsApp Cloud API
 * 
 * Endpoint: POST https://graph.facebook.com/v18.0/{phone-number-id}/messages
 * Headers: { Authorization: "Bearer {WHATSAPP_API_TOKEN}" }
 * Request: {
 *   messaging_product: "whatsapp",
 *   to: "919876543210",
 *   type: "template" | "document" | "text",
 *   template: { name: "invoice_share", language: { code: "en" } },
 *   document: { link: "https://...", filename: "invoice.pdf" },
 *   text: { body: "Message content" }
 * }
 * Response: { messaging_product: "whatsapp", contacts: [...], messages: [...] }
 */
export const whatsappMock = {
  sendMessage: async (phone: string, text: string, pdfUrl?: string): Promise<{ success: boolean; messageId: string }> => {
    console.log('[MOCK] WhatsApp message:', { phone, text, pdfUrl });
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      messageId: 'wa-msg-' + Date.now()
    };
  },

  sendBroadcast: async (phones: string[], text: string): Promise<{ success: boolean; sent: number; failed: number }> => {
    console.log('[MOCK] WhatsApp broadcast to', phones.length, 'numbers');
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      sent: phones.length,
      failed: 0
    };
  }
};

// ============================================
// AI STUBS
// ============================================

/**
 * TODO: Replace with OpenAI or Lovable AI Gateway
 * 
 * Endpoint: POST /ai/chat
 * Request: { messages: [{ role: "user", content: "..." }], context: {...} }
 * Response: { response: "AI generated text", action?: { type: "...", data: {...} } }
 * 
 * Endpoint: POST /ai/parse-bill
 * Request: { text: "OCR extracted text" }
 * Response: { items: [{ name, qty, price, ... }] }
 */
export const aiMock = {
  chat: async (message: string, context?: any): Promise<{ response: string; action?: any }> => {
    console.log('[MOCK AI] Processing:', message);
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerMessage = message.toLowerCase();

    // Stock query
    if (lowerMessage.includes('stock') || lowerMessage.includes('sold out')) {
      return {
        response: "Let me check the inventory for you. Based on current stock levels, you have 15 Blue Kurtis in Size M available. The last sale was 2 hours ago.",
        action: { type: 'check_stock', data: { query: message } }
      };
    }

    // Sales query
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
      return {
        response: "Today's sales summary:\n• Total Sales: ₹24,500\n• Items Sold: 18\n• Average Order Value: ₹1,361\n• Best Seller: Blue Kurti (5 units)",
        action: { type: 'show_report', data: { type: 'sales' } }
      };
    }

    // Profit query
    if (lowerMessage.includes('profit') || lowerMessage.includes('p&l')) {
      return {
        response: "Today's P&L Summary:\n• Revenue: ₹24,500\n• Cost of Goods: ₹14,700\n• Gross Profit: ₹9,800\n• Expenses: ₹500\n• Net Profit: ₹9,300",
        action: { type: 'show_report', data: { type: 'profit' } }
      };
    }

    // Reorder suggestions
    if (lowerMessage.includes('reorder') || lowerMessage.includes('low stock')) {
      return {
        response: "Items that need reordering:\n1. Red Saree - Only 2 left (suggest: order 20)\n2. White Shirt M - 3 left (suggest: order 15)\n3. Blue Jeans 32 - 1 left (suggest: order 10)",
        action: { type: 'show_report', data: { type: 'reorder' } }
      };
    }

    // Bill creation
    if (lowerMessage.includes('bill') || lowerMessage.includes('invoice')) {
      return {
        response: "I'll help you create a bill. I've pre-filled the billing screen with the items you mentioned. Please review and confirm.",
        action: { type: 'create_bill', data: { items: [] } }
      };
    }

    // Marketing message
    if (lowerMessage.includes('marketing') || lowerMessage.includes('message') || lowerMessage.includes('whatsapp')) {
      return {
        response: "Here's a marketing message for you:\n\n\"🌟 New Collection Alert! Fresh arrivals just landed at our store. Enjoy 20% OFF on all new items this weekend only! Visit us today. Limited stock!\"",
        action: { type: 'generate_message', data: { message: "New Collection Alert!" } }
      };
    }

    // Default response
    return {
      response: "I can help you with:\n• Stock queries ('Is blue kurti sold out?')\n• Sales reports ('How much sales today?')\n• P&L summary ('Show profit today')\n• Reorder suggestions ('Which items need reorder?')\n• Create bills ('Bill 2 kurtis for Ramesh')\n• Marketing messages ('Create WhatsApp message')\n\nWhat would you like to know?"
    };
  },

  parseBill: async (text: string): Promise<{ items: any[] }> => {
    console.log('[MOCK AI] Parsing bill text:', text.substring(0, 100));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock parsed items
    return {
      items: [
        { name: 'Product 1', quantity: 2, unitCost: 500, sku: 'SKU001' },
        { name: 'Product 2', quantity: 5, unitCost: 200, sku: 'SKU002' },
      ]
    };
  },

  generateMarketing: async (context: { shopName: string; occasion?: string; discount?: string }): Promise<{ message: string }> => {
    console.log('[MOCK AI] Generating marketing message:', context);
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      message: `🎉 Exciting News from ${context.shopName}! ${context.occasion || 'New arrivals'} are here. ${context.discount ? `Get ${context.discount} OFF!` : 'Special prices await!'} Visit us today! 🛍️`
    };
  }
};

// ============================================
// SYNC STUBS
// ============================================

/**
 * TODO: Replace with actual sync endpoints
 * 
 * Endpoint: POST /sync/push
 * Request: { items: [{ table, action, data }] }
 * Response: { synced: ["id1", "id2"], failed: [] }
 * 
 * Endpoint: GET /sync/pull?since={timestamp}
 * Response: { updates: [{ table, data }] }
 */
export const syncMock = {
  pushPending: async (items: any[]): Promise<{ syncedIds: string[]; failedIds: string[] }> => {
    console.log('[MOCK] Syncing', items.length, 'items');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      syncedIds: items.map(i => i.id),
      failedIds: []
    };
  },

  pullUpdates: async (since: Date): Promise<{ updates: any[] }> => {
    console.log('[MOCK] Pulling updates since:', since);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { updates: [] };
  }
};

// ============================================
// OCR STUBS
// ============================================

/**
 * TODO: Replace with server-side OCR for better accuracy
 * Currently using Tesseract.js on client side
 * 
 * Endpoint: POST /ocr/extract
 * Request: FormData with image
 * Response: { text: "Extracted text content", confidence: 0.85 }
 */
export const ocrMock = {
  extractText: async (imageFile: File): Promise<{ text: string; confidence: number }> => {
    console.log('[MOCK] OCR extraction for:', imageFile.name);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock OCR result
    return {
      text: `SUPPLIER INVOICE
Invoice No: INV-2024-001
Date: 12/12/2024

Items:
1. Blue Kurti M x 10 @ ₹450 = ₹4,500
2. Red Saree x 5 @ ₹800 = ₹4,000
3. White Shirt L x 15 @ ₹350 = ₹5,250

Subtotal: ₹13,750
GST (12%): ₹1,650
Total: ₹15,400`,
      confidence: 0.87
    };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const utils = {
  /**
   * Generate a unique invoice number with prefix
   */
  generateInvoiceNumber: (prefix: string = 'INV'): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}-${random}`;
  },

  /**
   * Calculate GST breakup based on state (same state = CGST+SGST, different = IGST)
   */
  calculateGST: (amount: number, rate: number, isSameState: boolean): { cgst: number; sgst: number; igst: number } => {
    const taxAmount = (amount * rate) / 100;
    if (isSameState) {
      return {
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        igst: 0
      };
    }
    return {
      cgst: 0,
      sgst: 0,
      igst: taxAmount
    };
  },

  /**
   * Format currency in Indian format
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
};

export default {
  auth: authMock,
  storage: storageMock,
  whatsapp: whatsappMock,
  ai: aiMock,
  sync: syncMock,
  ocr: ocrMock,
  utils
};
