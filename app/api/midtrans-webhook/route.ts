// app/api/midtrans-webhook/route.ts
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const notification = await req.json();
    
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const signatureKey = notification.signature_key;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const midtransOrderId = notification.order_id;
    const realOrderId = midtransOrderId.substring(0, 36);

    // Validasi Signature Key (Mencegah webhook palsu)
    const computedSignature = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest('hex');

    if (computedSignature !== signatureKey) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 403 });
    }

    // Inisialisasi Supabase Admin (Bypass RLS)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Tentukan Status untuk Tabel Orders
    let newOrderStatus = 'pending_payment';
    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') newOrderStatus = 'pending_payment';
      else if (fraudStatus == 'accept') newOrderStatus = 'paid';
    } else if (transactionStatus == 'settlement') {
      newOrderStatus = 'paid'; 
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      newOrderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      newOrderStatus = 'pending_payment';
    }

    // Tentukan Status untuk Tabel Payments (Penyesuaian Baru)
    let newPaymentStatus = 'pending';
    if (newOrderStatus === 'paid') newPaymentStatus = 'success';
    else if (newOrderStatus === 'cancelled') newPaymentStatus = 'failed';

    // ========================================================
    // 1. UPDATE STATUS TABEL ORDERS
    // ========================================================
    const { data: orderData, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ order_status: newOrderStatus })
      .eq('order_id', realOrderId)
      .select('user_id, invoice_number') 
      .single();

    if (updateError) {
      console.error("Gagal memperbarui status pesanan:", updateError);
    }

    // ========================================================
    // 2. UPDATE STATUS TABEL PAYMENTS (Solusi Data Tidak Sinkron)
    // ========================================================
    const { error: paymentUpdateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: newPaymentStatus,
        payment_gateway_ref: notification.transaction_id, // Simpan ID Transaksi dari Midtrans
        paid_at: newPaymentStatus === 'success' ? new Date().toISOString() : null
      })
      .eq('order_id', realOrderId);

    if (paymentUpdateError) {
      console.error("Gagal memperbarui status pembayaran:", paymentUpdateError);
    }

    // ========================================================
    // 3. KIRIM NOTIFIKASI OTOMATIS JIKA LUNAS
    // ========================================================
    if (newOrderStatus === 'paid' && orderData?.user_id) {
      const { error: notifError } = await supabaseAdmin.from('notifications').insert({
        user_id: orderData.user_id,
        title: 'Pembayaran Berhasil! 🎉',
        message: `Hore! Pembayaran untuk pesanan ${orderData.invoice_number} telah kami terima. Pesanan Anda akan segera diproses.`,
        type: 'order'
      });
      
      if (notifError) {
        console.error("Gagal mengirim notifikasi:", notifError);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (err: any) {
    console.error("Webhook Exception Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}