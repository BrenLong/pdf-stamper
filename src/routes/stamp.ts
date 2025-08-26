import { Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { stampRequestSchema, stampOptionsSchema } from '../lib/validation.js';
import { stampPdf } from '../pdf/stamp.js';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export const stampHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate file upload
    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required' });
      return;
    }

    // Validate request body
    console.log('Request body:', req.body);
    const validationResult = stampRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      });
      return;
    }

    const data = validationResult.data;

    // Generate license ID if not provided
    const licenseId = data.license_id || randomUUID();

    // Set default date to today if not provided
    const dateISO = data.date || new Date().toISOString().split('T')[0];

    // Transform to internal options format
    const stampOptions = stampOptionsSchema.parse({
      customerName: data.customer_name,
      orderNumber: data.order_number,
      licensedQuantity: data.licensed_quantity,
      organization: data.organization,
      licenseId,
      dateISO,
      footerPosition: data.footer_position,
    });

    // Stamp the PDF
    const stampedPdfBytes = await stampPdf(req.file.buffer, stampOptions);

    // Return the stamped PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stamped.pdf"');
    res.setHeader('Content-Length', stampedPdfBytes.length);
    res.send(Buffer.from(stampedPdfBytes));

  } catch (error) {
    console.error('Error processing stamp request:', error);
    
    if (error instanceof Error && error.message === 'Only PDF files are allowed') {
      res.status(400).json({ error: 'Only PDF files are allowed' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export the multer middleware for use in the route
export const uploadMiddleware = upload.single('file'); 