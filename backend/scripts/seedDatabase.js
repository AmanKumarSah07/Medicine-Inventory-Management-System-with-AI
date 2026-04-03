import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import ActivityLog from '../models/ActivityLog.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    const users = [
      {
        name: 'Aman',
        email: 'aman@medical.com',
        password: '12345678',
        role: 'admin',
        profile: {
          phone: '+1-555-0101',
          department: 'Administration',
          specialization: 'System Administration'
        }
      },
      {
        name: 'Ben',
        email: 'ben@medical.com',
        password: '1234',
        role: 'inventory',
        profile: {
          phone: '+1-555-0102',
          department: 'Inventory Management',
          specialization: 'Stock Control'
        }
      },
      {
        name: 'Chloe',
        email: 'chloe@medical.com',
        password: '1234',
        role: 'doctor',
        profile: {
          phone: '+1-555-0103',
          department: 'Emergency Medicine',
          specialization: 'Emergency Care'
        }
      },
      {
        name: 'SupplyBot',
        email: 'supplybot@medical.com',
        password: '1234',
        role: 'supplier',
        profile: {
          phone: '+1-555-0104',
          department: 'Supply Chain',
          specialization: 'Medical Supplies'
        }
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Seeded ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

// Seed suppliers
const seedSuppliers = async () => {
  try {
    // Clear existing suppliers
    await Supplier.deleteMany({});
    
    const suppliers = [
      {
        name: 'MediSupply Co.',
        contact: {
          email: 'orders@medisupply.com',
          phone: '+1-555-0201'
        },
        address: {
          street: '123 Medical Drive',
          city: 'Healthcare City',
          state: 'CA',
          zipCode: '90210',
          country: 'United States'
        },
        businessInfo: {
          taxId: 'TAX123456789',
          licenseNumber: 'LIC123456',
          website: 'https://medisupply.com',
          description: 'Leading supplier of medical equipment and pharmaceuticals'
        },
        contactPerson: {
          name: 'John Smith',
          title: 'Sales Manager',
          email: 'john.smith@medisupply.com',
          phone: '+1-555-0202'
        },
        rating: 4.5,
        isActive: true,
        isPreferred: true,
        deliveryTime: {
          average: 5,
          min: 2,
          max: 10
        },
        paymentTerms: 'net_30',
        minimumOrder: 100,
        currency: 'USD',
        specialties: ['pharmaceuticals', 'medical equipment', 'emergency supplies']
      },
      {
        name: 'PharmaDirect Inc.',
        contact: {
          email: 'orders@pharmadirect.com',
          phone: '+1-555-0301'
        },
        address: {
          street: '456 Pharma Avenue',
          city: 'Medicine Town',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        businessInfo: {
          taxId: 'TAX987654321',
          licenseNumber: 'LIC654321',
          website: 'https://pharmadirect.com',
          description: 'Direct pharmaceutical supplier with competitive pricing'
        },
        contactPerson: {
          name: 'Sarah Johnson',
          title: 'Account Manager',
          email: 'sarah.johnson@pharmadirect.com',
          phone: '+1-555-0302'
        },
        rating: 4.2,
        isActive: true,
        isPreferred: false,
        deliveryTime: {
          average: 7,
          min: 3,
          max: 14
        },
        paymentTerms: 'net_15',
        minimumOrder: 50,
        currency: 'USD',
        specialties: ['prescription drugs', 'controlled substances', 'specialty medications']
      }
    ];

    const createdSuppliers = await Supplier.insertMany(suppliers);
    console.log(`✅ Seeded ${createdSuppliers.length} suppliers`);
    return createdSuppliers;
  } catch (error) {
    console.error('Error seeding suppliers:', error);
    throw error;
  }
};

// Seed medicines
const seedMedicines = async (suppliers) => {
  try {
    // Clear existing medicines
    await Medicine.deleteMany({});
    
    const medicines = [
      {
        name: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        brandName: 'Tylenol',
        quantity: 120,
        unit: 'tablets',
        expiry: new Date('2026-01-01'),
        reorderLevel: 50,
        maxLevel: 500,
        cost: 0.25,
        currency: 'USD',
        category: 'painkiller',
        description: 'Pain relief and fever reducer',
        manufacturer: 'Johnson & Johnson',
        batchNumber: 'BATCH001',
        barcode: '1234567890123',
        ndc: '50580-123-01',
        requiresPrescription: false,
        isControlled: false,
        storageConditions: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 30, max: 70 },
          lightSensitive: false
        },
        supplier: suppliers[0]._id,
        isActive: true
      },
      {
        name: 'Ibuprofen 200mg',
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        quantity: 60,
        unit: 'tablets',
        expiry: new Date('2025-06-15'),
        reorderLevel: 40,
        maxLevel: 300,
        cost: 0.30,
        currency: 'USD',
        category: 'painkiller',
        description: 'Anti-inflammatory pain reliever',
        manufacturer: 'Pfizer',
        batchNumber: 'BATCH002',
        barcode: '1234567890124',
        ndc: '50580-124-01',
        requiresPrescription: false,
        isControlled: false,
        storageConditions: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 30, max: 70 },
          lightSensitive: false
        },
        supplier: suppliers[0]._id,
        isActive: true
      },
      {
        name: 'Amoxicillin 250mg',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        quantity: 15,
        unit: 'capsules',
        expiry: new Date('2025-01-10'),
        reorderLevel: 30,
        maxLevel: 200,
        cost: 1.50,
        currency: 'USD',
        category: 'antibiotic',
        description: 'Broad-spectrum antibiotic',
        manufacturer: 'GlaxoSmithKline',
        batchNumber: 'BATCH003',
        barcode: '1234567890125',
        ndc: '50580-125-01',
        requiresPrescription: true,
        isControlled: false,
        storageConditions: {
          temperature: { min: 2, max: 8, unit: 'celsius' },
          humidity: { min: 30, max: 70 },
          lightSensitive: true
        },
        supplier: suppliers[1]._id,
        isActive: true
      },
      {
        name: 'Morphine 10mg',
        genericName: 'Morphine Sulfate',
        brandName: 'MS Contin',
        quantity: 5,
        unit: 'tablets',
        expiry: new Date('2025-12-31'),
        reorderLevel: 10,
        maxLevel: 50,
        cost: 5.00,
        currency: 'USD',
        category: 'prescription',
        description: 'Opioid pain medication',
        manufacturer: 'Purdue Pharma',
        batchNumber: 'BATCH004',
        barcode: '1234567890126',
        ndc: '50580-126-01',
        requiresPrescription: true,
        isControlled: true,
        storageConditions: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 30, max: 70 },
          lightSensitive: true
        },
        supplier: suppliers[1]._id,
        isActive: true
      },
      {
        name: 'Vitamin D3 1000 IU',
        genericName: 'Cholecalciferol',
        brandName: 'Nature Made',
        quantity: 200,
        unit: 'tablets',
        expiry: new Date('2026-03-15'),
        reorderLevel: 100,
        maxLevel: 1000,
        cost: 0.15,
        currency: 'USD',
        category: 'vitamin',
        description: 'Vitamin D supplement',
        manufacturer: 'Nature Made',
        batchNumber: 'BATCH005',
        barcode: '1234567890127',
        ndc: '50580-127-01',
        requiresPrescription: false,
        isControlled: false,
        storageConditions: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 30, max: 70 },
          lightSensitive: false
        },
        supplier: suppliers[0]._id,
        isActive: true
      }
    ];

    const createdMedicines = await Medicine.insertMany(medicines);
    console.log(`✅ Seeded ${createdMedicines.length} medicines`);
    return createdMedicines;
  } catch (error) {
    console.error('Error seeding medicines:', error);
    throw error;
  }
};

