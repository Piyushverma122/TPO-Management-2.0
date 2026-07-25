const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validateUpdateRecruiter } = require('../validators/companyValidator');

router.use(verifyToken);

router.put('/:id', validateUpdateRecruiter, companyController.updateRecruiter);
router.delete('/:id', authorizeRoles('admin', 'tpo'), companyController.deleteRecruiter);

module.exports = router;
