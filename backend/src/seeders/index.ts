// Master seeder that runs all seeders in the correct order
import sequelize from '../config/database';
import User from '../models/User';
import ShopOwner from '../models/ShopOwner';
import Shop from '../models/Shop';
import Category from '../models/Category';
import Product from '../models/Product';
import Employee from '../models/Employee';
import ShopCustomer from '../models/ShopCustomer';
import Coupon from '../models/Coupon';
import Notification from '../models/Notification';
import ReferralCode from '../models/ReferralCode';
import PublicCatalog from '../models/PublicCatalog';
import ShopOrder from '../models/ShopOrder';
import ShopOrderItem from '../models/ShopOrderItem';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Helper to track seeded IDs for foreign key references
export const seededData: {
  users: string[];
  shopOwners: string[];
  shops: string[];
  categories: string[];
  products: string[];
  employees: string[];
  customers: string[];
  coupons: string[];
  orders: string[];
} = {
  users: [],
  shopOwners: [],
  shops: [],
  categories: [],
  products: [],
  employees: [],
  customers: [],
  coupons: [],
  orders: [],
};

// ==================== USER SEEDER ====================
export const seedUsers = async (): Promise<void> => {
  console.log('🌱 Seeding Users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await User.bulkCreate([
    {
      userId: uuidv4(),
      email: 'admin@apnavyapar.com',
      phoneNumber: '+919999999999',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      profileImage: 'https://via.placeholder.com/150',
      userType: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
    {
      userId: uuidv4(),
      email: 'owner1@demo.com',
      phoneNumber: '+919999999998',
      passwordHash: hashedPassword,
      firstName: 'Rahul',
      lastName: 'Sharma',
      profileImage: 'https://via.placeholder.com/150',
      userType: 'SHOP_OWNER',
      isActive: true,
      emailVerified: true,
    },
    {
      userId: uuidv4(),
      email: 'owner2@demo.com',
      phoneNumber: '+919999999997',
      passwordHash: hashedPassword,
      firstName: 'Priya',
      lastName: 'Patel',
      profileImage: 'https://via.placeholder.com/150',
      userType: 'SHOP_OWNER',
      isActive: true,
      emailVerified: true,
    },
    {
      userId: uuidv4(),
      email: 'employee1@demo.com',
      phoneNumber: '+919999999996',
      passwordHash: hashedPassword,
      firstName: 'Amit',
      lastName: 'Kumar',
      profileImage: 'https://via.placeholder.com/150',
      userType: 'EMPLOYEE',
      isActive: true,
      emailVerified: true,
    },
    {
      userId: uuidv4(),
      email: 'customer1@demo.com',
      phoneNumber: '+919999999995',
      passwordHash: hashedPassword,
      firstName: 'Vikram',
      lastName: 'Singh',
      profileImage: 'https://via.placeholder.com/150',
      userType: 'CUSTOMER',
      isActive: true,
      emailVerified: true,
    },
    {
      userId: uuidv4(),
      email: 'customer2@demo.com',
      phoneNumber: '+919999999994',
      passwordHash: hashedPassword,
      firstName: 'Anjali',
      lastName: 'Gupta',
      profileImage: 'https://via.placeholder.com/150',
      userType: 'CUSTOMER',
      isActive: true,
      emailVerified: true,
    },
  ], { ignoreDuplicates: true });

  seededData.users = users.map(u => u.userId);
  console.log(`✅ Seeded ${users.length} Users`);
};

// ==================== SHOP OWNER SEEDER ====================
export const seedShopOwners = async (): Promise<void> => {
  console.log('🌱 Seeding Shop Owners...');
  
  const owners = await ShopOwner.bulkCreate([
    {
      ownerId: uuidv4(),
      userId: seededData.users[1],
      businessName: 'Sharma Electronics',
      businessType: 'Retail Electronics',
      businessRegistrationNumber: 'BRN/2024/001',
      taxIdentificationNumber: '27AABCDU1234A1Z5',
      businessAddress: '123 Main Market Road',
      businessCity: 'Mumbai',
      businessState: 'Maharashtra',
      businessZipCode: '400001',
      businessPhone: '+919999999998',
      businessEmail: 'owner1@demo.com',
      businessWebsite: 'https://sharmaelectronics.com',
      isVerified: true,
      verificationDate: new Date(),
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isSubscriptionActive: true,
    },
    {
      ownerId: uuidv4(),
      userId: seededData.users[2],
      businessName: 'Patel Clothing House',
      businessType: 'Retail Clothing',
      businessRegistrationNumber: 'BRN/2024/002',
      taxIdentificationNumber: '27AABCP7890A1Z3',
      businessAddress: '456 Fashion Street',
      businessCity: 'Delhi',
      businessState: 'Delhi',
      businessZipCode: '110001',
      businessPhone: '+919999999997',
      businessEmail: 'owner2@demo.com',
      businessWebsite: 'https://patelclothing.com',
      isVerified: true,
      verificationDate: new Date(),
      subscriptionPlan: 'BASIC',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      isSubscriptionActive: true,
    },
  ], { ignoreDuplicates: true });

  seededData.shopOwners = owners.map(o => o.ownerId);
  console.log(`✅ Seeded ${owners.length} Shop Owners`);
};