// Seed activity logs
const seedActivityLogs = async (users) => {
  try {
    // Clear existing logs
    await ActivityLog.deleteMany({});
    
    const logs = [
      {
        action: 'user_login',
        entityType: 'user',
        entityId: users[0]._id,
        userId: users[0]._id,
        userRole: 'admin',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'info',
        category: 'authentication',
        message: 'Admin user logged in',
        details: { email: users[0].email }
      },
      {
        action: 'system_startup',
        entityType: 'system',
        entityId: null,
        userId: users[0]._id,
        userRole: 'admin',
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        severity: 'info',
        category: 'system',
        message: 'Medical Inventory System started',
        details: { version: '1.0.0' }
      },
      {
        action: 'medicine_added',
        entityType: 'medicine',
        entityId: null,
        userId: users[1]._id,
        userRole: 'inventory',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'info',
        category: 'inventory',
        message: 'Initial medicine stock added',
        details: { count: 5 }
      }
    ];

    const createdLogs = await ActivityLog.insertMany(logs);
    console.log(`✅ Seeded ${createdLogs.length} activity logs`);
    return createdLogs;
  } catch (error) {
    console.error('Error seeding activity logs:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Seed data in order
    const users = await seedUsers();
    const suppliers = await seedSuppliers();
    const medicines = await seedMedicines(suppliers);
    const logs = await seedActivityLogs(users);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Medicines: ${medicines.length}`);
    console.log(`   - Activity Logs: ${logs.length}`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin: aman@medical.com / 12345678');
    console.log('   Inventory: ben@medical.com / 1234');
    console.log('   Doctor: chloe@medical.com / 1234');
    console.log('   Supplier: supplybot@medical.com / 1234');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;

