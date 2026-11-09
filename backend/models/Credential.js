import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  credentialId: {
    type: Number,
    required: true
  },
  studentAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  transactionHash: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Credential', credentialSchema);
