// app/actions/midtrans.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function createMidtransTransaction(orderId: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      user_addresses (*),
      order_items (
        quantity, price_at_time,
        products (name)
      )
    `)
    .eq('order_id', orderId)
    .single();

  if (error || !order) {
    return { success: false, message: 'Pesanan tidak ditemukan.' };
  }

  const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
  const snapUrl = isProduction 
    ? 'https://app.midtrans.com/snap/v1/transactions' 
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const itemDetails = order.order_items.map((item: any) => ({
    id: item.product_id || 'PROD',
    price: Number(item.price_at_time),
    quantity: Number(item.quantity),
    name: (item.products?.name || 'Produk Toko').substring(0, 50),
  }));

  if (Number(order.shipping_cost) > 0) {
    itemDetails.push({
      id: 'SHIPPING-COST',
      price: Number(order.shipping_cost),
      quantity: 1,
      name: 'Ongkos Kirim',
    });
  }

  if (Number(order.discount_amount) > 0) {
    itemDetails.push({
      id: 'DISCOUNT',
      price: -Number(order.discount_amount),
      quantity: 1,
      name: 'Diskon Voucher',
    });
  }

  const parameter = {
    transaction_details: {
      order_id: `${order.order_id}-${Date.now()}`, 
      gross_amount: Number(order.grand_total),
    },
    item_details: itemDetails,
    customer_details: {
      first_name: address?.recipient_name || 'Pelanggan Toko',
      phone: address?.phone_number || '-',
      shipping_address: {
        address: address?.street_address || '-',
        city: address?.city || '-',
        postal_code: address?.postal_code || '64471',
      },
    },
  };

  try {
    // Autentikasi resmi Midtrans: Basic Auth dengan ServerKey diikuti titik dua (:) lalu di-base64
    const encodedKey = Buffer.from(serverKey + ':').toString('base64');
    
    const response = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodedKey}`,
      },
      body: JSON.stringify(parameter),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Midtrans Error Response:", data);
      return { success: false, message: data.message?.[0] || 'Gagal terhubung ke gateway Midtrans.' };
    }

    return { success: true, token: data.token, redirect_url: data.redirect_url };

  } catch (err: any) {
    console.error("Midtrans Connection Error:", err);
    return { success: false, message: 'Kesalahan sistem saat memproses pembayaran.' };
  }
}