// ==================== SHOP SEEDER ====================
export const seedShops = async (): Promise<void> => {
  console.log('🌱 Seeding Shops...');
  
  const shops = await Shop.bulkCreate([
    {
      shopId: uuidv4(),
      ownerId: seededData.shopOwners[0],
      shopName: 'Sharma Electronics',
      shopDescription: 'Best electronics store in town with latest gadgets and appliances',
      shopCategory: 'Electronics',
      shopType: 'RETAIL',
      shopLogo: 'https://via.placeholder.com/150',
      shopBanner: 'https://via.placeholder.com/800x300',
      phoneNumber: '+919999999998',
      email: 'contact@sharmaelectronics.com',
      website: 'https://sharmaelectronics.com',
      address: '123 Main Market Road, Near Railway Station',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      latitude: 19.0760,
      longitude: 72.8777,
      businessHoursStart: '09:00',
      businessHoursEnd: '21:00',
      isActive: true,
      isVerified: true,
      verificationDate: new Date(),
      totalProducts: 0,
      totalOrders: 0,
      rating: 4.5,
      totalReviews: 150,
      establishedYear: 2015,
      bankAccountHolderName: 'Rahul Sharma',
      bankAccountNumber: '1234567890',
      bankName: 'State Bank of India',
      bankBranchCode: 'SBI001',
      bankIfscCode: 'SBIN0001234',
      upiId: 'rahul@upi',
      referenceCode: 'SE001',
      referralCode: 'RAHUL2024',
      publicView: true,
    },
    {
      shopId: uuidv4(),
      ownerId: seededData.shopOwners[1],
      shopName: 'Patel Clothing House',
      shopDescription: 'Trendy clothing and fashion accessories for all ages',
      shopCategory: 'Clothing',
      shopType: 'RETAIL',
      shopLogo: 'https://via.placeholder.com/150',
      shopBanner: 'https://via.placeholder.com/800x300',
      phoneNumber: '+919999999997',
      email: 'contact@patelclothing.com',
      website: 'https://patelclothing.com',
      address: '456 Fashion Street, Karol Bagh',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India',
      latitude: 28.6527,
      longitude: 77.1913,
      businessHoursStart: '10:00',
      businessHoursEnd: '20:00',
      isActive: true,
      isVerified: true,
      verificationDate: new Date(),
      totalProducts: 0,
      totalOrders: 0,
      rating: 4.2,
      totalReviews: 89,
      establishedYear: 2018,
      bankAccountHolderName: 'Priya Patel',
      bankAccountNumber: '9876543210',
      bankName: 'HDFC Bank',
      bankBranchCode: 'HDFC001',
      bankIfscCode: 'HDFC0001234',
      upiId: 'priya@upi',
      referenceCode: 'PC001',
      referralCode: 'PRIYA2024',
      publicView: true,
    },
  ], { ignoreDuplicates: true });

  seededData.shops = shops.map(s => s.shopId);
  console.log(`✅ Seeded ${shops.length} Shops`);
};

// ==================== CATEGORY SEEDER ====================
export const seedCategories = async (): Promise<void> => {
  console.log('🌱 Seeding Categories...');
  
  const categories = await Category.bulkCreate([
    // Electronics Shop Categories
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[0],
      categoryName: 'Mobile Phones',
      description: 'Latest smartphones and accessories',
      sortOrder: 1,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[0],
      categoryName: 'Laptops & Computers',
      description: 'Laptops, desktops, and computer accessories',
      sortOrder: 2,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[0],
      categoryName: 'Audio & Headphones',
      description: 'Headphones, speakers, and audio equipment',
      sortOrder: 3,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[0],
      categoryName: 'Home Appliances',
      description: 'Kitchen and home appliances',
      sortOrder: 4,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[0],
      categoryName: 'Accessories',
      description: 'Mobile and laptop accessories',
      sortOrder: 5,
      isActive: true,
    },
    // Clothing Shop Categories
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[1],
      categoryName: 'Men\'s Wear',
      description: 'Men\'s clothing and fashion',
      sortOrder: 1,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[1],
      categoryName: 'Women\'s Wear',
      description: 'Women\'s clothing and fashion',
      sortOrder: 2,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[1],
      categoryName: 'Kids Wear',
      description: 'Children\'s clothing',
      sortOrder: 3,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[1],
      categoryName: 'Footwear',
      description: 'Shoes, sandals, and slippers',
      sortOrder: 4,
      isActive: true,
    },
    {
      categoryId: uuidv4(),
      shopId: seededData.shops[1],
      categoryName: 'Accessories',
      description: 'Fashion accessories and jewelry',
      sortOrder: 5,
      isActive: true,
    },
  ], { ignoreDuplicates: true });

  seededData.categories = categories.map(c => c.categoryId);
  console.log(`✅ Seeded ${categories.length} Categories`);
};

