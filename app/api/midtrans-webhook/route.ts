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

    // Update status pesanan di database berdasarkan invoice_number
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ order_status: newOrderStatus })
      .eq('invoice_number', orderId);

    if (error) {
      console.error("Webhook Database Update Error:", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (err: any) {
    console.error("Webhook Exception Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}