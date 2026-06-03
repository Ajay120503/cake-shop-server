import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

let token;
let adminToken;
let testProduct;
let testCategory;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    process.env.NODE_ENV = 'test';
    await connectDB();
  }
  await User.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});

  await request(app).post('/api/v1/auth/register').send({ name: 'TA', email: 'admin@test.com', password: 'admin123' });
  await User.findOneAndUpdate({ email: 'admin@test.com' }, { role: 'admin' });
  const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'admin123' });
  adminToken = adminLogin.body.data.accessToken;

  const customerRes = await request(app).post('/api/v1/auth/register').send({ name: 'TC', email: 'customer@test.com', password: 'pass1234' });
  token = customerRes.body.data.accessToken;

  const catRes = await request(app).post('/api/v1/categories').set('Authorization', 'Bearer ' + adminToken).send({ name: 'Test Cakes' });
  testCategory = catRes.body.data;

  const prodRes = await request(app).post('/api/v1/products').set('Authorization', 'Bearer ' + adminToken).send({
    name: 'Test Chocolate Cake', description: 'A test cake', price: 500, stock: 10, category: testCategory._id,
  });
  testProduct = prodRes.body.data;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Health', () => {
  it('GET / welcome', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it('GET /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });
});

describe('Auth', () => {
  it('register', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'New', email: 'new@test.com', password: 'pass1234' });
    expect(res.status).toBe(201);
  });
  it('reject duplicate', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Dup', email: 'customer@test.com', password: 'pass1234' });
    expect(res.status).toBe(400);
  });
  it('reject weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'W', email: 'w@test.com', password: '12' });
    expect(res.status).toBe(400);
  });
  it('login ok', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'customer@test.com', password: 'pass1234' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
  it('login wrong pass', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'customer@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
  it('get me', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(200);
  });
});

describe('Products', () => {
  it('list', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
  });
  it('detail', async () => {
    const res = await request(app).get('/api/v1/products/' + testProduct._id);
    expect(res.status).toBe(200);
  });
  it('featured', async () => {
    const res = await request(app).get('/api/v1/products/featured');
    expect(res.status).toBe(200);
  });
  it('non-admin cant create', async () => {
    const res = await request(app).post('/api/v1/products').set('Authorization', 'Bearer ' + token).send({ name: 'X', description: 'X', price: 1, stock: 1, category: testCategory._id });
    expect(res.status).toBe(403);
  });
});

describe('Cart', () => {
  it('get cart', async () => {
    const res = await request(app).get('/api/v1/cart').set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(200);
  });
  it('add to cart', async () => {
    const res = await request(app).post('/api/v1/cart/add').set('Authorization', 'Bearer ' + token).send({ productId: testProduct._id, quantity: 1 });
    expect(res.status).toBe(200);
  });
});

describe('Wishlist', () => {
  it('add', async () => {
    const res = await request(app).post('/api/v1/wishlist/add').set('Authorization', 'Bearer ' + token).send({ productId: testProduct._id });
    expect(res.status).toBe(200);
  });
});

describe('Settings & Coupons', () => {
  it('public settings', async () => {
    const res = await request(app).get('/api/v1/settings/public');
    expect(res.status).toBe(200);
  });
  it('public coupons', async () => {
    const res = await request(app).get('/api/v1/coupons/public');
    expect(res.status).toBe(200);
  });
});

describe('Addresses', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/v1/addresses');
    expect(res.status).toBe(401);
  });
  it('create', async () => {
    const res = await request(app).post('/api/v1/addresses').set('Authorization', 'Bearer ' + token).send({
      fullName: 'Test', phone: '9876543210', addressLine1: '123 St', city: 'Mumbai', state: 'MH', postalCode: '400001',
    });
    expect(res.status).toBe(201);
  });
});

describe('Admin only routes', () => {
  it('users list - admin only', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(403);
  });
  it('analytics - admin only', async () => {
    const res = await request(app).get('/api/v1/analytics/dashboard').set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(403);
  });
  it('analytics - admin ok', async () => {
    const res = await request(app).get('/api/v1/analytics/dashboard').set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
  });
});
