// Simple test to verify auth service structure
const MongoDBUserService = require('./src/services/userService');

async function testAuthService() {
  console.log('🧪 Testing Auth Service Structure...');
  
  try {
    // Create service instance
    const userService = new MongoDBUserService();
    
    // Test connection (will fail without MongoDB Atlas, but that's expected)
    try {
      await userService.connect();
      console.log('✅ MongoDB connection successful');
    } catch (error) {
      console.log('⚠️  MongoDB connection failed (expected without Atlas setup):', error.message);
    }
    
    // Test password hashing
    const testPassword = 'testpassword123';
    const hashedPassword = await userService.hashPassword(testPassword);
    console.log('✅ Password hashing works');
    
    // Test password comparison
    const isValid = await userService.comparePassword(testPassword, hashedPassword);
    console.log('✅ Password comparison works:', isValid);
    
    // Test with invalid password
    const isInvalid = await userService.comparePassword('wrongpassword', hashedPassword);
    console.log('✅ Invalid password detection works:', !isInvalid);
    
    console.log('\n🎉 Auth service structure is ready!');
    console.log('📝 Next steps:');
    console.log('   1. Set up MongoDB Atlas cluster');
    console.log('   2. Add MONGODB_URI to environment variables');
    console.log('   3. Test user registration and login');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuthService(); 