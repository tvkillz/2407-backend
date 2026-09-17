const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const fileController = require('../controllers/file-controller');

router.post('/upload/:folder?', upload.single('file'), fileController.uploadFile);
router.get('/files/:folder/:filename', fileController.getFile);
router.delete('/files/:folder/:filename', fileController.deleteFile);
router.post('/create-folder/:folder', fileController.createFolder);

module.exports = router;
