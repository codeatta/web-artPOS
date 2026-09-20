// app/actions/checkout.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function processCheckout(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Proteksi jika belum login
  if (!user) return redirect('/login');

  // Menangkap inputan dari form pengguna
  const addressId = formData.get('address_id') as string;
  const courier = formData.get('courier') as string;
  const paymentMethod = formData.get('payment_method') as string;

  if (!addressId || !courier || !paymentMethod) {
    return redirect('/checkout?error=Mohon lengkapi alamat dan kurir');
  }

  // 1. Ambil Role User (Customer vs Reseller)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  const role = profile?.role || 'customer';

  // 2. Ambil isi keranjang
  const { data: cartItems } = await supabase
    .from('carts')
    .select(`quantity, products ( product_id, price_retail, price_reseller, weight_actual_gram, weight_volumetric_gram )`)
    .eq('user_id', user.id);

  if (!cartItems || cartItems.length === 0) return redirect('/');

  // 3. Kalkulasi Ulang Total di Server (Mencegah manipulasi dari frontend)
  let subtotal = 0;
  let totalWeightGram = 0;
  const orderItemsToInsert = [];

  for (const item of cartItems) {
    const p = item.products as any;
    const price = role === 'reseller' ? p.price_reseller : p.price_retail;
    const weight = Math.max(p.weight_actual_gram, p.weight_volumetric_gram);

    subtotal += price * item.quantity;
    totalWeightGram += weight * item.quantity;

    orderItemsToInsert.push({
      product_id: p.product_id,
      quantity: item.quantity,
      price_at_time: price,
      total_price: price * item.quantity
    });
  }

  // 4. Hitung Ongkos Kirim (Simulasi: JNE 15rb/kg, J&T 12rb/kg)
  const weightKg = Math.ceil(totalWeightGram / 1000) || 1;
  const shippingRate = courier === 'JNE' ? 15000 : 12000;
  const shippingCost = weightKg * shippingRate;
  const grandTotal = subtotal + shippingCost;

  // 5. Buat Nomor Invoice
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV/${dateStr}/${randomStr}`;

  // 6. INSERT KE TABEL ORDERS
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      invoice_number: invoiceNumber,
      user_id: user.id,
      address_id: addressId,
      total_weight_gram: totalWeightGram,
      subtotal_price: subtotal,
      shipping_cost: shippingCost,
      grand_total: grandTotal,
      order_status: 'pending_payment'
    })
    .select('order_id')
    .single();

  if (orderError) throw orderError;
  const orderId = orderData.order_id;

  // 7. INSERT DETAIL PESANAN, PENGIRIMAN & PEMBAYARAN
  const itemsWithOrderId = orderItemsToInsert.map(item => ({ ...item, order_id: orderId }));
  
  await Promise.all([
    supabase.from('order_items').insert(itemsWithOrderId),
    supabase.from('payments').insert({ order_id: orderId, payment_method: paymentMethod, status: 'pending' }),
    supabase.from('shipping').insert({ order_id: orderId, courier_name: courier, service_type: 'REG' }),
    supabase.from('carts').delete().eq('user_id', user.id) // 8. Hapus Keranjang
  ]);

  // 9. Arahkan ke Beranda dengan pesan sukses
    return redirect(`/orders/${orderId}`);
}