const multer = require('multer');

/** Rejected uploads are a client error (400), not a server failure. */
const badFile = (message) => Object.assign(new Error(message), { statusCode: 400 });

// Configure Memory Storage for Buffer Processing
const storage = multer.memoryStorage();

// Resume File Filter (PDF only, max 10MB)
const resumeFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(badFile('Invalid file type. Only PDF documents (.pdf) are allowed for resumes.'), false);
  }
};

// Student Document File Filter (PDF, Images, DOCX, max 10MB)
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|jpg|jpeg|png|webp|docx|doc)$/i)) {
    cb(null, true);
  } else {
    cb(badFile('Invalid document format. Allowed: PDF, JPG, PNG, WEBP, DOCX.'), false);
  }
};

// Company Logo File Filter (Images only, max 5MB)
const logoFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.originalname.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
    cb(null, true);
  } else {
    cb(badFile('Invalid logo file format. Allowed: JPG, PNG, WEBP, SVG.'), false);
  }
};

// PDF File Filter (max 10MB)
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(badFile('Invalid file format. Only PDF documents (.pdf) are allowed.'), false);
  }
};

// Chat Attachment File Filter (Images, PDF, DOCX, XLSX, ZIP, max 10MB)
const chatFileFilter = (req, file, cb) => {
  if (file.originalname.match(/\.(jpg|jpeg|png|webp|gif|pdf|docx|doc|xlsx|xls|zip|rar)$/i)) {
    cb(null, true);
  } else {
    cb(badFile('Invalid chat attachment file format. Allowed: Images, PDF, DOCX, XLSX, ZIP.'), false);
  }
};

const uploadResume = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: resumeFileFilter,
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFileFilter,
});

const uploadCompanyLogo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: logoFileFilter,
});

const uploadCompanyDoc = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFileFilter,
});

const uploadOfferLetter = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: pdfFileFilter,
});

const uploadTrainingMaterial = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFileFilter,
});

const uploadCertificate = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: pdfFileFilter,
});

const uploadChatAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: chatFileFilter,
});

const uploadDriveJd = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: pdfFileFilter,
});

module.exports = {
  uploadDriveJd,
  uploadResume,
  uploadDocument,
  uploadCompanyLogo,
  uploadCompanyDoc,
  uploadOfferLetter,
  uploadTrainingMaterial,
  uploadCertificate,
  uploadChatAttachment,
};
