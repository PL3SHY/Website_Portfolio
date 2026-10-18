/* eslint-disable @typescript-eslint/no-explicit-any */
// Stand-ins for the project's Supabase edge functions and database procedures, running against the
// in-memory database. The payment and refund logic is ported from the real functions
// (supabase/functions/create-payment-and-ledger and issue-refund) so the demo behaves the same way:
// amounts are validated against the ledger, a payment writes a ledger entry and an audit-log entry,
// and the reservation's paid amount (and status) follows.

import { authAccounts, from, getDb, readSession, uid } from './engine';

export type FnResult = { status: number; body: any };
const ok = (body: any = { success: true }): FnResult => ({ status: 200, body });
const fail = (status: number, error: string): FnResult => ({ status, body: { success: false, error } });

const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

function currentUserId(headers: Record<string, any> = {}): string | null {
  const auth = String(headers.Authorization ?? headers.authorization ?? '');
  const m = /demo-token-(.+)$/.exec(auth);
  return m ? m[1] : (readSession()?.user?.id ?? null);
}

// ---------- ledger maths (same as the real functions) ----------
async function ledgerNetPaid(reservationId: string): Promise<number> {
  const { data } = await from('ledger').select('entry_type, deposit_type, amount').eq('reservation_id', reservationId);
  let paid = 0;
  let refunds = 0;
  let discounts = 0;
  let penalties = 0;
  let adjustments = 0;
  for (const row of data ?? []) {
    const amount = Number(row.amount ?? 0);
    switch (row.entry_type) {
      case 'payment':
      case 'balance':
        paid += amount;
        break;
      case 'deposit':
        if (row.deposit_type === 'advance') paid += amount;
        break;
      case 'refund':
        refunds += amount;
        break;
      case 'discount':
        discounts += amount;
        break;
      case 'penalty':
        penalties += amount;
        break;
      case 'adjustment':
        adjustments += amount;
        break;
    }
  }
  return Math.max(0, paid - refunds - discounts + penalties + adjustments);
}

const isDeposit = (c?: string | null) => c === 'advance_deposit' || c === 'security_deposit';

function ledgerMeaning(category?: string | null): { entryType: string; depositType?: string } {
  if (category === 'advance_deposit') return { entryType: 'deposit', depositType: 'advance' };
  if (category === 'security_deposit') return { entryType: 'deposit', depositType: 'security' };
  if (category === 'late_fee') return { entryType: 'penalty' };
  return { entryType: 'payment' };
}

function paymentDescription(category: string, ref: string) {
  switch (category) {
    case 'security_deposit':
      return `Security deposit for ${ref}`;
    case 'advance_deposit':
      return `Advance deposit for ${ref}`;
    case 'monthly_rent':
      return `Monthly rent payment for ${ref}`;
    case 'late_fee':
      return `Late fee payment for ${ref}`;
    case 'reservation_payment':
      return `Reservation payment for ${ref}`;
    default:
      return `Payment for reservation ${ref}`;
  }
}

function validateAmount(reservationType: string | null, category: string, submitted: number, remaining: number) {
  if (remaining <= 0) throw new Error('This reservation is already fully paid.');
  if (submitted > remaining && !isDeposit(category)) {
    throw new Error('Payment amount cannot exceed the remaining balance.');
  }
  if (reservationType === 'flexible_stay' || reservationType === 'function_hall' || reservationType === 'parking') {
    if (category !== 'reservation_payment' && category !== 'payment') {
      throw new Error('Invalid payment category for this reservation type.');
    }
    if (submitted < remaining) {
      throw new Error(`Full payment is required for this reservation (₱${remaining.toFixed(2)}).`);
    }
  }
}

async function audit(userId: string | null, action: string, targetTable: string, targetId: string, publicId: string | null, fields: string[], notes: string) {
  await from('audit_log').insert({
    user_id: userId,
    action,
    target_table: targetTable,
    target_id: targetId,
    target_public_id: publicId,
    changed_fields: fields,
    timestamp: new Date().toISOString(),
    notes,
  });
}

