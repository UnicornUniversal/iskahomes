/**
 * Upload a file using the API endpoint
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name (default: 'iskaHomes')
 * @param {string} folder - The folder path within the bucket
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const uploadFileToStorage = async (file, bucket = 'iskaHomes', folder = 'media') => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('developer_token') || localStorage.getItem('agent_token');
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', bucket);
    formData.append('subfolder', folder);

    // Upload file via API
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Upload failed' };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload multiple files using the API endpoint
 * @param {File[]} files - Array of files to upload
 * @param {string} bucket - The storage bucket name (default: 'iskaHomes')
 * @param {string} folder - The folder path within the bucket
 * @returns {Promise<{success: boolean, data?: object[], error?: string}>}
 */
export const uploadMultipleFilesToStorage = async (files, bucket = 'iskaHomes', folder = 'media') => {
  try {
    const uploadPromises = files.map(file => uploadFileToStorage(file, bucket, folder));
    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      console.warn('Some files failed to upload:', failedUploads);
    }
    
    return {
      success: successfulUploads.length > 0,
      data: successfulUploads.map(result => result.data),
      error: failedUploads.length > 0 ? `${failedUploads.length} files failed to upload` : null
    };
  } catch (error) {
    console.error('Error in uploadMultipleFilesToStorage:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a file using the API endpoint
 * @param {string} filePath - The path of the file to delete
 * @param {string} bucket - The storage bucket name (default: 'iskaHomes')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteFileFromStorage = async (filePath, bucket = 'iskaHomes') => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('developer_token') || localStorage.getItem('agent_token');
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    // Delete file via API
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Delete failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteFileFromStorage:', error);
    return { success: false, error: error.message };
  }
}
