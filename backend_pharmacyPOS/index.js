const os = require('os');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

// Load environment variables
require('dotenv').config();

// Import database
const db = require('./db');

// Import routes
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const branchRoutes = require('./routes/branchRoutes');
const billingSettingsRoutes = require('./routes/billingSettingsRoutes');
const variantRoutes = require('./routes/variantRoutes');
const discountRoutes = require('./routes/discountsRouts');
const customerRoutes = require('./routes/customerRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userManagementRoutes = require('./routes/user_management_routes');
const medicineRoutes = require('./routes/medicineRoutes');
const grnRoutes = require('./routes/grnRoutes');
const salesRoutes = require('./routes/salesRoutes');
const pharmacyPayInTermsRoutes = require('./routes/pharmacyPayInTermsRoutes');
const pharmacyReturnsRefundsRoutes = require('./routes/pharmacyReturnsRefundsRoutes');
const suppliersRoutes = require('./routes/suppliersRoutes');
const supplierPaymentsRoutes = require('./routes/supplierPaymentsRoutes');
const backupRoutes = require('./routes/backupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const sendNotificationRoutes = require('./routes/sendNotificationRoutes');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================================
// Security Middleware
// ============================================

// Helmet - sets various HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable CSP for API server
}));

// Compression - gzip/brotli responses
app.use(compression());

// CORS - restrict to allowed origins
const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '');

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
]
  .map(origin => normalizeOrigin(origin))
  .filter(Boolean);
const allowedOriginsSet = new Set(allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOriginsSet.size === 0 || allowedOriginsSet.has(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting - prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Only 20 login attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api', apiLimiter);

// ============================================
// Body Parsing Middleware
// ============================================
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ============================================
// Static File Serving (Uploads)
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    if (contentType === 'application/pdf') {
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// ============================================
// Production Request Logger (minimal)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// API Routes
// ============================================

// Auth routes (with stricter rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// Specific /api/... routes
app.use('/api/categories', categoryRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/billing-settings', billingSettingsRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/sales-details', salesRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/pharmacy-pay-in-terms', pharmacyPayInTermsRoutes);
app.use('/api/pharmacy-returns-refunds', pharmacyReturnsRefundsRoutes);
// Register payments route BEFORE suppliers
app.use('/api/suppliers/payments', supplierPaymentsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/send-notification', sendNotificationRoutes);

// Generic /api routes (registered last)
app.use('/api', profileRoutes);
app.use('/api', storeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api', customerRoutes);

// ============================================
// Frontend Static Serving (optional, for single-host deploys)
// ============================================
const frontendDist =
  process.env.FRONTEND_DIST ||
  path.join(__dirname, '..', 'frontend_pharmacyPOS', 'dist');

if (fs.existsSync(frontendDist)) {
  // Serve static assets
  app.use(express.static(frontendDist, { index: false }));

  // SPA fallback (do not swallow API/uploads/health)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
      return next();
    }
    const indexPath = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });
}

// ============================================
// Health Check (keep for AWS ALB/ELB)
// ============================================
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');

    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      uptime_seconds: process.uptime(),
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heap_used: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: process.env.NODE_ENV === 'production' ? 'Database connection failed' : error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ============================================
// Server Startup
// ============================================
const PORT = process.env.PORT || 3000;

const net = require('net');
const server = net.createServer();
server.once('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop any other server running on this port.`);
    process.exit(1);
  }
});
server.once('listening', function () {
  server.close();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
});
server.listen(PORT);