// ---------- create-payment-and-ledger ----------
async function createPaymentAndLedger(body: any, userId: string | null): Promise<FnResult> {
  if (!userId) return fail(401, 'Unauthorized');
  const {
    effectiveReservationId: bodyReservationId,
    amount,
    method,
    status,
    reviewStatus = 'pending',
    proofOfPayment = null,
    notes = null,
    paymentMethodId = null,
    paymentMethodSnapshot = null,
    category = 'reservation_payment',
    paymentId = null,
  } = body;

  let reservationId = bodyReservationId;
  if (!reservationId && paymentId) {
    const { data: existing } = await from('payments').select('reservation_id').eq('payment_id', paymentId).maybeSingle();
    reservationId = existing?.reservation_id ?? null;
  }
  if (!reservationId) return fail(400, 'Reservation is required.');

  const submitted = money(amount);
  if (submitted <= 0) return fail(400, 'Payment amount must be greater than zero.');

  const { data: reservation } = await from('reservations').select('*').eq('reservation_id', reservationId).maybeSingle();
  if (!reservation) return fail(404, 'Reservation not found.');

  const ledgerPaid = await ledgerNetPaid(reservationId);
  const payableTotal = money(reservation.amount_due ?? reservation.total_amount ?? 0);
  const remaining = money(payableTotal - ledgerPaid);

  try {
    validateAmount(reservation.reservation_type, category, submitted, remaining);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : 'Invalid payment amount.');
  }

  const billingSnapshot = {
    reservation_type: reservation.reservation_type,
    unit_type: reservation.unit_type,
    subtotal_amount: Number(reservation.subtotal_amount ?? 0),
    vat_rate: Number(reservation.vat_rate ?? 0.12),
    vat_amount: Number(reservation.vat_amount ?? 0),
    discount_amount: Number(reservation.discount_amount ?? 0),
    total_amount: Number(reservation.total_amount ?? 0),
    amount_due: Number(reservation.amount_due ?? reservation.total_amount ?? 0),
    billing_breakdown: reservation.billing_breakdown ?? null,
  };

  let payment: any;
  if (!paymentId) {
    const { data, error } = await from('payments')
      .insert([
        {
          user_id: reservation.user_id,
          reservation_id: reservationId,
          amount: submitted,
          method,
          status,
          review_status: reviewStatus,
          proofOfPayment,
          date: new Date().toISOString(),
          notes,
          payment_method_id: paymentMethodId,
          payment_method_snapshot: paymentMethodSnapshot,
          category,
          subtotal_amount: billingSnapshot.subtotal_amount,
          vat_rate: billingSnapshot.vat_rate,
          vat_amount: billingSnapshot.vat_amount,
          discount_amount: billingSnapshot.discount_amount,
          billing_snapshot: billingSnapshot,
          updated_at: new Date().toISOString(),
        },
      ])
      .select('*')
      .single();
    if (error) return fail(500, error.message);
    payment = data;
  } else {
    const { data: existing } = await from('payments').select('*').eq('payment_id', paymentId).maybeSingle();
    if (!existing) return fail(404, 'Payment not found.');
    const approvingNow = existing.review_status !== 'approved' && reviewStatus === 'approved';
    let sanitized = submitted;
    if (existing.status === 'paid' && Number(existing.amount) !== sanitized) {
      return fail(400, 'Changing the amount of an already paid payment is not supported.');
    }
    if (existing.status === 'paid' && status !== 'paid') {
      return fail(400, 'Reverting an already paid payment is not supported.');
    }
    if (approvingNow) {
      if (remaining <= 0) return fail(400, 'This reservation is already fully paid.');
      sanitized = Math.min(submitted, remaining);
    }
    const { data, error } = await from('payments')
      .update({
        amount: sanitized,
        method,
        status,
        review_status: reviewStatus,
        proofOfPayment,
        notes,
        payment_method_id: paymentMethodId,
        payment_method_snapshot: paymentMethodSnapshot,
        category,
        subtotal_amount: billingSnapshot.subtotal_amount,
        vat_rate: billingSnapshot.vat_rate,
        vat_amount: billingSnapshot.vat_amount,
        discount_amount: billingSnapshot.discount_amount,
        billing_snapshot: billingSnapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', paymentId)
      .select('*')
      .single();
    if (error) return fail(500, error.message);
    payment = data;
  }

  if (payment.review_status === 'approved') {
    const { data: existingLedger } = await from('ledger').select('ledger_id').eq('payment_id', payment.payment_id).limit(1).maybeSingle();
    if (!existingLedger) {
      const { entryType, depositType } = ledgerMeaning(category);
      const { data: ledgerRow } = await from('ledger')
        .insert([
          {
            user_id: payment.user_id,
            reservation_id: payment.reservation_id,
            payment_id: payment.payment_id,
            entry_type: entryType,
            deposit_type: depositType ?? null,
            amount: payment.amount,
            method: payment.method,
            status: 'verified',
            reference_no: null,
            description: paymentDescription(category, payment.public_id ?? payment.payment_id),
            notes: payment.notes ?? null,
            recorded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            subtotal_amount: payment.subtotal_amount,
            vat_rate: payment.vat_rate,
            vat_amount: payment.vat_amount,
            discount_amount: payment.discount_amount,
            billing_snapshot: payment.billing_snapshot,
          },
        ])
        .select('ledger_id, public_id')
        .single();
      if (ledgerRow) {
        await audit(userId, 'LEDGER_ENTRY_CREATED', 'ledger', ledgerRow.ledger_id, ledgerRow.public_id ?? null, ['amount', 'entry_type', 'billing_snapshot'], `Ledger entry created for payment ${payment.public_id}`);
      }
    }

    const netPaid = await ledgerNetPaid(payment.reservation_id);
    const patch: Record<string, unknown> = { paid_amount: netPaid, updated_at: new Date().toISOString() };
    if (netPaid >= payableTotal) patch.status = 'confirmed';
    await from('reservations').update(patch).eq('reservation_id', payment.reservation_id);
  }

  const action = paymentId
    ? reviewStatus === 'approved'
      ? 'PAYMENT_APPROVED'
      : reviewStatus === 'rejected'
        ? 'PAYMENT_REJECTED'
        : 'PAYMENT_UPDATED'
    : 'PAYMENT_CREATED';
  await audit(
    userId,
    action,
    'payments',
    payment.payment_id,
    payment.public_id ?? null,
    paymentId ? ['amount', 'method', 'status', 'review_status', 'billing_snapshot'] : ['amount', 'method', 'status', 'category', 'billing_snapshot'],
    `${paymentId ? 'Processed' : 'Created'} ${category} ${payment.public_id} for reservation ${reservation.public_id}`
  );

  return ok({ success: true, payment });
}

// ---------- issue-refund ----------
const NON_REFUNDABLE = new Set(['function_room_fee', 'reservation_fee']);

async function issueRefund(body: any, userId: string | null): Promise<FnResult> {
  if (!userId) return fail(401, 'Unauthorized');
  const { reservationId, paymentId = null, amount, method = null, notes = null, referenceNo = null } = body;
  const refundAmount = money(amount);
  if (!reservationId) return fail(400, 'Reservation is required.');
  if (refundAmount <= 0) return fail(400, 'Refund amount must be greater than zero.');

  const { data: reservation } = await from('reservations').select('reservation_id, public_id, user_id').eq('reservation_id', reservationId).maybeSingle();
  if (!reservation) return fail(404, 'Reservation not found.');

  let linked: any = null;
  let limit = 0;
  if (paymentId) {
    const { data: payment } = await from('payments').select('payment_id, public_id, reservation_id, amount, method, status, category').eq('payment_id', paymentId).maybeSingle();
    if (!payment) return fail(404, 'Linked payment not found.');
    if (payment.reservation_id !== reservationId) return fail(400, 'The selected payment does not belong to this reservation.');
    if (payment.status !== 'paid') return fail(400, 'Only approved payments can be refunded.');
    linked = payment;
    if (NON_REFUNDABLE.has(payment.category ?? '')) return fail(400, 'This reservation fee is non-refundable.');
    const { data: refundRows } = await from('ledger').select('amount').eq('reservation_id', reservationId).eq('payment_id', paymentId).eq('entry_type', 'refund');
    const already = (refundRows ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    limit = Math.max(0, Number(payment.amount) - already);
    if (limit <= 0) return fail(400, 'This payment has already been fully refunded.');
    if (refundAmount > limit) return fail(400, `Refund cannot exceed the remaining refundable amount for this payment (₱${limit.toFixed(2)}).`);
  } else {
    const net = await ledgerNetPaid(reservationId);
    if (net <= 0) return fail(400, 'No refundable balance available.');
    limit = net;
    if (refundAmount > limit) return fail(400, `Refund cannot exceed ₱${limit.toFixed(2)}.`);
  }

  const category = linked?.category ?? 'payment';
  const ref = linked ? (linked.public_id ?? linked.payment_id) : '';
  const description = linked
    ? category === 'security_deposit'
      ? `Refund for security deposit ${ref}`
      : category === 'advance_deposit'
        ? `Refund for advance deposit ${ref}`
        : category === 'monthly_rent'
          ? `Refund for monthly rent ${ref}`
          : `Refund for payment ${ref}`
    : `Refund for reservation ${reservation.public_id ?? reservation.reservation_id}`;

  const { data: ledgerRow } = await from('ledger')
    .insert([
      {
        user_id: reservation.user_id,
        reservation_id: reservationId,
        payment_id: paymentId ?? null,
        entry_type: 'refund',
        deposit_type: category === 'security_deposit' ? 'security' : category === 'advance_deposit' ? 'advance' : null,
        amount: refundAmount,
        method: method ?? linked?.method ?? null,
        status: 'verified',
        reference_no: referenceNo,
        description,
        notes,
        recorded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        created_by: userId,
      },
    ])
    .select('ledger_id, public_id')
    .single();

  if (ledgerRow) {
    await audit(userId, 'LEDGER_REFUND_CREATED', 'ledger', ledgerRow.ledger_id, ledgerRow.public_id ?? null, ['amount', 'entry_type'], `Refund ledger entry created for ₱${refundAmount.toFixed(2)}`);
  }
  const net = await ledgerNetPaid(reservationId);
  await from('reservations').update({ paid_amount: net, updated_at: new Date().toISOString() }).eq('reservation_id', reservationId);
  await audit(
    userId,
    'PAYMENT_REFUNDED',
    paymentId ? 'payments' : 'reservations',
    paymentId ?? reservation.reservation_id,
    linked?.public_id ?? reservation.public_id ?? null,
    ['refund'],
    `Issued refund of ₱${refundAmount.toFixed(2)} for reservation ${reservation.public_id ?? reservation.reservation_id}`
  );
  return ok({ success: true });
}

// ---------- simpler functions ----------
async function replyToTicket(body: any, userId: string | null): Promise<FnResult> {
  const { ticketId, message } = body;
  if (!ticketId || !message) return fail(400, 'A ticket and a message are required.');
  const now = new Date().toISOString();
  await from('support_messages').insert({
    ticket_id: ticketId,
    body: message,
    sender_type: 'support',
    sender_user_id: userId,
    sender_name: 'Support Team',
    sender_email: null,
    is_internal: false,
    created_at: now,
  });
  await from('support_tickets').update({ status: 'responded', last_message_at: now, last_message_by: 'support', updated_at: now }).eq('ticket_id', ticketId);
  return ok();
}

async function createAdminUser(body: any): Promise<FnResult> {
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!email) return fail(400, 'Email is required.');
  if (authAccounts().some((a) => String(a.email).toLowerCase() === email)) return fail(400, 'An account with this email already exists.');
  const id = uid();
  authAccounts().push({ id, email, password: 'demo1234' });
  const { error } = await from('users').insert({
    user_id: id,
    email,
    first_name: body.firstName ?? '',
    last_name: body.lastName ?? '',
    phone: body.phone ?? '',
    address: body.address ?? '',
    formatted_address: body.formattedAddress ?? body.address ?? '',
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    role: 'client',
    is_active: body.isActive !== false,
    has_password: true,
    phone_verified: false,
    address_confirmed: false,
    valid_id_status: 'not_submitted',
    created_at: new Date().toISOString(),
  });
  if (error) return fail(400, error.message);
  return ok({ success: true });
}

async function guestParkingRequest(body: any): Promise<FnResult> {
  const { data, error } = await from('guest_parking_requests')
    .insert({ ...body, status: 'pending', created_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) return fail(400, error.message);
  return ok({ success: true, request: data });
}

export async function handleFunction(name: string, body: any = {}, headers: Record<string, any> = {}): Promise<FnResult> {
  const userId = currentUserId(headers);
  switch (name) {
    case 'create-payment-and-ledger':
      return createPaymentAndLedger(body, userId);
    case 'issue-refund':
      return issueRefund(body, userId);
    case 'reply-to-support-ticket':
      return replyToTicket(body, userId);
    case 'create-admin-user':
    case 'create-admin-customer':
      return createAdminUser(body);
    case 'submit-guest-parking-request':
      return guestParkingRequest(body);
    case 'check-device-and-send-verification':
      return ok({ trusted: true });
    case 'verify-turnstile':
      return ok({ success: true });
    case 'request-email-change':
      return fail(400, 'Changing the email address is turned off in this demo.');
    case 'delete-user':
      return fail(400, 'Deleting accounts is turned off in this demo.');
    default:
      // all the "send ... email / notification" functions, device verification, login context...
      return ok({ success: true });
  }
}

// ---------- database procedures (rpc) ----------
export async function handleRpc(name: string, args: Record<string, any> = {}): Promise<{ data: any; error: any }> {
  switch (name) {
    case 'check_login_lock':
      return { data: [{ is_locked: false, retry_after_seconds: 0 }], error: null };
    case 'get_my_trusted_devices':
    case 'get_blocking_reservations':
      return { data: [], error: null };
    case 'soft_delete_unit': {
      const id = Object.values(args).find((v) => typeof v === 'string');
      if (id) await from('units').update({ is_deleted: true, is_available: false }).eq('unit_id', id);
      return { data: null, error: null };
    }
    case 'admin_review_valid_id': {
      const userId = args.p_user_id ?? Object.values(args).find((v) => typeof v === 'string' && getDb().users?.some((u) => u.user_id === v));
      const status = args.p_status ?? args.p_decision ?? 'approved';
      if (userId) {
        await from('users')
          .update({
            valid_id_status: status,
            valid_id_reviewed_at: new Date().toISOString(),
            valid_id_review_notes: args.p_notes ?? args.p_review_notes ?? null,
          })
          .eq('user_id', userId);
      }
      return { data: null, error: null };
    }
    default:
      // clear_login_failures, record_login_failure, remove_my_trusted_device ...
      return { data: null, error: null };
  }
}
