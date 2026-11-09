/**
 * IPFS Helper Utilities
 * Converts IPFS URIs to HTTP gateway URLs and fetches metadata
 */

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Converts an IPFS URI to an HTTP gateway URL
 * @param {string} ipfsUri - The IPFS URI (e.g., "ipfs://QmHash...")
 * @returns {string} The HTTP gateway URL
 */
export function getIPFSGatewayUrl(ipfsUri) {
  if (!ipfsUri) {
    return '';
  }

  // If it's already an HTTP URL, return as is
  if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
    return ipfsUri;
  }

  // Remove "ipfs://" prefix if present
  const hash = ipfsUri.replace('ipfs://', '');

  return `${IPFS_GATEWAY}${hash}`;
}

/**
 * Fetches metadata JSON from IPFS
 * @param {string} ipfsUri - The IPFS URI
 * @returns {Promise<Object>} The parsed JSON metadata
 */
export async function fetchMetadata(ipfsUri) {
  try {
    const url = getIPFSGatewayUrl(ipfsUri);

    if (!url) {
      throw new Error('Invalid IPFS URI');
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    throw error;
  }
}

/**
 * Fetches a PDF file from IPFS and returns a blob URL
 * @param {string} ipfsUri - The IPFS URI of the PDF
 * @returns {Promise<string>} Blob URL for the PDF
 */
export async function fetchPDFBlob(ipfsUri) {
  try {
    const url = getIPFSGatewayUrl(ipfsUri);

    if (!url) {
      throw new Error('Invalid IPFS URI');
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  } catch (error) {
    console.error('Error fetching PDF from IPFS:', error);
    throw error;
  }
}