// ==================== PRODUCT SEEDER ====================
export const seedProducts = async (): Promise<void> => {
  console.log('🌱 Seeding Products...');
  
  const products = await Product.bulkCreate([
    // Electronics Products (Shop 1)
    {
      productId: uuidv4(),
      shopId: seededData.shops[0],
      categoryId: seededData.categories[0],
      productCode: 'MOB001',
      productName: 'iPhone 15 Pro Max',
      description: 'Latest Apple iPhone with advanced features',
      brand: 'Apple',
      manufacturer: 'Apple Inc.',
      retailPrice: 159900,
      wholesalePrice: 149900,
      costPrice: 140000,
      mrp: 159900,
      discountPercentage: 5,
      taxPercentage: 18,
      stockQuantity: 50,
      reorderLevel: 10,
      maxStockLevel: 100,
      unit: 'piece',
      weight: 0.5,
      dimensions: '15.9 x 7.6 x 0.8 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['smartphone', 'apple', 'iphone'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 12,
      returnDays: 15,
      hsnCode: '85171300',
      sgstRate: 9,
      cgstRate: 9,
      igstRate: 18,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[0],
      categoryId: seededData.categories[0],
      productCode: 'MOB002',
      productName: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android smartphone',
      brand: 'Samsung',
      manufacturer: 'Samsung Electronics',
      retailPrice: 129999,
      wholesalePrice: 119999,
      costPrice: 110000,
      mrp: 129999,
      discountPercentage: 8,
      taxPercentage: 18,
      stockQuantity: 35,
      reorderLevel: 10,
      maxStockLevel: 80,
      unit: 'piece',
      weight: 0.4,
      dimensions: '16.2 x 7.6 x 0.9 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['smartphone', 'samsung', 'android'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 12,
      returnDays: 15,
      hsnCode: '85171300',
      sgstRate: 9,
      cgstRate: 9,
      igstRate: 18,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[0],
      categoryId: seededData.categories[1],
      productCode: 'LAP001',
      productName: 'MacBook Pro 14 inch M3',
      description: 'Powerful laptop for professionals',
      brand: 'Apple',
      manufacturer: 'Apple Inc.',
      retailPrice: 199900,
      wholesalePrice: 189900,
      costPrice: 175000,
      mrp: 199900,
      discountPercentage: 3,
      taxPercentage: 18,
      stockQuantity: 20,
      reorderLevel: 5,
      maxStockLevel: 40,
      unit: 'piece',
      weight: 1.6,
      dimensions: '31.3 x 22.1 x 1.5 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['laptop', 'apple', 'macbook'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 24,
      returnDays: 15,
      hsnCode: '84713010',
      sgstRate: 9,
      cgstRate: 9,
      igstRate: 18,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[0],
      categoryId: seededData.categories[1],
      productCode: 'LAP002',
      productName: 'Dell XPS 15',
      description: 'Premium Windows laptop',
      brand: 'Dell',
      manufacturer: 'Dell Technologies',
      retailPrice: 149999,
      wholesalePrice: 139999,
      costPrice: 125000,
      mrp: 159999,
      discountPercentage: 10,
      taxPercentage: 18,
      stockQuantity: 15,
      reorderLevel: 5,
      maxStockLevel: 30,
      unit: 'piece',
      weight: 2.0,
      dimensions: '34.4 x 23.0 x 1.8 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['laptop', 'dell', 'xps'],
      isFeatured: false,
      isActive: true,
      warrantyMonths: 24,
      returnDays: 15,
      hsnCode: '84713010',
      sgstRate: 9,
      cgstRate: 9,
      igstRate: 18,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[0],
      categoryId: seededData.categories[2],
      productCode: 'AUD001',
      productName: 'Sony WH-1000XM5',
      description: 'Premium noise cancelling headphones',
      brand: 'Sony',
      manufacturer: 'Sony Corporation',
      retailPrice: 29990,
      wholesalePrice: 27990,
      costPrice: 25000,
      mrp: 29990,
      discountPercentage: 10,
      taxPercentage: 18,
      stockQuantity: 40,
      reorderLevel: 10,
      maxStockLevel: 80,
      unit: 'piece',
      weight: 0.25,
      dimensions: '20 x 18 x 7 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['headphones', 'sony', 'bluetooth'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 12,
      returnDays: 15,
      hsnCode: '85183000',
      sgstRate: 9,
      cgstRate: 9,
      igstRate: 18,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[0],
      categoryId: seededData.categories[3],
      productCode: 'APL001',
      productName: 'Samsung 1.5 Ton Split AC',
      description: 'Energy efficient split AC',
      brand: 'Samsung',
      manufacturer: 'Samsung Electronics',
      retailPrice: 45999,
      wholesalePrice: 42999,
      costPrice: 38000,
      mrp: 49999,
      discountPercentage: 8,
      taxPercentage: 28,
      stockQuantity: 25,
      reorderLevel: 5,
      maxStockLevel: 50,
      unit: 'piece',
      weight: 35,
      dimensions: '90 x 30 x 20 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['ac', 'air conditioner', 'samsung'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 60,
      returnDays: 30,
      hsnCode: '84151010',
      sgstRate: 14,
      cgstRate: 14,
      igstRate: 28,
    },
    // Clothing Products (Shop 2)
    {
      productId: uuidv4(),
      shopId: seededData.shops[1],
      categoryId: seededData.categories[5],
      productCode: 'MEN001',
      productName: 'Cotton Formal Shirt',
      description: 'Premium cotton formal shirt for men',
      brand: 'Peter England',
      manufacturer: 'Aditya Birla Group',
      retailPrice: 1799,
      wholesalePrice: 1499,
      costPrice: 800,
      mrp: 1999,
      discountPercentage: 10,
      taxPercentage: 12,
      stockQuantity: 100,
      reorderLevel: 20,
      maxStockLevel: 200,
      unit: 'piece',
      weight: 0.2,
      dimensions: '30 x 25 x 2 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['shirt', 'formal', 'men'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 0,
      returnDays: 7,
      hsnCode: '62052000',
      sgstRate: 6,
      cgstRate: 6,
      igstRate: 12,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[1],
      categoryId: seededData.categories[5],
      productCode: 'MEN002',
      productName: 'Slim Fit Jeans',
      description: 'Modern slim fit jeans for men',
      brand: 'Levi\'s',
      manufacturer: 'Levi Strauss India',
      retailPrice: 3999,
      wholesalePrice: 3499,
      costPrice: 1800,
      mrp: 4499,
      discountPercentage: 11,
      taxPercentage: 12,
      stockQuantity: 75,
      reorderLevel: 15,
      maxStockLevel: 150,
      unit: 'piece',
      weight: 0.5,
      dimensions: '35 x 30 x 3 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['jeans', 'men', 'casual'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 0,
      returnDays: 7,
      hsnCode: '62034200',
      sgstRate: 6,
      cgstRate: 6,
      igstRate: 12,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[1],
      categoryId: seededData.categories[6],
      productCode: 'WOM001',
      productName: 'Silk Saree',
      description: 'Beautiful silk saree for women',
      brand: 'W',
      manufacturer: 'W Limited',
      retailPrice: 5999,
      wholesalePrice: 4999,
      costPrice: 2500,
      mrp: 6999,
      discountPercentage: 14,
      taxPercentage: 5,
      stockQuantity: 40,
      reorderLevel: 10,
      maxStockLevel: 80,
      unit: 'piece',
      weight: 0.8,
      dimensions: '20 x 15 x 5 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['saree', 'silk', 'women'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 0,
      returnDays: 7,
      hsnCode: '62114210',
      sgstRate: 2.5,
      cgstRate: 2.5,
      igstRate: 5,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[1],
      categoryId: seededData.categories[6],
      productCode: 'WOM002',
      productName: 'Anarkali Suit',
      description: 'Traditional Anarkali suit set',
      brand: 'Libas',
      manufacturer: 'Libas Retail Ltd',
      retailPrice: 4499,
      wholesalePrice: 3999,
      costPrice: 2000,
      mrp: 4999,
      discountPercentage: 10,
      taxPercentage: 5,
      stockQuantity: 50,
      reorderLevel: 10,
      maxStockLevel: 100,
      unit: 'piece',
      weight: 0.6,
      dimensions: '25 x 20 x 4 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['suit', 'anarkali', 'women'],
      isFeatured: false,
      isActive: true,
      warrantyMonths: 0,
      returnDays: 7,
      hsnCode: '62114210',
      sgstRate: 2.5,
      cgstRate: 2.5,
      igstRate: 5,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[1],
      categoryId: seededData.categories[7],
      productCode: 'KID001',
      productName: 'Kids Cotton Frock',
      description: 'Colorful cotton frock for girls',
      brand: 'Gini & Jony',
      manufacturer: 'Gini & Jony Ltd',
      retailPrice: 899,
      wholesalePrice: 749,
      costPrice: 400,
      mrp: 999,
      discountPercentage: 10,
      taxPercentage: 12,
      stockQuantity: 60,
      reorderLevel: 15,
      maxStockLevel: 120,
      unit: 'piece',
      weight: 0.15,
      dimensions: '20 x 15 x 2 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['kids', 'frock', 'girls'],
      isFeatured: false,
      isActive: true,
      warrantyMonths: 0,
      returnDays: 7,
      hsnCode: '62044210',
      sgstRate: 6,
      cgstRate: 6,
      igstRate: 12,
    },
    {
      productId: uuidv4(),
      shopId: seededData.shops[1],
      categoryId: seededData.categories[8],
      productCode: 'FTW001',
      productName: 'Men\'s Leather Formal Shoes',
      description: 'Premium leather formal shoes',
      brand: 'Bata',
      manufacturer: 'Bata India Ltd',
      retailPrice: 2499,
      wholesalePrice: 2199,
      costPrice: 1200,
      mrp: 2799,
      discountPercentage: 11,
      taxPercentage: 12,
      stockQuantity: 45,
      reorderLevel: 10,
      maxStockLevel: 90,
      unit: 'pair',
      weight: 1.0,
      dimensions: '30 x 12 x 10 cm',
      imageUrl: 'https://via.placeholder.com/300',
      tags: ['shoes', 'formal', 'men'],
      isFeatured: true,
      isActive: true,
      warrantyMonths: 6,
      returnDays: 7,
      hsnCode: '64039110',
      sgstRate: 6,
      cgstRate: 6,
      igstRate: 12,
    },
  ], { ignoreDuplicates: true });

  seededData.products = products.map(p => p.productId);
  console.log(`✅ Seeded ${products.length} Products`);
};

