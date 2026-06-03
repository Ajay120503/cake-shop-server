import { Router } from 'express';
import { body } from 'express-validator';
import * as addressCtrl from '../controllers/addressController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../utils/validators.js';

const router = Router();

router.use(protect);

router.get('/', addressCtrl.getMyAddresses);
router.get('/:id', addressCtrl.getAddress);
router.post(
  '/',
  [
    body('fullName').notEmpty(),
    body('phone').notEmpty().isLength({ min: 10 }),
    body('addressLine1').notEmpty(),
    body('city').notEmpty(),
    body('state').notEmpty(),
    body('postalCode').notEmpty(),
    validate,
  ],
  addressCtrl.createAddress,
);
router.put('/:id', addressCtrl.updateAddress);
router.delete('/:id', addressCtrl.deleteAddress);
router.put('/:id/default', addressCtrl.setDefaultAddress);

export default router;
