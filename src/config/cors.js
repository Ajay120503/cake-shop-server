export const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ].filter(Boolean);

    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 600,
};
