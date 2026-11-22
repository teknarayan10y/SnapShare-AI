import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

class QRService {
  /**
   * Generates a Data URL (PNG base64) for the QR code with custom colors and margin
   */
  async generateDataURL(text, options = {}) {
    const {
      dotsColor = '#8B5CF6',
      bgColor = '#080B14',
      margin = 2,
      width = 512,
    } = options;

    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: dotsColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H', // High error correction to allow center logo placement
    });
  }

  /**
   * Generates SVG string for the QR code
   */
  async generateSVG(text, options = {}) {
    const {
      dotsColor = '#8B5CF6',
      bgColor = '#080B14',
      margin = 2,
      width = 512,
    } = options;

    return await QRCode.toString(text, {
      type: 'svg',
      width,
      margin,
      color: {
        dark: dotsColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H',
    });
  }

  /**
   * Generates a PNG Buffer
   */
  async generateBuffer(text, options = {}) {
    const {
      dotsColor = '#8B5CF6',
      bgColor = '#080B14',
      margin = 2,
      width = 600,
    } = options;

    return await QRCode.toBuffer(text, {
      width,
      margin,
      color: {
        dark: dotsColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H',
    });
  }

  /**
   * Generates a beautiful printable PDF card containing the QR code,
   * collection title, description, and scan instructions.
   */
  async generatePrintablePDF(collection, qrUrl, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate QR code buffer (using dark QR on white for reliable printing)
        const qrBuffer = await QRCode.toBuffer(qrUrl, {
          width: 280,
          margin: 2,
          color: {
            dark: '#111827',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });

        // Background card outline
        doc.rect(40, 40, 515, 762).lineWidth(2).strokeColor('#8B5CF6').stroke();

        // Header branding
        doc.fillColor('#8B5CF6').fontSize(26).font('Helvetica-Bold').text('SnapShare', 50, 70, { align: 'center' });
        doc.fillColor('#6B7280').fontSize(12).font('Helvetica').text('Share Everything. Scan Once.', 50, 105, { align: 'center' });

        // Divider
        doc.moveTo(100, 130).lineTo(495, 130).strokeColor('#E5E7EB').lineWidth(1).stroke();

        // Collection Title
        doc.fillColor('#111827').fontSize(22).font('Helvetica-Bold').text(collection.title, 60, 160, {
          align: 'center',
          width: 475,
        });

        // Collection Description
        if (collection.description) {
          doc.fillColor('#4B5563').fontSize(12).font('Helvetica').text(collection.description, 60, 200, {
            align: 'center',
            width: 475,
          });
        }

        // Center QR Code Image
        const qrY = collection.description ? 270 : 230;
        doc.image(qrBuffer, (595 - 280) / 2, qrY, { width: 280 });

        // Instructions
        const instructionsY = qrY + 300;
        doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('How to access these files:', 60, instructionsY, {
          align: 'center',
          width: 475,
        });

        doc.fillColor('#6B7280').fontSize(11).font('Helvetica').text(
          '1. Open the Camera app on your smartphone or any QR scanner.\n2. Point your camera at the QR code above.\n3. Tap the link to view, preview, and download individual files or download all in a ZIP archive.',
          80,
          instructionsY + 25,
          { width: 435, lineGap: 4 }
        );

        // Share link URL
        doc.fillColor('#8B5CF6').fontSize(10).font('Helvetica').text(qrUrl, 60, instructionsY + 110, {
          align: 'center',
          link: qrUrl,
          underline: true,
        });

        // Footer
        doc.fillColor('#9CA3AF').fontSize(9).font('Helvetica').text('Generated securely with SnapShare • Universal QR File Sharing Platform', 50, 770, {
          align: 'center',
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const qrService = new QRService();
