import { PDFDocument, PDFPage, rgb, StandardFonts, RotationTypes } from 'pdf-lib';
import QRCode from 'qrcode';
import { StampOptions } from '../lib/validation.js';

const FOOTER_OPACITY = parseFloat(process.env.FOOTER_OPACITY || '0.6');
const DIAGONAL_ANGLE = parseFloat(process.env.DIAGONAL_ANGLE || '35');

export async function stampPdf(
  pdfBytes: Uint8Array,
  opts: StampOptions
): Promise<Uint8Array> {
  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // Embed a standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Generate QR code
  const qrPayload = `license:${opts.licenseId};order:${opts.orderNumber};qty:${opts.licensedQuantity}`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 100,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  // Convert data URL to Uint8Array
  const qrImageBytes = Uint8Array.from(atob(qrDataUrl.split(',')[1]), c => c.charCodeAt(0));
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  
  // Generate footer text
  const orgText = opts.organization ? ` (${opts.organization})` : '';
  const footerText = `Licensed to: ${opts.customerName}${orgText}\nOrder ${opts.orderNumber} • License ${opts.licenseId} • Up to ${opts.licensedQuantity} copies • ${opts.dateISO}`;
  
  // Stamp each page
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    if (opts.footerPosition === 'bottom') {
      await stampBottomFooter(page, footerText, qrImage, font, width, height);
    } else {
      await stampDiagonalFooter(page, footerText, qrImage, font, width, height);
    }
  }
  
  // Save the modified PDF
  return await pdfDoc.save();
}

async function stampBottomFooter(
  page: PDFPage,
  footerText: string,
  qrImage: any,
  font: any,
  width: number,
  height: number
): Promise<void> {
  const fontSize = 9;
  const margin = 20;
  const lineHeight = fontSize * 1.2;
  
  // Draw footer line
  page.drawLine({
    start: { x: margin, y: margin + lineHeight + 5 },
    end: { x: width - margin, y: margin + lineHeight + 5 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
    opacity: FOOTER_OPACITY,
  });
  
  // Draw footer text
  const lines = footerText.split('\n');
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: margin,
      y: margin + (lines.length - 1 - index) * lineHeight,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
      opacity: FOOTER_OPACITY,
    });
  });
  
  // Draw QR code in bottom-right
  const qrSize = 60;
  page.drawImage(qrImage, {
    x: width - margin - qrSize,
    y: margin,
    width: qrSize,
    height: qrSize,
  });
}

async function stampDiagonalFooter(
  page: PDFPage,
  footerText: string,
  qrImage: any,
  font: any,
  width: number,
  height: number
): Promise<void> {
  const fontSize = 14;
  const centerX = width / 2;
  const centerY = height / 2;
  const angleRad = (DIAGONAL_ANGLE * Math.PI) / 180;
  
  // Draw diagonal text
  page.drawText(footerText, {
    x: centerX,
    y: centerY,
    size: fontSize,
    font,
    color: rgb(0.3, 0.3, 0.3),
    opacity: FOOTER_OPACITY * 0.7,
    rotate: { angle: angleRad, type: RotationTypes.Radians },
  });
  
  // Draw QR code in bottom-right
  const qrSize = 60;
  const margin = 20;
  page.drawImage(qrImage, {
    x: width - margin - qrSize,
    y: margin,
    width: qrSize,
    height: qrSize,
  });
} 