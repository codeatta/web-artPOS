// app/api/midtrans-webhook/route.ts
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const notification = await req.json();
    
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const orderId = notification.order_id; // Ini adalah invoice_number kita
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const signatureKey = notification.signature_key;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const midtransOrderId = notification.order_id;
    const realOrderId = midtransOrderId.substring(0, 36);

    // Validasi Signature Key untuk keamanan (mencegah webhook palsu)
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

    let newOrderStatus = 'pending_payment';

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        newOrderStatus = 'pending_payment';
      } else if (fraudStatus == 'accept') {
        newOrderStatus = 'paid';
      }
    } else if (transactionStatus == 'settlement') {
      newOrderStatus = 'paid'; // Pembayaran sukses
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      newOrderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      newOrderStatus = 'pending_payment';
    }

    // ========================================================
    // 1. UPDATE STATUS & AMBIL DATA PESANAN (Mencegah Error)
    // ========================================================
    const { data: orderData, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ order_status: newOrderStatus })
      .eq('order_id', realOrderId)
      .select('user_id, invoice_number') // <--- Wajib ditambahkan agar orderData terisi
      .single();

    if (updateError) {
      console.error("Gagal memperbarui status pesanan:", updateError);
    }

    // ========================================================
    // 2. KIRIM NOTIFIKASI OTOMATIS JIKA LUNAS
    // ========================================================
    // Sekarang TypeScript mengenali 'orderData' karena sudah dideklarasikan di atas
    if (newOrderStatus === 'paid' && orderData) {
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

    if (updateError) {
      console.error("Webhook Database Update Error:", updateError);
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (err: any) {
    console.error("Webhook Exception Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}