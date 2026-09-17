import { Router } from 'express';
import { upload } from '../../../config/upload';
import { FilesController } from '../controllers/files.controller';
import { requireAdminKey } from '../../../middleware/admin-key';

const router = Router();

router.post('/:folder', requireAdminKey, upload.single('file'), FilesController.upload);
router.get('/:folder/:filename', requireAdminKey, FilesController.get);
router.delete('/:folder/:filename', requireAdminKey, FilesController.remove);

export default router;