// ==================== EMPLOYEE SEEDER ====================
export const seedEmployees = async (): Promise<void> => {
  console.log('🌱 Seeding Employees...');
  
  const employees = await Employee.bulkCreate([
    {
      employeeId: uuidv4(),
      shopId: seededData.shops[0],
      userId: seededData.users[3],
      employeeCode: 'EMP001',
      designation: 'Store Manager',
      department: 'Operations',
      employmentType: 'FULL_TIME',
      employeeType: 'MANAGER',
      staffRole: 'Manager',
      permissions: {
        canViewProducts: true,
        canAddProducts: true,
        canEditProducts: true,
        canDeleteProducts: false,
        canViewCustomers: true,
        canAddCustomers: true,
        canEditCustomers: true,
        canDeleteCustomers: false,
        canViewOrders: true,
        canManageOrders: true,
        canViewEmployees: true,
        canManageEmployees: false,
        canViewInventory: true,
        canManageInventory: true,
        canViewReports: true,
        canManageSettings: false,
        canViewAccounting: true,
        canManageAccounting: true,
      },
      salary: 50000,
      joiningDate: new Date('2023-01-15'),
      firstName: 'Amit',
      lastName: 'Kumar',
      email: 'employee1@demo.com',
      phone: '+919999999996',
      isActive: true,
    },
    {
      employeeId: uuidv4(),
      shopId: seededData.shops[0],
      employeeCode: 'EMP002',
      designation: 'Sales Associate',
      department: 'Sales',
      employmentType: 'FULL_TIME',
      employeeType: 'WORKER',
      staffRole: 'Staff',
      permissions: {
        canViewProducts: true,
        canAddProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canViewCustomers: true,
        canAddCustomers: true,
        canEditCustomers: false,
        canDeleteCustomers: false,
        canViewOrders: true,
        canManageOrders: false,
        canViewEmployees: false,
        canManageEmployees: false,
        canViewInventory: true,
        canManageInventory: false,
        canViewReports: false,
        canManageSettings: false,
        canViewAccounting: false,
        canManageAccounting: false,
      },
      salary: 25000,
      joiningDate: new Date('2023-06-01'),
      firstName: 'Rajesh',
      lastName: 'Yadav',
      email: 'rajesh@demo.com',
      phone: '+919999999993',
      isActive: true,
    },
    {
      employeeId: uuidv4(),
      shopId: seededData.shops[1],
      employeeCode: 'EMP003',
      designation: 'Floor Supervisor',
      department: 'Operations',
      employmentType: 'FULL_TIME',
      employeeType: 'MANAGER',
      staffRole: 'Manager',
      permissions: {
        canViewProducts: true,
        canAddProducts: true,
        canEditProducts: true,
        canDeleteProducts: false,
        canViewCustomers: true,
        canAddCustomers: true,
        canEditCustomers: true,
        canDeleteCustomers: false,
        canViewOrders: true,
        canManageOrders: true,
        canViewEmployees: true,
        canManageEmployees: false,
        canViewInventory: true,
        canManageInventory: true,
        canViewReports: true,
        canManageSettings: false,
        canViewAccounting: true,
        canManageAccounting: false,
      },
      salary: 35000,
      joiningDate: new Date('2022-09-10'),
      firstName: 'Sneha',
      lastName: 'Shah',
      email: 'sneha@demo.com',
      phone: '+919999999992',
      isActive: true,
    },
  ], { ignoreDuplicates: true });

  seededData.employees = employees.map(e => e.employeeId);
  console.log(`✅ Seeded ${employees.length} Employees`);
};

