import express from 'express';
import Credential from '../models/Credential.js';

const router = express.Router();

// POST /api/credentials/register - Register new UUID → ID mapping
router.post('/register', async (req, res) => {
  try {
    const { uuid, credentialId, studentAddress, transactionHash } = req.body;

    // Validate input
    if (!uuid || !credentialId || !studentAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: uuid, credentialId, studentAddress' 
      });
    }

    // Check if UUID already exists
    const existing = await Credential.findOne({ uuid });
    if (existing) {
      return res.status(409).json({ error: 'UUID already registered' });
    }

    // Save to database (plain storage, no encryption)
    const credential = new Credential({
      uuid,
      credentialId: parseInt(credentialId),
      studentAddress: studentAddress.toLowerCase(),
      transactionHash: transactionHash || null
    });

    await credential.save();

    res.status(201).json({
      success: true,
      message: 'Credential registered successfully',
      uuid
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/credentials/:uuid - Get credential ID by UUID
router.get('/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;

    // Find credential (plain lookup, no decryption needed)
    const credential = await Credential.findOne({ uuid });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({
      credentialId: credential.credentialId,
      studentAddress: credential.studentAddress,
      transactionHash: credential.transactionHash,
      createdAt: credential.createdAt
    });

  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/credentials/student/:address - Get all credentials for a student
router.get('/student/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const credentials = await Credential.find({ 
      studentAddress: address.toLowerCase() 
    }).sort({ createdAt: -1 });

    const result = credentials.map(cred => ({
      uuid: cred.uuid,
      credentialId: cred.credentialId,
      transactionHash: cred.transactionHash,
      createdAt: cred.createdAt
    }));

    res.json(result);

  } catch (error) {
    console.error('Student lookup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default router;
