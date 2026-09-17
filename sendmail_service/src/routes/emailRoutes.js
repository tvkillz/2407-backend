const express = require('express');
const multer = require('multer');
const { sendEmail, healthCheck } = require('../controllers/emailController');

const router = express.Router();

// Configure multer for handling attachments
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
});

/**
 * @swagger
 * /api/email/send:
 *   post:
 *     summary: Send an email
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - subject
 *               - body
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Array of recipient email addresses
 *                 example: ["kontakt@2407.services"]
 *               replyTo:
 *                 type: string
 *                 format: email
 *                 description: Optional Reply-To address (e.g. the contact-form visitor)
 *                 example: "visitor@example.com"
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Array of CC email addresses
 *                 example: ["cc1@example.com", "cc2@example.com"]
 *               subject:
 *                 type: string
 *                 description: Email subject
 *                 example: "Important notification"
 *               body:
 *                 type: string
 *                 description: Email body (HTML supported)
 *                 example: "<h1>Hello</h1><p>This is an important message.</p>"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                       description: Name of the attachment file
 *                       example: "document.pdf"
 *                     content:
 *                       type: string
 *                       description: Base64 encoded file content
 *                       example: "JVBERi0xLjQKJcOkw7zDtsO..."
 *                     encoding:
 *                       type: string
 *                       description: Content encoding
 *                       example: "base64"
 *                 description: Array of file attachments
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email sent successfully"
 *                 messageId:
 *                   type: string
 *                   example: "<abc123@smtp.office365.com>"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Recipients array is required and must not be empty"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to send email"
 *                 error:
 *                   type: string
 *                   example: "SMTP connection failed"
 */
router.post('/send', upload.array('files'), sendEmail);

/**
 * @swagger
 * /api/email/health:
 *   get:
 *     summary: Check email service health
 *     tags: [Email]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email service is healthy"
 *                 graph:
 *                   type: object
 *                   properties:
 *                     sender:
 *                       type: string
 *                       example: "kontakt@2407.services"
 *       500:
 *         description: Service is not healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email service is not healthy"
 *                 error:
 *                   type: string
 *                   example: "SMTP connection failed"
 */
router.get('/health', healthCheck);

module.exports = router;
