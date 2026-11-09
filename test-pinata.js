import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Manually read .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const jwtMatch = envContent.match(/VITE_PINATA_JWT=(.*)/);
const PINATA_JWT = jwtMatch ? jwtMatch[1].trim() : null;

async function testAuth() {
    console.log("Testing Pinata Authentication...");
    if (!PINATA_JWT) {
        console.error("❌ VITE_PINATA_JWT is missing in .env file");
        return;
    }
    
    console.log("JWT found (starts with):", PINATA_JWT.substring(0, 20) + "...");

    try {
        const res = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`
            }
        });
        console.log("✅ Authentication Successful:", res.data);
    } catch (error) {
        console.error("❌ Authentication Failed:", error.response ? error.response.data : error.message);
    }
}

testAuth();
