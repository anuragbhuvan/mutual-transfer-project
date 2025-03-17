// Cloudinary configuration
const cloudConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET
};

// Upload file to Cloudinary
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'mutual_transfer');
    formData.append('cloud_name', cloudConfig.cloudName);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudConfig.cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Delete file from Cloudinary
export const deleteFile = async (publicId) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Generate signature
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${cloudConfig.apiSecret}`;
    const signature = await generateSHA1(stringToSign);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudConfig.cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          signature: signature,
          api_key: cloudConfig.apiKey,
          timestamp: timestamp
        })
      }
    );

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to generate SHA1 hash
async function generateSHA1(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Get file URL from Cloudinary
export const getFileUrl = (publicId, options = {}) => {
  const { width, height, crop } = options;
  let transformations = '';
  
  if (width || height || crop) {
    const params = [];
    if (width) params.push(`w_${width}`);
    if (height) params.push(`h_${height}`);
    if (crop) params.push(`c_${crop}`);
    transformations = params.join(',') + '/';
  }
  
  return `https://res.cloudinary.com/${cloudConfig.cloudName}/image/upload/${transformations}${publicId}`;
}; 