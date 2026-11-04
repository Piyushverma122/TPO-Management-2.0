const offerService = require('../services/offerService');
const { sendSuccess, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    List offers (students: own released offers, recruiters: own company, admin/TPO: all)
 * @route   GET /api/v1/offers
 */
const listOffers = async (req, res, next) => {
  try {
    const result = await offerService.listOffers(req.user, req.query);
    return sendPaginated(res, 'Offers retrieved', result.offers, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/offers/:id
 */
const getOffer = async (req, res, next) => {
  try {
    const offer = await offerService.getOfferById(req.user, req.params.id);
    return sendSuccess(res, 'Offer details retrieved', { offer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Short-lived signed link to the offer letter PDF
 * @route   GET /api/v1/offers/:id/file
 */
const getOfferFile = async (req, res, next) => {
  try {
    const file = await offerService.getOfferFile(req.user, req.params.id);
    return sendSuccess(res, 'Offer letter link generated', file);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload an offer letter for a selected candidate (recruiters need TPO approval, TPO/admin release directly)
 * @route   POST /api/v1/offers
 */
const createOffer = async (req, res, next) => {
  try {
    const offer = await offerService.createOffer(req.user, req.body, req.file);
    return sendSuccess(res, offer.offer_status === 'Released' ? 'Offer released to the candidate' : 'Offer submitted for TPO approval', { offer }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/offers/:id/review
 */
const reviewOffer = async (req, res, next) => {
  try {
    const offer = await offerService.reviewOffer(req.user, req.params.id, req.body);
    return sendSuccess(res, req.body.action === 'approve' ? 'Offer approved and released' : 'Offer rejected', { offer });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/offers/:id/respond
 */
const respondToOffer = async (req, res, next) => {
  try {
    const offer = await offerService.respondToOffer(req.user, req.params.id, req.body);
    return sendSuccess(res, req.body.decision === 'accept' ? 'Offer accepted' : 'Offer declined', { offer });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await offerService.getSummary(req.user);
    return sendSuccess(res, 'Offer summary retrieved', { summary });
  } catch (error) {
    next(error);
  }
};

module.exports = { listOffers, getSummary, getOffer, getOfferFile, createOffer, reviewOffer, respondToOffer };