// ==================== CUSTOMER SEEDER ====================
export const seedCustomers = async (): Promise<void> => {
  console.log('🌱 Seeding Customers...');
  
  const customers = await ShopCustomer.bulkCreate([
    {
      customerId: uuidv4(),
      shopId: seededData.shops[0],
      userId: seededData.users[4],
      customerType: 'RETAIL',
      referralCodeUsed: '',
      fullName: 'Vikram Singh',
      email: 'customer1@demo.com',
      phone: '+919999999995',
      address: '101, ABC Apartments, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      creditLimit: 10000,
      outstandingBalance: 0,
      totalPurchases: 25000,
      loyaltyPoints: 250,
      isActive: true,
    },
    {
      customerId: uuidv4(),
      shopId: seededData.shops[0],
      userId: seededData.users[5],
      customerType: 'WHOLESALE',
      referralCodeUsed: '',
      fullName: 'Anjali Gupta',
      email: 'customer2@demo.com',
      phone: '+919999999994',
      companyName: 'Gupta Enterprises',
      gstNumber: '27AABCG7890A1Z5',
      address: '202, Business Park, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
      creditLimit: 100000,
      outstandingBalance: 15000,
      totalPurchases: 500000,
      loyaltyPoints: 5000,
      isActive: true,
    },
    {
      customerId: uuidv4(),
      shopId: seededData.shops[0],
      customerType: 'RETAIL',
      referralCodeUsed: '',
      fullName: 'Sanjay Mehta',
      email: 'sanjay@demo.com',
      phone: '+919999999993',
      address: '303, Sunrise CHS, Bandra East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      creditLimit: 5000,
      outstandingBalance: 0,
      totalPurchases: 15000,
      loyaltyPoints: 150,
      isActive: true,
    },
    {
      customerId: uuidv4(),
      shopId: seededData.shops[1],
      customerType: 'RETAIL',
      referralCodeUsed: '',
      fullName: 'Pooja Sharma',
      email: 'pooja@demo.com',
      phone: '+919999999991',
      address: '401, Model Town',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110009',
      creditLimit: 10000,
      outstandingBalance: 0,
      totalPurchases: 35000,
      loyaltyPoints: 350,
      isActive: true,
    },
    {
      customerId: uuidv4(),
      shopId: seededData.shops[1],
      customerType: 'WHOLESALE',
      referralCodeUsed: '',
      fullName: 'Rajesh Textiles',
      email: 'rajesh@textiles.com',
      phone: '+919999999990',
      companyName: 'Rajesh Textiles',
      gstNumber: '07AABCR1234A1Z3',
      address: '502, Gandhi Market',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110006',
      creditLimit: 200000,
      outstandingBalance: 45000,
      totalPurchases: 750000,
      loyaltyPoints: 7500,
      isActive: true,
    },
  ], { ignoreDuplicates: true });

  seededData.customers = customers.map(c => c.customerId);
  console.log(`✅ Seeded ${customers.length} Customers`);
};

