-- Create invoice_items table for line-item tracking
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_items
CREATE POLICY "Users can view own invoice items" ON public.invoice_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoice items" ON public.invoice_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to add inventory stock
CREATE OR REPLACE FUNCTION public.add_inventory_stock(
  p_user_id UUID,
  p_product_name TEXT,
  p_quantity_to_add INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_new_quantity INTEGER;
BEGIN
  -- Find product by name (case-insensitive partial match)
  SELECT id, name, quantity INTO v_product
  FROM inventory
  WHERE user_id = p_user_id AND LOWER(name) LIKE '%' || LOWER(p_product_name) || '%'
  LIMIT 1;

  IF v_product IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Product not found: ' || p_product_name);
  END IF;

  -- Update quantity
  v_new_quantity := v_product.quantity + p_quantity_to_add;
  UPDATE inventory SET quantity = v_new_quantity, updated_at = now() WHERE id = v_product.id;

  RETURN json_build_object(
    'success', true,
    'product_name', v_product.name,
    'previous_quantity', v_product.quantity,
    'added', p_quantity_to_add,
    'new_quantity', v_new_quantity
  );
END;
$$;

-- Function to create invoice transaction
CREATE OR REPLACE FUNCTION public.create_invoice_transaction(
  p_user_id UUID,
  p_customer_name TEXT,
  p_items JSONB,
  p_payment_mode TEXT DEFAULT 'cash',
  p_amount_paid NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
  v_item_quantity INTEGER;
  v_item_total NUMERIC;
  v_items_json JSONB := '[]'::JSONB;
  v_due_amount NUMERIC;
BEGIN
  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || SUBSTR(gen_random_uuid()::TEXT, 1, 4);

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Find product
    SELECT id, name, price, quantity INTO v_product
    FROM inventory
    WHERE user_id = p_user_id AND LOWER(name) LIKE '%' || LOWER(v_item->>'product_name') || '%'
    LIMIT 1;

    IF v_product IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Product not found: ' || (v_item->>'product_name'));
    END IF;

    IF v_product.quantity < v_item_quantity THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient stock for ' || v_product.name || '. Available: ' || v_product.quantity);
    END IF;

    -- Calculate item total
    v_item_total := v_product.price * v_item_quantity;
    v_total := v_total + v_item_total;

    -- Add to items array
    v_items_json := v_items_json || jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'quantity', v_item_quantity,
      'price', v_product.price,
      'total', v_item_total
    );

    -- Decrease inventory
    UPDATE inventory 
    SET quantity = quantity - v_item_quantity, 
        sales_count = COALESCE(sales_count, 0) + v_item_quantity,
        last_sold_at = now(),
        updated_at = now()
    WHERE id = v_product.id;
  END LOOP;

  -- Calculate due amount
  v_due_amount := GREATEST(0, v_total - COALESCE(p_amount_paid, 0));

  -- Create invoice
  INSERT INTO invoices (user_id, invoice_number, customer_name, items, total, amount_paid, due_amount, payment_mode, status)
  VALUES (p_user_id, v_invoice_number, p_customer_name, v_items_json, v_total, p_amount_paid, v_due_amount, p_payment_mode, 
          CASE WHEN v_due_amount > 0 THEN 'partial' ELSE 'completed' END)
  RETURNING id INTO v_invoice_id;

  -- Insert invoice items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items_json)
  LOOP
    INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, user_id)
    VALUES (v_invoice_id, (v_item->>'id')::UUID, (v_item->>'quantity')::INTEGER, (v_item->>'price')::NUMERIC, p_user_id);
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'customer_name', p_customer_name,
    'items', v_items_json,
    'total', v_total,
    'amount_paid', p_amount_paid,
    'due_amount', v_due_amount,
    'payment_mode', p_payment_mode
  );
END;
$$;

-- Insert sample inventory data (only if inventory is empty for the user)
-- This will be handled via the app