import { Router } from 'express';
import {
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate,
} from '../controllers/recurringController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
