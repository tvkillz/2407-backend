import { Router } from 'express';
import { upload } from '../../../config/upload';
import { ContactController } from '../controllers/contact.controller';
import { requireAdminKey } from '../../../middleware/admin-key';

const router = Router();

router.post('/', upload.array('files', 10), ContactController.create);
router.get('/', requireAdminKey, ContactController.list);
router.get('/:id', requireAdminKey, ContactController.getById);
router.get('/:id/files/:filename', requireAdminKey, ContactController.getFile);

export default router;
