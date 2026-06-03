import 'dotenv/config';
console.log("MONGODB_URI =", process.env.MONGODB_URI);
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { StoreSettings } from '../models/Settings.js';
import logger from './logger.js';
import slugify from "slugify";

const CATS = [
  ['Birthday Cakes', 1, true],
  ['Wedding Cakes', 2, true],
  ['Anniversary Cakes', 3, true],
  ['Custom Cakes', 4, true],
  ['Chocolate Cakes', 5, false],
  ['Fruit Cakes', 6, false],
  ['Eggless Cakes', 7, true],
  ['Designer Cakes', 8, true],
  ['Cupcakes', 9, false],
  ['Pastries', 10, true],
  ['Donuts', 11, false],
  ['Brownies', 12, false],
  ['Cookies', 13, false],
  ['Muffins', 14, false],
  ['Gift Hampers', 15, true],
].map(([name, order, isFeatured]) => ({
  name,
  order,
  isFeatured,
  description: name + " for every occasion",
  slug: slugify(name, { lower: true, strict: true })
}));

const PRODS = [
  { name: 'Classic Chocolate Truffle Cake', price: 699, dp: 549, cat: 4, feat: true, best: true, stock: 50, img: 'photo-1606313564200-e75d5e30476c' },
  { name: 'Red Velvet Heart Cake', price: 899, dp: 749, cat: 7, feat: true, trend: true, new: true, stock: 30, img: 'photo-1586788680434-30d324b2d46f' },
  { name: 'Vanilla Strawberry Dream', price: 599, dp: 499, cat: 0, feat: true, best: true, stock: 40, img: 'photo-1464195244916-405fa0a82545' },
  { name: 'Black Forest Classic', price: 549, dp: 449, cat: 4, best: true, stock: 60, img: 'photo-1578985545062-69928b1d9587' },
  { name: 'Butterscotch Crunch Cake', price: 649, dp: 549, cat: 0, new: true, trend: true, stock: 35, img: 'photo-1535141192574-5d4897c12636' },
  { name: 'Tiramisu Cake', price: 799, dp: 699, cat: 4, feat: true, trend: true, stock: 20, img: 'photo-1571877227200-a0d98ea607e9' },
  { name: 'Blueberry Cheesecake', price: 699, dp: 599, cat: 4, feat: true, best: true, stock: 25, img: 'photo-1565958011703-44f9829ba187' },
  { name: 'Rainbow Cupcake Box', price: 399, dp: 299, cat: 8, new: true, trend: true, stock: 100, img: 'photo-1426869981800-95ebf51ce900' },
  { name: 'Chocolate Brownie Pack', price: 349, dp: 249, cat: 11, best: true, stock: 80, img: 'photo-1606313564200-e75d5e30476c' },
  { name: 'Butter Croissant Box', price: 299, dp: 229, cat: 9, new: true, stock: 60, img: 'photo-1555507036-ab1f4038808a' },
  { name: 'Three Tier Wedding Cake', price: 4999, dp: 4499, cat: 1, feat: true, stock: 5, img: 'photo-1535254973040-607b474cb50d' },
  { name: 'Designer Photo Cake', price: 999, dp: 799, cat: 3, feat: true, new: true, stock: 20, img: 'photo-1557925923-cd4648e211a0' },
];

export const seedDatabase = async () => {
  try {
    await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({}), Coupon.deleteMany({}), StoreSettings.deleteMany({})]);

    const admin = await User.create({ name: 'Admin', email: 'admin@cakeshop.com', password: 'admin123', role: 'admin', isEmailVerified: true, phone: '+91 9876543210' });
    logger.info('Admin: admin@cakeshop.com / admin123');
    await User.create({ name: 'John Doe', email: 'customer@cakeshop.com', password: 'customer123', role: 'customer', isEmailVerified: true, phone: '+91 9876543211' });
    logger.info('Customer: customer@cakeshop.com / customer123');

    const categories = await Category.insertMany(CATS);
    logger.info(categories.length + ' categories created');

    const products = PRODS.map((p) => ({
      name: p.name,
      slug: slugify(p.name, { lower: true, strict: true }),
      description: 'Delicious ' + p.name + ' made with premium ingredients. Perfect for any celebration.',
      shortDescription: p.name,
      price: p.price,
      discountPrice: p.dp,
      flavor: 'Premium',
      isFeatured: !!p.feat,
      isBestSeller: !!p.best,
      isNewArrival: !!p.new,
      isTrending: !!p.trend,
      stock: p.stock,
      weight: { value: 500, unit: 'g' },
      ingredients: ['Flour', 'Sugar', 'Butter', 'Cream'],
      allergens: ['Gluten', 'Dairy', 'Eggs'],
      deliveryTime: 'Same day delivery',
      occasion: ['Birthday', 'Anniversary'],
      tags: [p.name.toLowerCase().split(' ')[0]],
      images: [{
        public_id: 'sample/' + p.img,
        url: 'https://images.unsplash.com/' + p.img + '?w=800'
      }],
      category: categories[p.cat]._id,
      createdBy: admin._id,
      sold: Math.floor(Math.random() * 50),
    }));
    logger.info(products.length + ' products created');

    await Coupon.insertMany([
  {
    code: 'WELCOME10',
    slug: slugify('WELCOME10', { lower: true, strict: true }),
    name: 'Welcome 10% Off',
    description: 'Get 10% off',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: 200,
    minOrderAmount: 500,
    usagePerUser: 1,
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  {
    code: 'SAVE20',
    slug: slugify('SAVE20', { lower: true, strict: true }),
    name: 'Save 20%',
    description: '20% off above ₹1000',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 500,
    minOrderAmount: 1000,
    usagePerUser: 2,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  },
  {
    code: 'FLAT100',
    slug: slugify('FLAT100', { lower: true, strict: true }),
    name: 'Flat ₹100 Off',
    description: 'Flat ₹100 off above ₹699',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 699,
    usagePerUser: 1,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  }
]);
    logger.info('3 coupons created');

    await StoreSettings.create({
      siteName: 'Cake Shop',
      tagline: 'Baked with love, delivered with care',
      contactEmail: 'contact@cakeshop.com',
      contactPhone: '+91 9876543210',
      address: '123 Baker Street, Mumbai, India',
      businessHours: 'Mon-Sun: 8:00 AM - 10:00 PM',
      whatsapp: '+91 9876543210',
      social: { facebook: 'https://facebook.com/cakeshop', instagram: 'https://instagram.com/cakeshop', twitter: 'https://twitter.com/cakeshop' },
      heroBanners: [
        { title: 'Handcrafted with Love', subtitle: 'Premium Cakes for Every Celebration', ctaText: 'Shop Now', ctaLink: '/shop', isActive: true, order: 1 },
        { title: 'New Arrivals', subtitle: 'Signature Collection 2024', ctaText: 'Explore', ctaLink: '/shop?isNewArrival=true', isActive: true, order: 2 },
        { title: 'Same Day Delivery', subtitle: 'Order Before 6 PM', ctaText: 'Order Now', ctaLink: '/shop', isActive: true, order: 3 },
      ],
      shippingCharge: 50,
      freeShippingThreshold: 500,
      taxPercent: 5,
    });
    logger.info('Store settings created');

    logger.info('Seeding complete!');
  } catch (error) {
    logger.error('Seeding failed: ' + error.message);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === 'file://' + process.argv[1]) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  })();
}

export default seedDatabase;
