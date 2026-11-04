const db = require('../config/supabase');
const { Role, normalizeRole } = require('../config/rbac');
const dataScopeService = require('./dataScopeService');
const applicationService = require('./applicationService');
const emailService = require('./emailService');
const storage = require('./storageService');
const logger = require('../utils/logger');

/**
 * Offer lifecycle, stored on `placements` (the table already holds the offer file columns):
 *   Pending Approval -> Released -> Accepted | Declined | Expired      (or Pending Approval -> Rejected)
 * Only `Accepted` rows count as placements in statistics.
 */
const R2_BUCKET_TAG = 'r2'; // placements.bucket_name for files that live in Cloudflare R2
const LEGACY_SUPABASE_BUCKET = 'offer-letters';
const STUDENT_VISIBLE = ['Released', 'Accepted', 'Declined', 'Expired'];

const OFFER_SELECT = `
  *,
  students ( id, roll_number, user_id, users ( id, full_name, email ) ),
  companies ( id, name, logo_url ),
  placement_drives ( id, drive_code, role_title, ctc, location, job_type )
`;

const httpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const dbError = (error) => httpError(error.message, 500);
const isStaff = (user) => [Role.ADMIN, Role.TPO].includes(normalizeRole(user.role));

// ---------------------------------------------------------------- helpers

const expireStaleOffers = async () => {
  const { error } = await db
    .from('placements')
    .update({ offer_status: 'Expired', updated_at: new Date().toISOString() })
    .eq('offer_status', 'Released')
    .lt('response_deadline', new Date().toISOString());
  if (error) logger.warn(`Offer expiry sweep failed: ${error.message}`);
};

const fetchOffer = async (id) => {
  const { data, error } = await db.from('placements').select(OFFER_SELECT).eq('id', id).maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw httpError('Offer not found.', 404);
  return data;
};

const assertCanView = async (user, offer) => {
  if (isStaff(user)) return;

  const role = normalizeRole(user.role);
  const ctx = await dataScopeService.resolveScopeContext(user);
  const allowed =
    (role === Role.STUDENT && ctx.studentId === offer.student_id && STUDENT_VISIBLE.includes(offer.offer_status)) ||
    (role === Role.RECRUITER && ctx.companyId && ctx.companyId === offer.company_id);

  if (!allowed) {
    await dataScopeService.logOwnershipViolation(user, 'offers', offer.id, 'VIEW', 'Offer does not belong to this user');
    throw httpError('Offer not found.', 404);
  }
};

const notify = async (userIds, title, message) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  const { error } = await db
    .from('notifications')
    .insert(ids.map((user_id) => ({ user_id, title, message, type: 'Offer Update', is_read: false })));
  if (error) logger.warn(`Offer notification failed: ${error.message}`);
};

const staffUserIds = async () => {
  const { data } = await db.from('users').select('id').in('role', ['admin', 'tpo']).eq('is_active', true).is('deleted_at', null);
  return (data || []).map((u) => u.id);
};

const companyRecruiterUserIds = async (companyId) => {
  const { data } = await db.from('recruiters').select('user_id').eq('company_id', companyId).is('deleted_at', null);
  return (data || []).map((r) => r.user_id);
};

const emailStudent = async (offer, title, message) => {
  const candidate = offer.students?.users;
  if (!candidate?.email) return;
  await emailService.sendOfferEmail({
    to: candidate.email,
    name: candidate.full_name,
    title,
    company: offer.companies?.name || 'the company',
    role: offer.role_title || offer.placement_drives?.role_title || 'the role',
    message,
  });
};

const describe = (offer) =>
  `${offer.role_title || offer.placement_drives?.role_title || 'role'} at ${offer.companies?.name || 'the company'}`;

const getApplicationContext = async (applicationId) => {
  const { data: app, error } = await db
    .from('drive_applications')
    .select(
      `id, status, drive_id, student_id,
       placement_drives ( id, company_id, role_title, ctc, companies ( id, name ) ),
       students ( id, user_id )`
    )
    .eq('id', applicationId)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!app) throw httpError('Application record not found.', 404);
  return app;
};

// ---------------------------------------------------------------- queries

const listOffers = async (user, queryParams) => {
  await expireStaleOffers();

  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { status, company_id } = queryParams;

  let query = db.from('placements').select(OFFER_SELECT, { count: 'exact' });

  const scopeContext = await dataScopeService.resolveScopeContext(user);
  query = dataScopeService.applyDataScope(query, user, 'placements', scopeContext);

  if (normalizeRole(user.role) === Role.STUDENT) query = query.in('offer_status', STUDENT_VISIBLE);
  if (status) query = query.eq('offer_status', status);
  if (company_id) query = query.eq('company_id', company_id);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw dbError(error);

  return { offers: data || [], page, limit, total: count || 0 };
};

