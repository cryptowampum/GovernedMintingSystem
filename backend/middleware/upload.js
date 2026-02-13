const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      const error = new Error(`Invalid file type "${file.mimetype}". Only JPEG, PNG, GIF, and WebP are allowed.`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error);
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext)) {
      const error = new Error(`Invalid file extension "${ext}".`);
      error.code = 'INVALID_FILE_EXTENSION';
      return cb(error);
    }

    cb(null, true);
  },
});

module.exports = { upload };
