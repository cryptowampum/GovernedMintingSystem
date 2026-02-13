// Image compression utility - converts to JPEG and compresses to max size
// Extracted from SuperFantasticMinter pattern
export const compressImage = (file, maxSizeMB = 2, maxWidthOrHeight = 2048) => {
  return new Promise((resolve, reject) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const findOptimalQuality = (minQuality, maxQuality, iterations = 0) => {
        if (iterations > 10) {
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', minQuality);
          return;
        }
        const midQuality = (minQuality + maxQuality) / 2;
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Failed to compress image')); return; }
            if (blob.size <= maxSizeBytes) {
              if (maxQuality - midQuality < 0.02) resolve(blob);
              else findOptimalQuality(midQuality, maxQuality, iterations + 1);
            } else {
              findOptimalQuality(minQuality, midQuality, iterations + 1);
            }
          },
          'image/jpeg',
          midQuality
        );
      };

      findOptimalQuality(0.1, 0.92);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
