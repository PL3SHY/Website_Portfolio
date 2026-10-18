/* eslint-disable @typescript-eslint/no-explicit-any */
// Sample data for the portfolio demo. Everything here is made up: the people, emails, phone
// numbers, payment accounts and photos are fictional placeholders.

type Row = Record<string, any>;

// ---------- helpers ----------
const DAY = 86_400_000;
const now = Date.now();
const iso = (days: number, hour = 9) => {
  const d = new Date(now + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const day = (days: number) => new Date(now + days * DAY).toISOString().slice(0, 10);

// deterministic UUID-shaped ids, grouped by kind so they are easy to recognise
const G = { user: 1, prop: 2, unit: 3, slot: 4, res: 5, pay: 6, led: 7, rev: 8, note: 9, tkt: 10, msg: 11, promo: 12, pm: 13, opt: 14, aud: 15, req: 16, del: 17 };
const id = (group: keyof typeof G, n: number) =>
  `${G[group].toString(16).padStart(8, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`;

// generated artwork used instead of photographs
function art(title: string, a: string, b: string, glyph = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#g)"/>
<g fill="#ffffff" fill-opacity="0.16"><rect x="80" y="420" width="220" height="320" rx="10"/><rect x="330" y="300" width="260" height="440" rx="10"/><rect x="620" y="380" width="200" height="360" rx="10"/><rect x="850" y="260" width="270" height="480" rx="10"/></g>
<g fill="#ffffff" fill-opacity="0.32">${Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${360 + c * 55}" y="${330 + r * 70}" width="34" height="44" rx="4"/>`).join('')).join('')}</g>
${title ? `<text x="600" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#ffffff" fill-opacity="0.95">${title}</text>
<text x="600" y="215" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" letter-spacing="6" fill="#ffffff" fill-opacity="0.7">${glyph || 'SAMPLE IMAGE'}</text>` : ''}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const VAT = 0.12;
const bill = (subtotal: number, discount = 0) => {
  const taxable = subtotal - discount;
  const vat = Math.round(taxable * VAT * 100) / 100;
  return { subtotal, discount, vat, total: Math.round((taxable + vat) * 100) / 100 };
};

const LOCATION = 'Project 8, Quezon City';
const ADDRESS = '16 Road 23, Project 8, Quezon City, NCR';

// ---------- accounts ----------
const people = [
  { n: 1, first: 'Daisy Daryl', last: 'Dyneroh', email: 'admin@demo.test', role: 'admin', phone: '09170000001' },
  { n: 2, first: 'Evelynn', last: 'Sanchez', email: 'client@demo.test', role: 'client', phone: '09170000002' },
  { n: 3, first: 'Paolo', last: 'Ramirez', email: 'paolo.ramirez@example.com', role: 'client', phone: '09170000003' },
  { n: 4, first: 'Lea', last: 'Fernandez', email: 'lea.fernandez@example.com', role: 'client', phone: '09170000004' },
  { n: 5, first: 'Carlo', last: 'Mendoza', email: 'carlo.mendoza@example.com', role: 'client', phone: '09170000005' },
  { n: 6, first: 'Bianca', last: 'Villanueva', email: 'bianca.villanueva@example.com', role: 'client', phone: '09170000006' },
  { n: 7, first: 'Rafael', last: 'Aquino', email: 'rafael.aquino@example.com', role: 'client', phone: '09170000007' },
];
const U = (n: number) => id('user', n);

export function buildSeed(): Record<string, Row[]> {
  const db: Record<string, Row[]> = {};

  db.__auth_users = people.map((p) => ({ id: U(p.n), email: p.email, password: 'demo1234' }));

  db.users = people.map((p, i) => ({
    user_id: U(p.n),
    public_id: `USR-${String(1001 + i).padStart(5, '0')}`,
    email: p.email,
    first_name: p.first,
    last_name: p.last,
    phone: p.phone,
    role: p.role,
    address: ADDRESS,
    formatted_address: ADDRESS,
    latitude: 14.6586,
    longitude: 121.0273,
    is_active: true,
    profile_picture_url: null,
    last_login: iso(-1 - i, 10),
    phone_verified: true,
    phone_verified_at: iso(-120, 9),
    address_confirmed: true,
    address_confirmed_at: iso(-120, 9),
    created_at: iso(-200 + i * 12, 9),
    active_session_id: null,
    has_password: true,
    is_messaging_blocked: false,
    valid_id_status: p.n === 6 ? 'pending' : 'approved',
    valid_id_file_path: p.n === 7 ? null : 'valid-ids/sample-id.png',
    valid_id_uploaded_at: iso(-110, 9),
    valid_id_reviewed_at: p.n === 6 ? null : iso(-109, 9),
    valid_id_review_notes: null,
  }));
  // one customer has not uploaded an ID yet
  db.users[6].valid_id_status = 'not_submitted';
  db.users[6].valid_id_uploaded_at = null;
  db.users[6].valid_id_reviewed_at = null;

  // ---------- property, spaces, photos ----------
  db.properties = [{ property_id: id('prop', 1), title: 'Commerciales Flores', address: ADDRESS }];

  type UnitSeed = {
    n: number; type: 'rental_space' | 'function_hall' | 'parking_slot'; title: string; category: string; subtype: string;
    description: string; policies: string; features: string[]; capacity?: number;
    daily?: number; weekly?: number; monthly?: number; price: number; flexible: boolean; lease: boolean;
    colors: [string, string];
  };
  const units: UnitSeed[] = [
    { n: 1, type: 'rental_space', title: 'Unit 3A: Studio', category: 'Residential Space', subtype: 'Studio',
      description: 'A bright studio with a kitchenette and a work nook, a short walk from shops and cafes.',
      policies: 'No smoking. Quiet hours from 10 PM to 6 AM. Pets are not allowed.',
      features: ['Air conditioning', 'Wi-Fi ready', 'Kitchenette', 'Private bathroom'],
      daily: 900, weekly: 5400, monthly: 12000, price: 900, flexible: true, lease: true, colors: ['#0e7490', '#164e63'] },
    { n: 2, type: 'rental_space', title: 'Unit 2B: One-Bedroom', category: 'Residential Space', subtype: '1BR',
      description: 'A comfortable one-bedroom with a separate living area and a small balcony.',
      policies: 'No smoking indoors. Visitors must register at the front desk.',
      features: ['Air conditioning', 'Balcony', 'Full kitchen', 'Parking available'],
      daily: 1400, weekly: 8400, monthly: 18500, price: 1400, flexible: true, lease: true, colors: ['#15803d', '#14532d'] },
    { n: 3, type: 'rental_space', title: 'Unit 5C: Two-Bedroom', category: 'Residential Space', subtype: '2BR',
      description: 'A spacious two-bedroom for families or sharing, with two bathrooms and storage.',
      policies: 'Long-term lease preferred. Subletting is not permitted.',
      features: ['Two bedrooms', 'Two bathrooms', 'Storage room', 'Air conditioning'],
      monthly: 27000, price: 27000, flexible: false, lease: true, colors: ['#4338ca', '#312e81'] },
    { n: 4, type: 'rental_space', title: 'Shop G1: Ground-Floor Retail', category: 'Commercial Space', subtype: 'Retail',
      description: 'A street-facing shop with a glass front and a back storage area, ready for a small business.',
      policies: 'Business permits are required before move-in. Signage subject to approval.',
      features: ['Street frontage', 'Back storage', 'Own electric meter'],
      monthly: 32000, price: 32000, flexible: false, lease: true, colors: ['#b45309', '#78350f'] },
    { n: 5, type: 'function_hall', title: 'Garden Pavilion', category: 'Event Space', subtype: 'Hall',
      description: 'An open-air pavilion beside the garden, good for receptions, workshops and community events.',
      policies: 'Events end by 10 PM. Sound limits apply. Cleaning fee is included.',
      features: ['Tables and chairs', 'Sound system', 'Catering area', 'Restrooms'], capacity: 150,
      daily: 18000, price: 18000, flexible: false, lease: false, colors: ['#be185d', '#831843'] },
    { n: 6, type: 'function_hall', title: 'Function Hall Standard', category: 'Event Space', subtype: 'Hall',
      description: 'An air-conditioned hall for birthdays, meetings and small celebrations.',
      policies: 'Decorations must not damage walls. Events end by 10 PM.',
      features: ['Air conditioning', 'Projector', 'Tables and chairs', 'Pantry'], capacity: 80,
      daily: 10000, price: 10000, flexible: false, lease: false, colors: ['#0369a1', '#0c4a6e'] },
    { n: 7, type: 'function_hall', title: 'Function Room A', category: 'Event Space', subtype: 'Room',
      description: 'A small room for workshops, interviews and team meetings.',
      policies: 'Maximum capacity is strictly observed.',
      features: ['Air conditioning', 'Whiteboard', 'Wi-Fi ready'], capacity: 30,
      daily: 6000, price: 6000, flexible: false, lease: false, colors: ['#7c3aed', '#4c1d95'] },
    { n: 8, type: 'parking_slot', title: 'Basement Parking, Level 1', category: 'Parking', subtype: 'Covered',
      description: 'Covered, secure parking in the basement with CCTV and a guard on duty.',
      policies: 'Park only in your assigned slot. Large vehicles need admin review.',
      features: ['Covered', 'CCTV', 'Guard on duty'],
      daily: 300, monthly: 4500, price: 300, flexible: true, lease: false, colors: ['#475569', '#1e293b'] },
  ];

  db.units = [];
  db.rental_units = [];
  db.function_units = [];
  db.parking_units = [];
  db.media = [];
  units.forEach((u) => {
    const uid = id('unit', u.n);
    const picture = art(u.title.split(':')[0], u.colors[0], u.colors[1], u.category.toUpperCase());
    db.units.push({
      unit_id: uid,
      public_id: `UNT-${String(2000 + u.n).padStart(5, '0')}`,
      property_id: id('prop', 1),
      unit_type: u.type,
      unit_category: u.category,
      unit_subtype: u.subtype,
      title: u.title,
      description: u.description,
      is_available: true,
      is_deleted: false,
      price: u.price,
      location: LOCATION,
      images: [picture],
      videos: [],
      contract_file_path: null,
      contract_file_name: null,
      daily_rate: u.daily ?? null,
      weekly_rate: u.weekly ?? null,
      monthly_rate: u.monthly ?? null,
      allows_flexible_stay: u.flexible,
      allows_monthly_lease: u.lease,
      security_deposit_months: u.lease ? 1 : null,
      advance_rent_months: u.lease ? 1 : null,
      created_at: iso(-210, 9),
    });
    const detail = { unit_id: uid, title: u.title, description: u.description, policies: u.policies, features: u.features };
    if (u.type === 'rental_space') db.rental_units.push({ ...detail, rental_price: u.monthly ?? u.price });
    if (u.type === 'function_hall') db.function_units.push({ ...detail, price_per_day: u.daily, capacity: u.capacity });
    if (u.type === 'parking_slot') db.parking_units.push({ ...detail, price_per_day: u.daily, price_per_hour: 50 });
    db.media.push({ media_id: id('unit', 100 + u.n), unit_id: uid, url: { main: picture } });
  });

  // parking slots (a slot is occupied while an approved/confirmed parking reservation points at it)
  db.parking_slots = Array.from({ length: 10 }, (_, i) => ({
    slot_id: id('slot', i + 1),
    public_id: `SLT-${String(3000 + i + 1).padStart(5, '0')}`,
    unit_id: id('unit', 8),
    slot_code: `P-${String(i + 1).padStart(2, '0')}`,
    label: `Level 1, Slot ${i + 1}`,
    status: i === 9 ? 'maintenance' : 'active',
    vehicle_type: i < 7 ? 'Car' : 'Motorcycle',
    image_url: null,
    notes: i === 9 ? 'Resurfacing in progress.' : null,
  }));

  db.unit_taxonomy_options = [
    ...['Residential Space', 'Commercial Space', 'Event Space', 'Parking'].map((label, i) => ({
      option_id: id('opt', i + 1), option_type: 'category', label, parent_category: null, sort_order: i, is_active: true,
    })),
    ...[
      ['Studio', 'Residential Space'], ['1BR', 'Residential Space'], ['2BR', 'Residential Space'],
      ['Retail', 'Commercial Space'], ['Office', 'Commercial Space'],
      ['Hall', 'Event Space'], ['Room', 'Event Space'],
      ['Covered', 'Parking'], ['Open-air', 'Parking'],
    ].map(([label, parent], i) => ({
      option_id: id('opt', 20 + i), option_type: 'subtype', label, parent_category: parent, sort_order: i, is_active: true,
    })),
  ];

  db.app_settings = [
    { key: 'parking_slot_limits', value_json: { global_max_slots: 20 }, updated_at: iso(-30) },
    {
      key: 'parking_rules',
      value_json: { hourly_start: '09:00', hourly_end: '17:00', same_day_lead_minutes: 120, guest_payment_after_approval: true, slot_assignment_mode: 'admin_assigns_later' },
      updated_at: iso(-30),
    },
  ];

  // ---------- website content ----------
  db.site_content = [
    {
      content_id: id('aud', 900),
      hero: {
        badge: 'Premium Spaces',
        title: 'Welcome to Commerciales Flores',
        subtitle: 'Your premier rental management partner',
        image: art('', '#0e7490', '#0f172a'),
        primaryCtaText: 'Get Started',
        primaryCtaLink: '/register',
        secondaryCtaText: 'Browse Collection',
        secondaryCtaLink: '#properties',
      },
      about: {
        eyebrow: 'Who We Are',
        title: 'About Us',
        text: 'Providing quality commercial spaces, event venues and parking facilities in Quezon City.',
        cards: [
          { title: 'Flexible Spaces', text: 'Rental spaces designed for businesses, events and evolving needs.' },
          { title: 'Prime Convenience', text: 'Accessible locations that make bookings easier for clients and guests.' },
          { title: 'Trusted Service', text: 'A smoother and more reliable way to manage reservations and inquiries.' },
        ],
      },
      history: {
        eyebrow: 'Our History',
        title: 'Our Story',
        subtitle: 'Sample content for the demo',
        text: 'Commerciales Flores began as a small family property and grew into a place where residents, businesses and event hosts share a few well-kept buildings.',
        image: '',
        images: [],
        points: [
          { title: 'The Beginning', text: 'A vision to create accessible and flexible commercial spaces.' },
          { title: 'Growth', text: 'Expanded to serve more clients, events and rental needs.' },
          { title: 'Today', text: 'A trusted destination for business spaces and function venues.' },
        ],
      },
      featured: {
        title: 'Featured Spaces',
        subtitle: 'Experience our most premium locations.',
        viewAllText: 'View all Spaces',
        emptyTitle: 'No featured spaces yet',
        emptyText: 'There are currently no available featured spaces to display. Please check back later.',
      },
      faq: {
        title: 'Frequently Asked Questions',
        subtitle: 'Find quick answers about reservations, payments, availability and policies.',
        items: [
          { question: 'How do I reserve a unit?', answer: 'Choose a unit, send a reservation request, and wait for the admin to review it. Once approved, you can pay and your reservation is confirmed.' },
          { question: 'What payment methods are accepted?', answer: 'GCash and bank transfer. Upload your proof of payment and the admin will verify it.' },
          { question: 'Can I park without an account?', answer: 'Yes. Guests can send a parking request by the hour, day or month. An admin reviews it first, and payment is only collected after approval.' },
        ],
      },
      contact: {
        title: 'Get in Touch',
        subtitle: 'Send us a message and we will get back to you as soon as possible.',
        locationTitle: 'Visit us',
        locationSubtitle: ADDRESS,
        email: 'hello@example.com',
        phone: '+63 900 000 0000',
        address: ADDRESS,
      },
      footer: {
        brandName: 'Commerciales Flores',
        brandDescription: 'Premium rental spaces and function halls for your business or event needs.',
        quickLinksTitle: 'Quick Links',
        contactTitle: 'Get in Touch',
        copyright: '© Commerciales Flores. Demo version, sample data only.',
        privacyText: 'Compliant with the Philippine Data Privacy Act of 2012',
      },
      menu: { title: 'Menu' },
      announcements: ['New rental spaces available'],
      policies: 'Reservations are confirmed once payment is verified by the admin.',
      updated_at: iso(-10),
    },
  ];

  // ---------- payment methods, promotions ----------
  db.payment_methods = [
    {
      payment_method_id: id('pm', 1), public_id: 'PMT-00001', method_code: 'gcash', display_name: 'GCash',
      account_name: 'Commerciales Flores (demo)', account_number: null, bank_name: null, branch_name: null,
      mobile_number: '0917 000 0000', qr_image_path: null, instructions: 'Send the exact amount, then upload a screenshot of the receipt.',
      is_active: true, sort_order: 1, created_at: iso(-180), updated_at: iso(-30),
    },
    {
      payment_method_id: id('pm', 2), public_id: 'PMT-00002', method_code: 'bank_transfer', display_name: 'Bank transfer',
      account_name: 'Commerciales Flores (demo)', account_number: '0000 0000 0000', bank_name: 'Sample Bank', branch_name: 'Quezon City',
      mobile_number: null, qr_image_path: null, instructions: 'Use your reservation ID as the reference, then upload the deposit slip.',
      is_active: true, sort_order: 2, created_at: iso(-180), updated_at: iso(-30),
    },
  ];
  db.payment_method_qr = [];

  db.promotions = [
    {
      promo_id: id('promo', 1), public_id: 'PRM-00001', code: 'WELCOME10', title: 'Welcome discount', description: '10% off your first booking',
      discount_type: 'percentage', discount_value: 10, valid_from: iso(-60), valid_until: iso(120), max_uses: 100, used_count: 3,
      min_booking_amount: 0, min_stay_days: 1, applies_to_reservation_type: null, applies_to_unit_type: null, is_active: true,
      created_at: iso(-60), updated_at: iso(-60),
    },
  ];
  db.unit_promotions = [{ promo_id: id('promo', 1), unit_id: id('unit', 1) }, { promo_id: id('promo', 1), unit_id: id('unit', 2) }];

  // ---------- reservations, payments, ledger ----------
  db.reservations = [];
  db.payments = [];
  db.ledger = [];
  db.audit_log = [];

  let resN = 0;
  let payN = 0;
  let ledN = 0;
  let audN = 0;

  type ResSeed = {
    user: number; unit: number; status: string; start: number; end: number; days: number;
    type: 'flexible_stay' | 'monthly_lease' | 'function_hall' | 'parking'; paid?: number; promo?: boolean;
    details?: Row; slot?: number; note?: string; created: number;
  };

  function addReservation(r: ResSeed) {
    resN += 1;
    const unit = units[r.unit - 1];
    const rate = r.type === 'monthly_lease' ? unit.monthly! : r.type === 'parking' ? (r.days >= 28 ? unit.monthly! : unit.daily!) : unit.daily!;
    const quantity = r.type === 'monthly_lease' ? Math.max(1, Math.round(r.days / 30)) : r.type === 'parking' && r.days >= 28 ? Math.max(1, Math.round(r.days / 30)) : r.days;
    const subtotal = rate * quantity;
    const discount = r.promo ? Math.round(subtotal * 0.1) : 0;
    const b = bill(subtotal, discount);
    const deposits = r.type === 'monthly_lease' ? unit.monthly! * 2 : 0; // security + advance, billed on top
    const amountDue = b.total + (r.type === 'monthly_lease' ? 0 : 0);
    const reservationId = id('res', resN);
    const row: Row = {
      reservation_id: reservationId,
      public_id: `RES-${String(4000 + resN).padStart(5, '0')}`,
      user_id: U(r.user),
      unit_id: id('unit', r.unit),
      title: unit.title,
      unit_type: unit.type,
      reservation_type: r.type,
      start_date: day(r.start),
      end_date: day(r.end),
      duration: r.type === 'monthly_lease' ? quantity : r.days,
      total_amount: b.total,
      amount_due: amountDue,
      paid_amount: r.paid ?? 0,
      subtotal_amount: subtotal,
      vat_rate: VAT,
      vat_amount: b.vat,
      discount_amount: discount,
      billing_breakdown: {
        reservationType: r.type, days: r.days, months: r.type === 'monthly_lease' ? quantity : undefined,
        subtotalAmount: subtotal, discountAmount: discount, taxableSubtotal: subtotal - discount, vatRate: VAT, vatAmount: b.vat,
        totalAmount: b.total, amountDue,
        securityDepositAmount: r.type === 'monthly_lease' ? unit.monthly : undefined,
        advanceRentAmount: r.type === 'monthly_lease' ? unit.monthly : undefined,
      },
      status: r.status,
      notes: r.note ?? null,
      payment_method: (r.paid ?? 0) > 0 ? 'gcash' : null,
      payment_intent: null,
      payment_due_at: iso(Math.min(r.start, 3)),
      requires_full_payment: r.type !== 'monthly_lease',
      mode_of_visit: 'online',
      appointment_date: null,
      appointment_time: null,
      confirmed_visit_date: null,
      confirmed_visit_time: null,
      visit_status: null,
      details: r.details ?? {},
      assigned_parking_slot_id: r.slot ? id('slot', r.slot) : null,
      usage_status: r.status === 'confirmed' && r.start <= 0 && r.end >= 0 ? 'active' : r.status === 'completed' ? 'ended' : 'not_started',
      usage_started_at: r.start <= 0 ? iso(r.start) : null,
      usage_ends_at: iso(r.end),
      usage_ended_at: r.status === 'completed' ? iso(r.end) : null,
      usage_end_notified_at: null,
      usage_end_reminder_sent_at: null,
      security_deposit_months_snapshot: r.type === 'monthly_lease' ? 1 : null,
      advance_rent_months_snapshot: r.type === 'monthly_lease' ? 1 : null,
      promo_id: r.promo ? id('promo', 1) : null,
      discount_snapshot: r.promo ? { code: 'WELCOME10', type: 'percentage', value: 10 } : null,
      created_at: iso(r.created),
      updated_at: iso(r.created),
      _deposits: deposits,
    };
    delete row._deposits;
    db.reservations.push(row);
    audN += 1;
    db.audit_log.push({
      audit_id: id('aud', audN), public_id: `AUD-${String(5000 + audN).padStart(5, '0')}`, user_id: U(r.user),
      action: 'RESERVATION_CREATED', target_table: 'reservations', target_id: reservationId, target_public_id: row.public_id,
      before_value: null, after_value: null, changed_fields: ['status'], timestamp: iso(r.created), notes: `Reservation ${row.public_id} requested`,
    });
    return row;
  }

  function addPayment(res: Row, amount: number, opts: { reviewStatus?: string; category?: string; method?: string; when: number }) {
    payN += 1;
    const reviewStatus = opts.reviewStatus ?? 'approved';
    const paid = reviewStatus === 'approved';
    const category = opts.category ?? 'reservation_payment';
    const paymentId = id('pay', payN);
    const payment: Row = {
      payment_id: paymentId,
      public_id: `PAY-${String(6000 + payN).padStart(5, '0')}`,
      reservation_id: res.reservation_id,
      user_id: res.user_id,
      amount,
      method: opts.method ?? 'gcash',
      status: paid ? 'paid' : 'unpaid',
      review_status: reviewStatus,
      proofOfPayment: 'payment-proofs/sample-receipt.png',
      date: iso(opts.when, 11),
      notes: null,
      payment_method_id: id('pm', 1),
      payment_method_snapshot: { display_name: 'GCash', method_code: 'gcash', mobile_number: '0917 000 0000' },
      category,
      subtotal_amount: res.subtotal_amount,
      vat_rate: res.vat_rate,
      vat_amount: res.vat_amount,
      discount_amount: res.discount_amount,
      billing_snapshot: { reservation_type: res.reservation_type, total_amount: res.total_amount, amount_due: res.amount_due },
      created_at: iso(opts.when, 11),
      updated_at: iso(opts.when, 11),
    };
    db.payments.push(payment);
    if (paid) {
      ledN += 1;
      db.ledger.push({
        ledger_id: id('led', ledN),
        public_id: `LED-${String(7000 + ledN).padStart(5, '0')}`,
        user_id: res.user_id,
        reservation_id: res.reservation_id,
        payment_id: paymentId,
        entry_type: 'payment',
        deposit_type: null,
        amount,
        method: payment.method,
        status: 'verified',
        reference_no: null,
        description: `Reservation payment for ${payment.public_id}`,
        notes: null,
        recorded_at: iso(opts.when, 12),
        created_at: iso(opts.when, 12),
        created_by: U(1),
        subtotal_amount: payment.subtotal_amount,
        vat_rate: payment.vat_rate,
        vat_amount: payment.vat_amount,
        discount_amount: payment.discount_amount,
        billing_snapshot: payment.billing_snapshot,
      });
    }
    audN += 1;
    db.audit_log.push({
      audit_id: id('aud', audN), public_id: `AUD-${String(5000 + audN).padStart(5, '0')}`, user_id: paid ? U(1) : res.user_id,
      action: paid ? 'PAYMENT_APPROVED' : 'PAYMENT_CREATED', target_table: 'payments', target_id: paymentId, target_public_id: payment.public_id,
      before_value: null, after_value: null, changed_fields: ['amount', 'review_status'], timestamp: iso(opts.when, 12),
      notes: `${paid ? 'Approved' : 'Submitted'} payment ${payment.public_id} for reservation ${res.public_id}`,
    });
    return payment;
  }

  // the demo client (Evelynn): a mix of everything
  const r1 = addReservation({ user: 2, unit: 2, status: 'confirmed', type: 'flexible_stay', start: -3, end: 4, days: 7, paid: 0, created: -9 });
  addPayment(r1, r1.total_amount, { when: -8 });
  r1.paid_amount = r1.total_amount;
  addReservation({ user: 2, unit: 6, status: 'approved', type: 'function_hall', start: 12, end: 12, days: 1, created: -2, details: { eventPurpose: 'Birthday party', attendees: 60 } });
  addReservation({ user: 2, unit: 1, status: 'pending', type: 'flexible_stay', start: 20, end: 23, days: 3, promo: true, created: -1 });
  const r4 = addReservation({ user: 2, unit: 1, status: 'completed', type: 'flexible_stay', start: -50, end: -45, days: 5, created: -58 });
  addPayment(r4, r4.total_amount, { when: -56 });
  r4.paid_amount = r4.total_amount;
  const r5 = addReservation({
    user: 2, unit: 8, status: 'confirmed', type: 'parking', start: -14, end: 16, days: 30, slot: 3, created: -16,
    details: { slotId: id('slot', 3), slotName: 'P-03', assignedSlotId: id('slot', 3), assignedSlotCode: 'P-03', assignedSlotLabel: 'Level 1, Slot 3', vehicleType: 'Car', plateNumber: 'ABC 1234', durationType: 'months' },
  });
  addPayment(r5, r5.total_amount, { when: -15 });
  r5.paid_amount = r5.total_amount;

  // other customers (so the admin side has something to manage)
  const r6 = addReservation({ user: 3, unit: 3, status: 'confirmed', type: 'monthly_lease', start: -60, end: 120, days: 180, created: -66 });
  addPayment(r6, 27000, { when: -62, category: 'security_deposit' });
  addPayment(r6, 27000, { when: -62, category: 'advance_deposit' });
  r6.paid_amount = 27000;
  const r7 = addReservation({ user: 4, unit: 5, status: 'pending', type: 'function_hall', start: 30, end: 30, days: 1, created: -1, details: { eventPurpose: 'Wedding reception', attendees: 120 } });
  void r7;
  const r8 = addReservation({ user: 5, unit: 7, status: 'approved', type: 'function_hall', start: 8, end: 8, days: 1, created: -4, details: { eventPurpose: 'Team workshop', attendees: 20 } });
  addPayment(r8, r8.total_amount, { when: -1, reviewStatus: 'pending' }); // full-payment proof waiting for the admin (halls must be paid in full)
  const r9 = addReservation({ user: 6, unit: 4, status: 'overdue', type: 'monthly_lease', start: -90, end: -2, days: 90, created: -96 });
  r9.overdue_at = iso(-2);
  r9.overdue_reason = 'rental_ended_with_balance';
  addPayment(r9, 32000, { when: -92, category: 'security_deposit' });
  r9.paid_amount = 32000;
  addReservation({ user: 3, unit: 1, status: 'cancelled', type: 'flexible_stay', start: -25, end: -22, days: 3, created: -30 });
  addReservation({ user: 4, unit: 2, status: 'rejected', type: 'flexible_stay', start: -18, end: -15, days: 3, created: -21, note: 'Dates were not available.' });
  const r12 = addReservation({ user: 5, unit: 8, status: 'confirmed', type: 'parking', start: -5, end: 25, days: 30, slot: 5, created: -7, details: { slotId: id('slot', 5), slotName: 'P-05', assignedSlotId: id('slot', 5), assignedSlotCode: 'P-05', assignedSlotLabel: 'Level 1, Slot 5', vehicleType: 'Car', plateNumber: 'XYZ 5678', durationType: 'months' } });
  addPayment(r12, r12.total_amount, { when: -6 });
  r12.paid_amount = r12.total_amount;

  // ---------- reviews ----------
  db.reviews = [
    { review_id: id('rev', 1), unit_id: id('unit', 2), user_id: U(2), rating: 5, comment: 'Clean, quiet and close to everything. The check-in was smooth.', created_at: iso(-44), date: iso(-44) },
    { review_id: id('rev', 2), unit_id: id('unit', 1), user_id: U(2), rating: 4, comment: 'Great studio for a short stay. Wi-Fi could be a little faster.', created_at: iso(-44), date: iso(-44) },
    { review_id: id('rev', 3), unit_id: id('unit', 6), user_id: U(3), rating: 5, comment: 'Perfect for our family gathering. Staff were very helpful.', created_at: iso(-70), date: iso(-70) },
    { review_id: id('rev', 4), unit_id: id('unit', 8), user_id: U(5), rating: 4, comment: 'Safe parking and easy access. A guard is always around.', created_at: iso(-12), date: iso(-12) },
  ];

  // ---------- notifications ----------
  const note = (n: number, user: number, title: string, message: string, type: string, daysAgo: number, read: boolean, relatedTable: string | null = null, relatedId: string | null = null) => ({
    notification_id: id('note', n), user_id: U(user), title, message, type, is_read: read, date: iso(-daysAgo, 14), created_at: iso(-daysAgo, 14),
    related_table: relatedTable, related_id: relatedId, action_url: null,
  });
  db.notifications = [
    note(1, 2, 'Reservation approved', 'Your function hall reservation was approved. You can now submit your payment.', 'reservation', 2, false),
    note(2, 2, 'Payment verified', 'Your payment was verified. Your stay is confirmed.', 'payment', 8, true),
    note(3, 2, 'Parking reminder', 'Your monthly parking ends in 16 days.', 'usage', 1, false),
    note(4, 1, 'New reservation request', 'Lea Fernandez requested the Garden Pavilion.', 'reservation', 1, false),
    note(5, 1, 'Payment proof submitted', 'Carlo Mendoza uploaded a payment proof for review.', 'payment', 1, false),
    note(6, 1, 'Overdue balance', 'A customer has an overdue balance on Shop G1.', 'billing', 2, true),
  ];

  // ---------- support / inquiries ----------
  db.support_tickets = [
    {
      ticket_id: id('tkt', 1), public_id: 'TKT-00001', user_id: U(2), guest_email: null, guest_first_name: null, guest_last_name: null,
      subject: 'Can I extend my stay by two nights?', status: 'responded', created_at: iso(-3, 10), updated_at: iso(-2, 9),
      last_message_at: iso(-2, 9), last_message_by: 'support', last_read_at_customer: null, last_read_at_support: iso(-2, 9), resolved_at: null, resolved_by_user: null,
    },
    {
      ticket_id: id('tkt', 2), public_id: 'TKT-00002', user_id: null, guest_email: 'jordan.lim@example.com', guest_first_name: 'Jordan', guest_last_name: 'Lim',
      subject: 'Hall availability for a December event', status: 'open', created_at: iso(-1, 15), updated_at: iso(-1, 15),
      last_message_at: iso(-1, 15), last_message_by: 'customer', last_read_at_customer: null, last_read_at_support: null, resolved_at: null, resolved_by_user: null,
    },
  ];
  db.support_messages = [
    { support_message_id: id('msg', 1), ticket_id: id('tkt', 1), body: 'Hi! Is it possible to extend my stay in Unit 2B by two nights?', sender_type: 'customer', sender_user_id: U(2), sender_name: 'Evelynn Sanchez', sender_email: 'client@demo.test', is_internal: false, created_at: iso(-3, 10) },
    { support_message_id: id('msg', 2), ticket_id: id('tkt', 1), body: 'Hello Evelynn, yes, the unit is free for those nights. Send an extension request from your reservation and we will confirm it.', sender_type: 'support', sender_user_id: U(1), sender_name: 'Support Team', sender_email: null, is_internal: false, created_at: iso(-2, 9) },
    { support_message_id: id('msg', 3), ticket_id: id('tkt', 2), body: 'Good day! Is the Garden Pavilion open on the second weekend of December? We expect about 100 guests.', sender_type: 'customer', sender_user_id: null, sender_name: 'Jordan Lim', sender_email: 'jordan.lim@example.com', is_internal: false, created_at: iso(-1, 15) },
  ];
  db.support_email_messages = [];

  // ---------- empty tables the app reads ----------
  db.guest_parking_requests = [];
  db.account_deletion_requests = [];
  db.email_change_requests = [];
  db.pending_login_verifications = [];
  db.trusted_devices = [];
  db.login_history = [];
  db.email_reuse_blocks = [];
  db.payment_proofs = [];
  db.valid_ids = [];

  return db;
}