// ==================== COUPON SEEDER ====================
export const seedCoupons = async (): Promise<void> => {
  console.log('🌱 Seeding Coupons...');
  
  const coupons = await Coupon.bulkCreate([
    {
      couponId: uuidv4(),
      shopId: seededData.shops[0],
      couponCode: 'WELCOME10',
      discountType: 'Percentage',
      discountValue: 10,
      minPurchase: 1000,
      maxDiscount: 500,
      usageLimit: 100,
      usedCount: 45,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      applicableTo: 'All',
      isActive: true,
      description: 'Welcome discount for new customers - 10% off',
      createdBy: seededData.users[1],
    },
    {
      couponId: uuidv4(),
      shopId: seededData.shops[0],
      couponCode: 'FLAT500',
      discountType: 'Fixed',
      discountValue: 500,
      minPurchase: 5000,
      usageLimit: 50,
      usedCount: 20,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      applicableTo: 'All',
      isActive: true,
      description: 'Flat ₹500 off on orders above ₹5000',
      createdBy: seededData.users[1],
    },
    {
      couponId: uuidv4(),
      shopId: seededData.shops[1],
      couponCode: 'FESTIVE20',
      discountType: 'Percentage',
      discountValue: 20,
      minPurchase: 2000,
      maxDiscount: 1000,
      usageLimit: 200,
      usedCount: 85,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicableTo: 'All',
      isActive: true,
      description: 'Festive season special - 20% off',
      createdBy: seededData.users[2],
    },
  ], { ignoreDuplicates: true });

  seededData.coupons = coupons.map(c => c.couponId);
  console.log(`✅ Seeded ${coupons.length} Coupons`);
};

