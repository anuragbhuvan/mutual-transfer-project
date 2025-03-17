import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS Configuration with specific origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3001',
  'https://three-fans-sit.loca.lt',
  'https://mutual-transfer-project.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // For development/testing - allow requests with no origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: ' + origin + ' not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'X-Requested-With',
    'Content-Type',
    'Authorization',
    'Origin',
    'Accept',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Security headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // CORS headers
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Content-Type-Options');

  // Security headers
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add a test API endpoint to check if server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

// Serve static files from dist folder only if it exists
const distPath = path.join(__dirname, 'dist');

// Only serve static files if dist folder exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // For any other request, send index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // If dist doesn't exist, only handle API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      // Let API routes be handled by their handlers
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      // For frontend routes, return a helpful message instead of trying to serve non-existent files
      res.status(200).send(`
        <html>
          <head><title>Development Mode</title></head>
          <body>
            <h1>Development Mode</h1>
            <p>The backend server is running on port 5000, but no production build was found.</p>
            <p>For development, please use the Vite dev server on port 3001.</p>
            <p><a href="http://localhost:3001">Go to Development Server</a></p>
          </body>
        </html>
      `);
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    origin: req.headers.origin,
    path: req.path,
    method: req.method
  });

  if (err.message.includes('CORS policy violation')) {
    res.status(403).json({
      error: 'CORS Error',
      message: err.message,
      allowedOrigins
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;

// Create HTTPS server if in development
if (process.env.NODE_ENV === 'development') {
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
    };
    
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT}`);
      console.log('Allowed origins:', allowedOrigins);
    });
  } catch (error) {
    console.warn('HTTPS certificate not found, falling back to HTTP');
    app.listen(PORT, () => {
      console.log(`HTTP Server running on port ${PORT}`);
      console.log('Allowed origins:', allowedOrigins);
    });
  }
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Allowed origins:', allowedOrigins);
  });
} 