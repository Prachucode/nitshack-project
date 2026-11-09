import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testBackend() {
  console.log('Testing Backend Connection...');
  
  // 1. Health Check
  try {
    // Note: The health endpoint is at /health, not /api/health based on previous checks
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Health Check Passed:', health.data);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
  }

  // 2. Register UUID
  const testUUID = 'test-' + Date.now();
  const testId = 123;
  const testAddress = '0x1234567890123456789012345678901234567890';
  
  console.log(`\nRegistering UUID: ${testUUID}`);
  try {
    const reg = await axios.post(`${API_URL}/credentials/register`, {
      uuid: testUUID,
      credentialId: testId,
      studentAddress: testAddress
    });
    console.log('✅ Registration Success:', reg.data);
  } catch (error) {
    console.error('❌ Registration Failed:', error.response?.data || error.message);
  }

  // 3. Lookup UUID
  console.log(`\nLooking up UUID: ${testUUID}`);
  try {
    const lookup = await axios.get(`${API_URL}/credentials/${testUUID}`);
    console.log('✅ Lookup Success:', lookup.data);
  } catch (error) {
    console.error('❌ Lookup Failed:', error.response?.data || error.message);
  }
}

testBackend();
