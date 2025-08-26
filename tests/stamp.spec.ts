import { describe, it, expect, beforeAll } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { stampPdf } from '../src/pdf/stamp.js';

describe('PDF Stamping', () => {
  let samplePdfBytes: Uint8Array;

  beforeAll(async () => {
    // Create a simple 1-page PDF for testing
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText('Test PDF Document', {
      x: 50,
      y: 750,
      size: 24,
      font,
    });
    
    page.drawText('This is a sample PDF for testing the stamping functionality.', {
      x: 50,
      y: 700,
      size: 12,
      font,
    });
    
    samplePdfBytes = await pdfDoc.save();
  });

  it('should stamp a PDF and return a valid PDF with increased size', async () => {
    const options = {
      customerName: 'Jane Smith',
      orderNumber: 'CAIL-1234',
      licensedQuantity: 35,
      organization: 'Limerick Cathedral Choir',
      licenseId: 'test-license-123',
      dateISO: '2024-01-15',
      footerPosition: 'bottom' as const,
    };

    const stampedPdfBytes = await stampPdf(samplePdfBytes, options);

    // Verify it's a valid PDF
    expect(stampedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(stampedPdfBytes.length).toBeGreaterThan(0);
    
    // Verify the stamped PDF is larger than the original (due to added content)
    expect(stampedPdfBytes.length).toBeGreaterThan(samplePdfBytes.length);
    
    // Verify it starts with PDF magic number
    const header = new TextDecoder().decode(stampedPdfBytes.slice(0, 4));
    expect(header).toBe('%PDF');
  });

  it('should generate a license ID if not provided', async () => {
    const options = {
      customerName: 'John Doe',
      orderNumber: 'ORDER-5678',
      licensedQuantity: 10,
      licenseId: '', // Empty string to test generation
      dateISO: '2024-01-15',
      footerPosition: 'bottom' as const,
    };

    const stampedPdfBytes = await stampPdf(samplePdfBytes, options);
    
    expect(stampedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(stampedPdfBytes.length).toBeGreaterThan(samplePdfBytes.length);
  });

  it('should handle diagonal footer positioning', async () => {
    const bottomOptions = {
      customerName: 'Test User',
      orderNumber: 'TEST-001',
      licensedQuantity: 5,
      licenseId: 'test-license-diagonal',
      dateISO: '2024-01-15',
      footerPosition: 'bottom' as const,
    };

    const diagonalOptions = {
      ...bottomOptions,
      footerPosition: 'diagonal' as const,
    };

    const bottomStamped = await stampPdf(samplePdfBytes, bottomOptions);
    const diagonalStamped = await stampPdf(samplePdfBytes, diagonalOptions);

    // Both should be valid PDFs
    expect(bottomStamped).toBeInstanceOf(Uint8Array);
    expect(diagonalStamped).toBeInstanceOf(Uint8Array);
    
    // They should have different sizes due to different positioning
    expect(bottomStamped.length).not.toBe(diagonalStamped.length);
  });

  it('should handle optional organization field', async () => {
    const optionsWithoutOrg = {
      customerName: 'Alice Johnson',
      orderNumber: 'ORDER-999',
      licensedQuantity: 20,
      licenseId: 'test-license-no-org',
      dateISO: '2024-01-15',
      footerPosition: 'bottom' as const,
    };

    const optionsWithOrg = {
      ...optionsWithoutOrg,
      organization: 'Test Organization',
    };

    const stampedWithoutOrg = await stampPdf(samplePdfBytes, optionsWithoutOrg);
    const stampedWithOrg = await stampPdf(samplePdfBytes, optionsWithOrg);

    expect(stampedWithoutOrg).toBeInstanceOf(Uint8Array);
    expect(stampedWithOrg).toBeInstanceOf(Uint8Array);
    
    // PDF with organization should be slightly larger
    expect(stampedWithOrg.length).toBeGreaterThan(stampedWithoutOrg.length);
  });

  it('should handle large licensed quantities', async () => {
    const options = {
      customerName: 'Enterprise Customer',
      orderNumber: 'ENT-2024',
      licensedQuantity: 10000,
      licenseId: 'enterprise-license',
      dateISO: '2024-01-15',
      footerPosition: 'bottom' as const,
    };

    const stampedPdfBytes = await stampPdf(samplePdfBytes, options);
    
    expect(stampedPdfBytes).toBeInstanceOf(Uint8Array);
    expect(stampedPdfBytes.length).toBeGreaterThan(samplePdfBytes.length);
  });
}); 