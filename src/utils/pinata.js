import axios from 'axios';

const JWT = import.meta.env.VITE_PINATA_JWT; 

// Function 1: Upload the Physical File (PDF)
export const uploadFileToIPFS = async (file, certificateType = 'credential') => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Enhanced Pinata metadata for better file organization
        const timestamp = new Date().toISOString().split('T')[0];
        const metadata = JSON.stringify({
            name: `${certificateType}_${timestamp}_${file.name}`,
            keyvalues: {
                type: 'credential_document',
                certificateType: certificateType,
                uploadDate: timestamp,
                fileType: 'PDF'
            }
        });
        formData.append('pinataMetadata', metadata);

        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: {
                'Authorization': `Bearer ${JWT}`,
                "Content-Type": "multipart/form-data"
            },
        });
        return res.data.IpfsHash; // This is the ID of the PDF
    } catch (error) {
        console.error("Error uploading file to IPFS: ", error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

// Function 2: Upload the JSON Data (The Certificate "Card")
export const uploadJSONToIPFS = async (body, certificateType = 'credential') => {
    try {
        // Enhanced Pinata options for better organization
        const timestamp = new Date().toISOString().split('T')[0];
        const data = {
            pinataContent: body,
            pinataMetadata: {
                name: `${certificateType}_Metadata_${timestamp}`,
                keyvalues: {
                    type: 'credential_metadata',
                    certificateType: certificateType,
                    uploadDate: timestamp,
                    version: '1.0'
                }
            }
        };

        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
            headers: {
                'Authorization': `Bearer ${JWT}`,
                "Content-Type": "application/json"
            },
        });
        return res.data.IpfsHash; // This is the ID of the Metadata
    } catch (error) {
        console.error("Error uploading JSON to IPFS: ", error);
        throw new Error(`Failed to upload metadata: ${error.message}`);
    }
};