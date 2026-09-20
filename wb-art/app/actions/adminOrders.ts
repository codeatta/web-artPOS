// app/actions/adminAddOrder.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Impor Klien Admin
import { revalidatePath } from 'next/cache';

// =========================================================================
// 1. UPDATE STATUS PESANAN
// =========================================================================
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabaseAuth = await createClient();
  
  // Keamanan ekstra: Pastikan yang melakukan ini adalah admin atau kasir
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { success: false, message: 'Anda Belum Login' };
  
  const { data: profile } = await supabaseAuth.from('user_profiles').select('role').eq('user_id', user.id).single();
  
  // Izinkan Kasir & Admin untuk mengupdate status
  if (profile?.role !== 'admin' && profile?.role !== 'kasir') {
    return { success: false, message: 'Akses ditolak: Anda tidak memiliki akses staf' };
  }

  // Gunakan Bypass RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ order_status: newStatus })
    .eq('order_id', orderId);

  if (error) {
    console.error('Gagal update status pesanan:', error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  
  return { success: true };
}

// =========================================================================
// 2. BUAT PESANAN MANUAL (POS / KASIR)
// =========================================================================
export async function createManualOrder(payload: any) {
  const supabaseAuth = await createClient();

  // OTORISASI: Pastikan yang membuat pesanan ini adalah Staf (Admin/Kasir)
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { success: false, message: 'Silakan login terlebih dahulu.' };

  const { data: profile } = await supabaseAuth.from('user_profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'kasir') {
    return { success: false, message: 'Akses ditolak: Hanya Kasir dan Admin yang dapat membuat pesanan POS.' };
  }

  // Gunakan Klien Admin untuk mengeksekusi insert ke database (Bypass RLS)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  try {
    // 1. SIMPAN DATA PELANGGAN KE TABEL user_addresses DULU
    const { data: addressData, error: addressError } = await supabaseAdmin
      .from('user_addresses')
      .insert({
        recipient_name: payload.customerName,
        phone_number: payload.customerPhone,
        city: payload.city || '-',
        province: '-',
        postal_code: '-',
        street_address: payload.streetAddress || '-',
        is_primary: false,
        user_id: null // Karena ini pesanan POS/Offline
      })
      .select('address_id')
      .single();

    if (addressError || !addressData) {
      console.error("Gagal membuat alamat:", addressError);
      return { success: false, message: 'Gagal menyimpan data pelanggan.' };
    }

    // 2. BUAT NOMOR INVOICE & HITUNG SUBTOTAL
    const invoiceNumber = `INV-POS-${Date.now()}`;
    const subtotalPrice = payload.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // 3. SIMPAN KE TABEL orders
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        invoice_number: invoiceNumber,
        address_id: addressData.address_id, 
        user_id: null,
        total_weight_gram: 1000, 
        subtotal_price: subtotalPrice,
        shipping_cost: payload.shippingCost,
        grand_total: payload.grandTotal,
        order_status: payload.status,
        voucher_code: payload.voucherCode || null,
        discount_amount: payload.discountAmount || 0
      })
      .select('order_id')
      .single();

    if (orderError || !orderData) {
      console.error("Gagal membuat pesanan:", orderError);
      return { success: false, message: 'Gagal menyimpan pesanan utama.' };
    }

    const newOrderId = orderData.order_id;

    // 4. SIMPAN RINCIAN BARANG KE order_items
    if (!payload.items || payload.items.length === 0) {
      return { success: false, message: 'Keranjang belanja kosong.' };
    }

    const orderItems = payload.items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const validPrice = Number(item.price || item.price_retail || item.price_at_time || item.price_per_item) || 0;
      
      return {
        order_id: newOrderId,
        product_id: item.product_id || item.id, 
        quantity: qty,
        price_at_time: validPrice,
        price_per_item: validPrice, // <-- Menjawab error "price_per_item"
        total_price: validPrice * qty // <-- Melengkapi struktur dasar e-commerce
      };
    });

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Gagal menyimpan barang:", itemsError);
      
      // Rollback: Hapus pesanan utama jika rincian barang gagal disimpan
      await supabaseAdmin.from('orders').delete().eq('order_id', newOrderId);
      
      return { 
        success: false, 
        message: `Gagal menyimpan barang: ${itemsError.message}` 
      };
    }

    // 5. SIMPAN KE TABEL shipping (Jika ada)
    await supabaseAdmin.from('shipping').insert({
      order_id: newOrderId,
      courier_name: payload.courierName,
      shipping_cost: payload.shippingCost,
      status: 'pending'
    });

    revalidatePath('/admin/orders');
    return { success: true, orderId: newOrderId };

  } catch (err: any) {
    console.error("Fatal Error:", err);
    return { success: false, message: 'Terjadi kesalahan sistem internal.' };
  }
}