/** Counts per status for the summary tiles (same role scope as the list). */
const getSummary = async (user) => {
  await expireStaleOffers();
  const scopeContext = await dataScopeService.resolveScopeContext(user);
  const isStudent = normalizeRole(user.role) === Role.STUDENT;

  const count = async (statuses) => {
    let query = db.from('placements').select('id', { count: 'exact', head: true });
    query = dataScopeService.applyDataScope(query, user, 'placements', scopeContext);
    if (isStudent) query = query.in('offer_status', STUDENT_VISIBLE);
    query = query.in('offer_status', statuses);
    const { count: total, error } = await query;
    if (error) throw dbError(error);
    return total || 0;
  };

  const [pending, released, accepted, closed] = await Promise.all([
    count(['Pending Approval']),
    count(['Released']),
    count(['Accepted']),
    count(['Declined', 'Rejected', 'Expired']),
  ]);
  return { pending, released, accepted, closed };
};

const getOfferById = async (user, id) => {
  await expireStaleOffers();
  const offer = await fetchOffer(id);
  await assertCanView(user, offer);
  return offer;
};

/** Offers sit in a private bucket; hand out a short-lived signed link instead of a public URL. */
const getOfferFile = async (user, id) => {
  const offer = await getOfferById(user, id);
  if (!offer.storage_path) throw httpError('No offer letter file is attached to this offer.', 404);

  if (offer.bucket_name === R2_BUCKET_TAG) {
    const url = await storage.getDownloadUrl(offer.storage_path, { fileName: offer.file_name, contentType: offer.mime_type || undefined });
    return { url, file_name: offer.file_name, expires_in: storage.SIGNED_URL_TTL_SECONDS };
  }

  // Offers uploaded before the move to R2 still sit in the old Supabase bucket.
  const { data, error } = await db.storage
    .from(offer.bucket_name || LEGACY_SUPABASE_BUCKET)
    .createSignedUrl(offer.storage_path, storage.SIGNED_URL_TTL_SECONDS);
  if (!error && data?.signedUrl) return { url: data.signedUrl, file_name: offer.file_name, expires_in: storage.SIGNED_URL_TTL_SECONDS };

  // Rows created before the file moved to storage only carry a plain link.
  if (/^https?:\/\//i.test(offer.offer_letter_url || '')) return { url: offer.offer_letter_url, file_name: offer.file_name, expires_in: null };

  throw httpError('This offer letter file is not available. Ask the TPO to upload it again.', 404);
};

/** Offers made before applications were linked have no application_id; find it from drive + student. */
const resolveApplicationId = async (offer) => {
  if (offer.application_id) return offer.application_id;
  const { data } = await db.from('drive_applications').select('id').eq('drive_id', offer.drive_id).eq('student_id', offer.student_id).maybeSingle();
  return data?.id || null;
};

/** Moves the application to a new stage when the offer is linked to one (older offers may not be). */
const syncApplication = async (offer, stage, round, remarks, userId) => {
  const applicationId = await resolveApplicationId(offer);
  if (!applicationId) return;
  await applicationService.updateApplicationStatus(applicationId, stage, round, remarks, userId);
};

// ---------------------------------------------------------------- commands

const createOffer = async (user, payload, file) => {
  storage.ensureConfigured(); // fail with a clear 503 before doing any other work
  if (!file) throw httpError('Please attach the offer letter as a PDF.', 400);
  if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw httpError('The uploaded file is not a valid PDF.', 400);

  const { application_id, package: ctcPackage, joining_date, response_deadline, role_title } = payload;

  const app = await getApplicationContext(application_id);
  const drive = app.placement_drives;
  await dataScopeService.assertCanManageCompany(user, drive.company_id);

  if (app.status !== 'Selected') {
    throw httpError(`An offer can only be issued to a selected candidate (current stage: ${app.status}).`, 400);
  }

  const { data: existing } = await db
    .from('placements')
    .select('id, offer_status')
    .eq('drive_id', app.drive_id)
    .eq('student_id', app.student_id)
    .maybeSingle();
  if (existing) throw httpError(`This candidate already has an offer for this drive (${existing.offer_status}).`, 409);

  const storagePath = storage.buildKey('offer-letters', app.drive_id, app.student_id, 'pdf');
  await storage.putObject({ key: storagePath, body: file.buffer, contentType: 'application/pdf' });

  const released = isStaff(user);
  const { data: created, error } = await db
    .from('placements')
    .insert([
      {
        student_id: app.student_id,
        company_id: drive.company_id,
        drive_id: app.drive_id,
        application_id,
        role_title: role_title || drive.role_title,
        package: ctcPackage,
        joining_date: joining_date || null,
        response_deadline: response_deadline || null,
        offer_status: released ? 'Released' : 'Pending Approval',
        reviewed_by: released ? user.id : null,
        reviewed_at: released ? new Date().toISOString() : null,
        bucket_name: R2_BUCKET_TAG,
        storage_path: storagePath,
        file_name: file.originalname,
        mime_type: 'application/pdf',
        file_size: file.size,
      },
    ])
    .select('id')
    .single();

  if (error) {
    await storage.removeObject(storagePath);
    throw dbError(error);
  }

  const offer = await fetchOffer(created.id);

  if (released) {
    await applicationService.updateApplicationStatus(application_id, 'Offer', 'Offer Letter Released', 'Offer letter released to the candidate', user.id);
    await notify([offer.students?.user_id], 'You have a new offer', `You received an offer for ${describe(offer)}. Open Offer Letters to review and respond.`);
    await emailStudent(offer, 'You have a new offer', `You received an offer for ${describe(offer)}. Log in to the TPO portal to review and respond.`);
  } else {
    await notify(await staffUserIds(), 'Offer awaiting approval', `${offer.companies?.name || 'A company'} uploaded an offer for ${offer.students?.users?.full_name || 'a candidate'} (${describe(offer)}).`);
  }

  return offer;
};

const reviewOffer = async (user, id, { action, remarks }) => {
  const offer = await fetchOffer(id);
  if (offer.offer_status !== 'Pending Approval') {
    throw httpError(`Only offers pending approval can be reviewed (current status: ${offer.offer_status}).`, 400);
  }

  const approve = action === 'approve';
  const { error } = await db
    .from('placements')
    .update({
      offer_status: approve ? 'Released' : 'Rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_remarks: remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw dbError(error);

  const recruiters = await companyRecruiterUserIds(offer.company_id);
  if (approve) {
    await syncApplication(offer, 'Offer', 'Offer Letter Released', remarks || 'Offer approved and released', user.id);
    await notify([offer.students?.user_id], 'You have a new offer', `You received an offer for ${describe(offer)}. Open Offer Letters to review and respond.`);
    await emailStudent(offer, 'You have a new offer', `You received an offer for ${describe(offer)}. Log in to the TPO portal to review and respond.`);
    await notify(recruiters, 'Offer approved', `Your offer for ${offer.students?.users?.full_name || 'the candidate'} was approved and sent.`);
  } else {
    await notify(recruiters, 'Offer rejected', `The offer for ${offer.students?.users?.full_name || 'the candidate'} was rejected by the TPO. Reason: ${remarks}`);
  }

  return fetchOffer(id);
};

const respondToOffer = async (user, id, { decision, reason }) => {
  if (normalizeRole(user.role) !== Role.STUDENT) throw httpError('Only the candidate can respond to an offer.', 403);

  await expireStaleOffers();
  const offer = await fetchOffer(id);
  await assertCanView(user, offer);

  if (offer.offer_status === 'Expired') throw httpError('The response deadline for this offer has passed.', 400);
  if (offer.offer_status !== 'Released') throw httpError(`This offer can no longer be answered (status: ${offer.offer_status}).`, 400);

  const accept = decision === 'accept';
  const { error } = await db
    .from('placements')
    .update({
      offer_status: accept ? 'Accepted' : 'Declined',
      responded_at: new Date().toISOString(),
      decline_reason: accept ? null : reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('offer_status', 'Released'); // guards against a double click answering twice
  if (error) throw dbError(error);

  if (accept) {
    await db.from('students').update({ placement_status: 'Placed' }).eq('id', offer.student_id);
    const { count } = await db
      .from('placements')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', offer.company_id)
      .eq('offer_status', 'Accepted');
    await db.from('companies').update({ hired_count: count || 1 }).eq('id', offer.company_id);
    await syncApplication(offer, 'Selected', 'Offer Accepted', 'Candidate accepted the offer', user.id);
  } else {
    await syncApplication(offer, 'Offer Declined', 'Offer Declined', reason || 'Candidate declined the offer', user.id);
  }

  const name = offer.students?.users?.full_name || 'The candidate';
  const recipients = [...(await staffUserIds()), ...(await companyRecruiterUserIds(offer.company_id))];
  await notify(recipients, accept ? 'Offer accepted' : 'Offer declined', `${name} ${accept ? 'accepted' : 'declined'} the offer for ${describe(offer)}.${!accept && reason ? ` Reason: ${reason}` : ''}`);
  await notify([offer.students?.user_id], accept ? 'Congratulations!' : 'Offer declined', accept ? `You accepted the offer for ${describe(offer)}.` : `You declined the offer for ${describe(offer)}.`);

  return fetchOffer(id);
};

module.exports = {
  listOffers,
  getSummary,
  getOfferById,
  getOfferFile,
  createOffer,
  reviewOffer,
  respondToOffer,
};