// ==================== NOTIFICATION SEEDER ====================
export const seedNotifications = async (): Promise<void> => {
  console.log('🌱 Seeding Notifications...');
  
  await Notification.bulkCreate([
    {
      notificationId: uuidv4(),
      userId: seededData.users[1],
      shopId: seededData.shops[0],
      notificationType: 'System',
      title: 'Welcome to Apna Vyapar!',
      message: 'Your shop Sharma Electronics has been successfully created.',
      priority: 'Normal',
      isRead: false,
    },
    {
      notificationId: uuidv4(),
      userId: seededData.users[1],
      shopId: seededData.shops[0],
      notificationType: 'Order',
      title: 'New Order Received',
      message: 'You have received a new order from Vikram Singh.',
      priority: 'High',
      isRead: false,
    },
    {
      notificationId: uuidv4(),
      userId: seededData.users[2],
      shopId: seededData.shops[1],
      notificationType: 'System',
      title: 'Welcome to Apna Vyapar!',
      message: 'Your shop Patel Clothing House has been successfully created.',
      priority: 'Normal',
      isRead: false,
    },
  ], { ignoreDuplicates: true });

  console.log('✅ Seeded Notifications');
};

// ==================== REFERRAL CODE SEEDER ====================
export const seedReferralCodes = async (): Promise<void> => {
  console.log('🌱 Seeding Referral Codes...');
  
  await ReferralCode.bulkCreate([
    {
      referralId: uuidv4(),
      shopId: seededData.shops[0],
      referralCode: 'RAHUL10',
      name: 'Welcome Referral',
      description: 'Get 10% discount on your first purchase',
      selectionType: 'products',
      selectedProducts: seededData.products.slice(0, 3),
      isActive: true,
      createdBy: seededData.users[1],
    },
    {
      referralId: uuidv4(),
      shopId: seededData.shops[1],
      referralCode: 'PRIYA15',
      name: 'Special Referral',
      description: 'Get 15% discount on festive purchases',
      selectionType: 'categories',
      selectedCategories: seededData.categories.slice(5, 8),
      isActive: true,
      createdBy: seededData.users[2],
    },
  ], { ignoreDuplicates: true });

  console.log('✅ Seeded Referral Codes');
};

// ==================== PUBLIC CATALOG SEEDER ====================
export const seedPublicCatalogs = async (): Promise<void> => {
  console.log('🌱 Seeding Public Catalogs...');
  
  await PublicCatalog.bulkCreate([
    {
      catalogId: uuidv4(),
      shopId: seededData.shops[0],
      isEnabled: true,
      description: 'Summer Sale 2024 - Exciting discounts on all electronics',
      createdBy: seededData.users[1],
    },
    {
      catalogId: uuidv4(),
      shopId: seededData.shops[1],
      isEnabled: true,
      description: 'Festive Collection - New arrivals for festive season',
      createdBy: seededData.users[2],
    },
  ], { ignoreDuplicates: true });

  console.log('✅ Seeded Public Catalogs');
};

// ==================== ORDER SEEDER ====================
export const seedOrders = async (): Promise<void> => {
  console.log('🌱 Seeding Orders...');
  
  // Generate order numbers
  const generateOrderNumber = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };
  
  const orders = await ShopOrder.bulkCreate([
    {
      orderId: uuidv4(),
      orderNumber: generateOrderNumber('ORD'),
      shopId: seededData.shops[0],
      customerId: seededData.customers[0],
      employeeId: seededData.employees[0],
      orderType: 'RETAIL',
      orderStatus: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      subtotal: 159900,
      taxAmount: 28782,
      discountAmount: 7995,
      shippingCharges: 0,
      totalAmount: 180687,
      paidAmount: 180687,
      balanceAmount: 0,
      deliveryAddress: '101, ABC Apartments, Andheri East',
      deliveryCity: 'Mumbai',
      deliveryPincode: '400069',
      estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      actualDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV/2024/001',
      invoiceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      orderId: uuidv4(),
      orderNumber: generateOrderNumber('ORD'),
      shopId: seededData.shops[0],
      customerId: seededData.customers[1],
      employeeId: seededData.employees[0],
      orderType: 'WHOLESALE',
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PARTIAL',
      paymentMethod: 'CREDIT',
      subtotal: 299900,
      taxAmount: 53982,
      discountAmount: 29990,
      shippingCharges: 500,
      totalAmount: 324392,
      paidAmount: 150000,
      balanceAmount: 174392,
      deliveryAddress: '202, Business Park, Andheri West',
      deliveryCity: 'Mumbai',
      deliveryPincode: '400058',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV/2024/002',
      invoiceDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      orderId: uuidv4(),
      orderNumber: generateOrderNumber('ORD'),
      shopId: seededData.shops[1],
      customerId: seededData.customers[3],
      employeeId: seededData.employees[2],
      orderType: 'RETAIL',
      orderStatus: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      subtotal: 5798,
      taxAmount: 290,
      discountAmount: 580,
      shippingCharges: 50,
      totalAmount: 5558,
      paidAmount: 5558,
      balanceAmount: 0,
      deliveryAddress: '401, Model Town',
      deliveryCity: 'Delhi',
      deliveryPincode: '110009',
      estimatedDelivery: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      actualDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV/2024/003',
      invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ], { ignoreDuplicates: true });

  seededData.orders = orders.map(o => o.orderId);
  console.log(`✅ Seeded ${orders.length} Orders`);
};

