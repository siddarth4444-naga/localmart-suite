const http = require('http');
const fs = require('fs');
const path = require('path');
const { sendEmail, sendSMS, verifyOTP, generateEmailHTML } = require('./email-sms-service');

const PORT = process.env.PORT || process.env.SYNC_PORT || 5000;
const DB_FILE = path.join(__dirname, 'shared_database.json');

// Default initial database state
const defaultDb = {
  shops: [],
  products: [],
  orders: [],
  lastUpdated: Date.now()
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading DB:', e);
  }
  return defaultDb;
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing DB:', e);
  }
}

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
  writeDb(defaultDb);
}

// Connected SSE clients for live event streaming
let clients = [];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. SSE Live Stream for Real-Time Instant Push
  if (req.url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('data: {"type":"CONNECTED"}\n\n');

    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(c => c !== res);
    });
    return;
  }

  // 2. GET /api/sync — Fetch latest snapshot
  if (req.method === 'GET' && req.url === '/api/sync') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return;
  }

  // 3. POST /api/auth/send-otp — Dispatch real 6-digit SMS OTP
  if (req.method === 'POST' && req.url === '/api/auth/send-otp') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { phone, email, name, digits } = JSON.parse(body || '{}');
        const numDigits = digits === 6 ? 6 : 4;
        const otp = numDigits === 6 
          ? Math.floor(100000 + Math.random() * 900000)
          : Math.floor(1000 + Math.random() * 9000);
        const msg = `Your LocalMart verification code is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
        
        await sendSMS({ phone, message: msg, otp });

        if (email && email.includes('@')) {
          await sendEmail({
            to: email,
            subject: `🔑 Your LocalMart Login OTP: ${otp}`,
            html: generateEmailHTML({
              title: `Your Verification Code: <span style="color:#059669; letter-spacing:4px; font-size:28px;">${otp}</span>`,
              subtitle: `Hello ${name || 'User'}, please use the ${numDigits}-digit OTP code below to verify your mobile number. This code expires in 10 minutes.`,
            }),
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'OTP dispatched successfully', otp }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 4. POST /api/auth/verify-otp — Validate OTP code
  if (req.method === 'POST' && req.url === '/api/auth/verify-otp') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { phone, otp } = JSON.parse(body || '{}');
        const result = verifyOTP(phone, otp);
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 5. POST /api/notify/user-registered — Send Automated Welcome Email
  if (req.method === 'POST' && req.url === '/api/notify/user-registered') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { name, email, role, shopName } = JSON.parse(body || '{}');
        if (email) {
          await sendEmail({
            to: email,
            subject: `🎉 Welcome to LocalMart, ${name || 'Friend'}!`,
            html: generateEmailHTML({
              title: `Welcome to LocalMart, ${name || ''}! 🚀`,
              subtitle: role === 'shopkeeper'
                ? `Your merchant account for <strong>"${shopName || 'your store'}"</strong> is active. You can now list products, receive online orders, and manage instant customer deliveries.`
                : `Your customer account is now active. Explore fresh groceries, dairy, and daily essentials from your neighborhood stores delivered in 10-15 minutes!`,
              ctaText: role === 'shopkeeper' ? 'Open Merchant Portal ➔' : 'Start Shopping ➔',
              ctaUrl: role === 'shopkeeper' ? 'http://localhost:8082' : 'http://localhost:8081',
            }),
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Welcome notification sent' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 6. POST /api/sync — Push update & broadcast to all connected apps + trigger Automated Order Emails
  if (req.method === 'POST' && req.url === '/api/sync') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        let db = readDb();

        if (payload.snapshot) {
          if (payload.snapshot.shops !== undefined) db.shops = payload.snapshot.shops;
          if (payload.snapshot.products !== undefined) db.products = payload.snapshot.products;
          if (payload.snapshot.orders !== undefined) db.orders = payload.snapshot.orders;
        }

        db.lastUpdated = Date.now();
        writeDb(db);

        // 🔔 AUTOMATED ORDER NOTIFICATION HOOKS
        if (payload.type === 'ORDER_CREATED' && payload.payload) {
          const order = payload.payload;
          const targetShop = (db.shops || []).find(s => s.id === order.shop_id);
          const customerEmail = order.customer_email || (order.customer && order.customer.email) || 'customer@gmail.com';
          const shopName = targetShop ? targetShop.name : 'Neighborhood Store';

          // Send Order Placed confirmation email to customer
          if (customerEmail && customerEmail.includes('@')) {
            sendEmail({
              to: customerEmail,
              subject: `📦 Order Placed Successfully! (Order #${order.id.slice(-6)}) - LocalMart`,
              html: generateEmailHTML({
                title: `Order Confirmed! (#${order.id.slice(-6)}) 🎉`,
                subtitle: `Thank you for ordering with LocalMart! Your order has been sent to <strong>${shopName}</strong> and is being prepared.`,
                orderSummary: {
                  id: order.id,
                  shopName,
                  paymentMethod: (order.payment_method || 'cod').toUpperCase(),
                  address: order.delivery_address,
                  total: order.total,
                },
                ctaText: 'Track Order Live ➔',
                ctaUrl: 'http://localhost:8081',
              }),
            }).catch(() => {});
          }

          // Send SMS update
          if (order.customer_phone) {
            sendSMS({
              phone: order.customer_phone,
              message: `LocalMart: Your order #${order.id.slice(-6)} from ${shopName} worth Rs.${order.total} is placed. Track live in app!`,
            }).catch(() => {});
          }
        }

        // 🔔 AUTOMATED ORDER DELIVERED EMAIL HOOK
        if (payload.type === 'ORDER_STATUS_UPDATED' && payload.payload && payload.payload.status === 'delivered') {
          const orderId = payload.payload.id;
          const order = (db.orders || []).find(o => o.id === orderId);
          if (order) {
            const customerEmail = order.customer_email || (order.customer && order.customer.email) || 'customer@gmail.com';
            const targetShop = (db.shops || []).find(s => s.id === order.shop_id);
            const shopName = targetShop ? targetShop.name : 'Local Store';

            if (customerEmail && customerEmail.includes('@')) {
              sendEmail({
                to: customerEmail,
                subject: `🎉 Your Order #${order.id.slice(-6)} has been Delivered! - LocalMart`,
                html: generateEmailHTML({
                  title: `Order Delivered Successfully! 🎉`,
                  subtitle: `Your groceries from <strong>${shopName}</strong> have been delivered to your doorstep. Thank you for supporting your local neighborhood stores!`,
                  orderSummary: {
                    id: order.id,
                    shopName,
                    paymentMethod: (order.payment_method || 'cod').toUpperCase(),
                    address: order.delivery_address,
                    total: order.total,
                  },
                  ctaText: 'Rate Your Order ➔',
                  ctaUrl: 'http://localhost:8081',
                }),
              }).catch(() => {});
            }

            if (order.customer_phone) {
              sendSMS({
                phone: order.customer_phone,
                message: `LocalMart: Your order #${order.id.slice(-6)} from ${shopName} has been delivered. Enjoy your fresh groceries!`,
              }).catch(() => {});
            }
          }
        }

        // Broadcast to all connected clients
        const eventData = JSON.stringify({
          type: payload.type || 'SYNC_UPDATE',
          payload: payload.payload,
          timestamp: Date.now()
        });

        clients.forEach(client => {
          try {
            client.write(`data: ${eventData}\n\n`);
          } catch (e) {}
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, lastUpdated: db.lastUpdated }));
      } catch (e) {
        console.error('Error in sync POST:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [LocalMart Real-Time Sync & Notification API Server]`);
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log(`📧 Automated Welcome, Order Placed & Delivery Emails: ACTIVE`);
  console.log(`📱 Automated 6-Digit Real SMS OTP Engine: ACTIVE`);
  console.log(`======================================================\n`);
});
