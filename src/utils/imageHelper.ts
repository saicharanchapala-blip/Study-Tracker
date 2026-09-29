/**
 * Utility for processing and optimizing user avatar images from device files
 * Supports drag-and-drop and standard file input selection
 */
export function processAvatarImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file (JPEG, PNG, WEBP, GIF).'));
      return;
    }

    // Reject files larger than 15MB before processing
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Image file is too large. Please select a photo under 15MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file from your device.'));
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode the selected image file.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Center-crop to a clean square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);

          // Convert to compact high-quality JPEG data URL for local storage
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(optimizedDataUrl);
        } catch (err) {
          // Fallback to raw base64 if canvas operation fails
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
