import { Router } from 'express';
import { ContactController } from '../../contact/controllers/contact.controller';
import { authenticate } from '../../../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/', ContactController.list);
router.get('/:id', ContactController.getById);
router.put('/:id', ContactController.update);
router.patch('/:id', ContactController.update);
router.delete('/:id', ContactController.remove);
router.get('/:id/files/:filename', ContactController.getFile);

export default router;
