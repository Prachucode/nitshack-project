import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define the Credential schema (same as in your model)
const credentialSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true, index: true },
  credentialId: { type: Number, required: true },
  studentAddress: { type: String, required: true },
  transactionHash: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Credential = mongoose.model('Credential', credentialSchema);

// Query all credentials
async function checkDatabase() {
  try {
    const credentials = await Credential.find({}).sort({ createdAt: -1 });
    
    console.log('\n📊 Database Status:\n');
    console.log(`Total credentials stored: ${credentials.length}\n`);
    
    if (credentials.length === 0) {
      console.log('⚠️  No credentials found in database!');
      console.log('   This means no UUIDs have been registered yet.');
      console.log('   → Mint a new credential to populate the database.\n');
    } else {
      console.log('✅ Found credentials:\n');
      credentials.forEach((cred, index) => {
        console.log(`${index + 1}. UUID: ${cred.uuid}`);
        console.log(`   Credential ID: ${cred.credentialId}`);
        console.log(`   Student: ${cred.studentAddress}`);
        console.log(`   Created: ${cred.createdAt}`);
        console.log(`   Tx Hash: ${cred.transactionHash || 'N/A'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error querying database:', error);
    process.exit(1);
  }
}

checkDatabase();
