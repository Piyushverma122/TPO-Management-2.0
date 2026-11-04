const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const { uploadOfferLetter } = require('../config/multer');
const { compressUpload } = require('../middlewares/compressUpload');
const {
  validateListQuery,
  validateOfferId,
  validateCreateOffer,
  validateReview,
  validateRespond,
} = require('../validators/offerValidator');

// All routes require authentication
router.use(verifyToken);

router.get('/', authorizeModule(Module.OFFER_LETTERS, Action.VIEW), validateListQuery, offerController.listOffers);
router.get('/summary', authorizeModule(Module.OFFER_LETTERS, Action.VIEW), offerController.getSummary);
router.get('/:id', authorizeModule(Module.OFFER_LETTERS, Action.VIEW), validateOfferId, offerController.getOffer);
router.get('/:id/file', authorizeModule(Module.OFFER_LETTERS, Action.VIEW), validateOfferId, offerController.getOfferFile);

router.post(
  '/',
  authorizeModule(Module.OFFER_LETTERS, Action.UPLOAD),
  uploadOfferLetter.single('offer_letter'), compressUpload(),
  validateCreateOffer,
  offerController.createOffer
);
router.patch('/:id/review', authorizeModule(Module.OFFER_LETTERS, Action.APPROVE), validateReview, offerController.reviewOffer);
router.patch('/:id/respond', authorizeModule(Module.OFFER_LETTERS, Action.RESPOND), validateRespond, offerController.respondToOffer);

module.exports = router;