// ==================== ORDER ITEM SEEDER ====================
export const seedOrderItems = async (): Promise<void> => {
  console.log('🌱 Seeding Order Items...');
  
  // Get the first order's products
  const order1Product1 = seededData.products[0]; // iPhone
  const order1Product2 = seededData.products[4]; // Headphones
  
  await ShopOrderItem.bulkCreate([
    // Order 1 items (Electronics Shop)
    {
      orderItemId: uuidv4(),
      orderId: seededData.orders[0],
      productId: order1Product1,
      productName: 'iPhone 15 Pro Max',
      productCode: 'MOB001',
      quantity: 1,
      unitPrice: 151900,
      discountPercentage: 5,
      discountAmount: 7595,
      taxPercentage: 18,
      taxAmount: 27342,
      subtotal: 151900,
      totalPrice: 171647,
      itemStatus: 'DELIVERED',
    },
    {
      orderItemId: uuidv4(),
      orderId: seededData.orders[0],
      productId: order1Product2,
      productName: 'Sony WH-1000XM5',
      productCode: 'AUD001',
      quantity: 1,
      unitPrice: 26991,
      discountPercentage: 10,
      discountAmount: 2699,
      taxPercentage: 18,
      taxAmount: 4373,
      subtotal: 26991,
      totalPrice: 28665,
      itemStatus: 'DELIVERED',
    },
    // Order 2 items (Electronics Shop - Wholesale)
    {
      orderItemId: uuidv4(),
      orderId: seededData.orders[1],
      productId: seededData.products[2],
      productName: 'MacBook Pro 14 inch M3',
      productCode: 'LAP001',
      quantity: 1,
      unitPrice: 189900,
      discountPercentage: 10,
      discountAmount: 18990,
      taxPercentage: 18,
      taxAmount: 30764,
      subtotal: 189900,
      totalPrice: 201674,
      itemStatus: 'CONFIRMED',
    },
    // Order 3 items (Clothing Shop)
    {
      orderItemId: uuidv4(),
      orderId: seededData.orders[2],
      productId: seededData.products[6],
      productName: 'Cotton Formal Shirt',
      productCode: 'MEN001',
      quantity: 2,
      unitPrice: 1499,
      discountPercentage: 10,
      discountAmount: 300,
      taxPercentage: 12,
      taxAmount: 180,
      subtotal: 2998,
      totalPrice: 2878,
      itemStatus: 'DELIVERED',
    },
    {
      orderItemId: uuidv4(),
      orderId: seededData.orders[2],
      productId: seededData.products[7],
      productName: 'Slim Fit Jeans',
      productCode: 'MEN002',
      quantity: 1,
      unitPrice: 3499,
      discountPercentage: 11,
      discountAmount: 385,
      taxPercentage: 12,
      taxAmount: 374,
      subtotal: 3499,
      totalPrice: 3488,
      itemStatus: 'DELIVERED',
    },
  ], { ignoreDuplicates: true });

  console.log('✅ Seeded Order Items');
};

// ==================== MAIN RUN FUNCTION ====================
export const runAllSeeders = async (): Promise<void> => {
  console.log('\n🚀 Starting database seeding...\n');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Run all seeders in order
    await seedUsers();
    await seedShopOwners();
    await seedShops();
    await seedCategories();
    await seedProducts();
    await seedEmployees();
    await seedCustomers();
    await seedCoupons();
    await seedNotifications();
    await seedReferralCodes();
    await seedPublicCatalogs();
    
    console.log('\n🎉 Database seeding completed!\n');
    console.log('📊 Seeded Data Summary:');
    console.log(`   - Users: ${seededData.users.length}`);
    console.log(`   - Shop Owners: ${seededData.shopOwners.length}`);
    console.log(`   - Shops: ${seededData.shops.length}`);
    console.log(`   - Categories: ${seededData.categories.length}`);
    console.log(`   - Products: ${seededData.products.length}`);
    console.log(`   - Employees: ${seededData.employees.length}`);
    console.log(`   - Customers: ${seededData.customers.length}`);
    console.log(`   - Coupons: ${seededData.coupons.length}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

