import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const credentialAPI = {
  // Register new UUID → Credential ID mapping
  registerCredential: async (uuid, credentialId, studentAddress, transactionHash = null) => {
    try {
      const response = await axios.post(`${API_URL}/credentials/register`, {
        uuid,
        credentialId: credentialId.toString(),
        studentAddress: studentAddress.toLowerCase(),
        transactionHash
      });
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get credential ID by UUID
  getCredentialByUUID: async (uuid) => {
    try {
      const response = await axios.get(`${API_URL}/credentials/${uuid}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Lookup failed:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all credentials for a student
  getStudentCredentials: async (address) => {
    try {
      const response = await axios.get(`${API_URL}/credentials/student/${address}`);
      return response.data;
    } catch (error) {
      console.error('Student lookup failed:', error.response?.data || error.message);
      throw error;
    }
  }
};
