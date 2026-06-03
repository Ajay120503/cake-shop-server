import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], default: 'string' },
    category: { type: String, default: 'general' },
    description: String,
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Singleton for store settings
const storeSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'Cake Shop' },
    tagline: { type: String, default: 'Baked with love' },
    description: String,
    logo: {
      public_id: String,
      url: String,
    },
    favicon: String,
    contactEmail: { type: String, default: 'contact@cakeshop.com' },
    contactPhone: { type: String, default: '+91 9876543210' },
    whatsapp: String,
    address: String,
    businessHours: String,
    social: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
      pinterest: String,
    },
    // Home page content
    heroBanners: [
      {
        title: String,
        subtitle: String,
        description: String,
        image: { public_id: String, url: String },
        ctaText: String,
        ctaLink: String,
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    featuredSection: {
      title: { type: String, default: 'Featured Cakes' },
      subtitle: String,
      isActive: { type: Boolean, default: true },
    },
    bestSellersSection: {
      title: { type: String, default: 'Best Sellers' },
      subtitle: String,
      isActive: { type: Boolean, default: true },
    },
    newArrivalsSection: {
      title: { type: String, default: 'New Arrivals' },
      subtitle: String,
      isActive: { type: Boolean, default: true },
    },
    pastriesSection: {
      title: { type: String, default: 'Popular Pastries' },
      subtitle: String,
      isActive: { type: Boolean, default: true },
    },
    trendingSection: {
      title: { type: String, default: 'Trending Now' },
      subtitle: String,
      isActive: { type: Boolean, default: true },
    },
    galleryImages: [
      {
        public_id: String,
        url: String,
        caption: String,
      },
    ],
    // Shipping & Tax
    shippingCharge: { type: Number, default: 50 },
    freeShippingThreshold: { type: Number, default: 500 },
    taxPercent: { type: Number, default: 5 },
    // Loyalty
    loyaltyPointsPerRupee: { type: Number, default: 0.1 },
    loyaltySignupBonus: { type: Number, default: 100 },
  },
  { timestamps: true },
);

export const Settings = mongoose.model('Settings', settingsSchema);
export const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
export default Settings;
