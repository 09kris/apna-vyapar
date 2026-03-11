import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import Shop from '../models/Shop';
import Product from '../models/Product';
import ShopOrder from '../models/ShopOrder';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  hsnCode?: string;
  sgstRate?: number;
  cgstRate?: number;
  igstRate?: number;
}

interface InvoiceData {
  orderId: string;
  orderDate: Date;
  invoiceNumber: string;
  shop: {
    shopName: string;
    gstNumber?: string;
    panNumber?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email?: string;
  };
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  sgst?: number;
  cgst?: number;
  igst?: number;
  total: number;
}

interface GSTBreakdown {
  hsnCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sgstRate: number;
  sgstAmount: number;
  cgstRate: number;
  cgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

class InvoiceService {
  /**
   * Generate an invoice PDF as a readable stream
   */
  static generateInvoicePDF(invoiceData: InvoiceData): Readable {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    // Invoice details
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`);
    doc.text(`Order ID: ${invoiceData.orderId}`);
    doc.text(`Invoice Date: ${this.formatDate(invoiceData.orderDate)}`);
    doc.moveDown();

    // Shop details
    doc.font('Helvetica-Bold').fontSize(11).text('SELLER INFORMATION:');
    doc.font('Helvetica').fontSize(10);
    doc.text(invoiceData.shop.shopName);
    doc.text(`GSTIN: ${invoiceData.shop.gstNumber || 'N/A'}`);
    doc.text(`PAN: ${invoiceData.shop.panNumber || 'N/A'}`);
    doc.text(invoiceData.shop.address);
    doc.text(`${invoiceData.shop.city}, ${invoiceData.shop.state} ${invoiceData.shop.pincode}`);
    doc.text(`Phone: ${invoiceData.shop.phone}`);
    if (invoiceData.shop.email) {
      doc.text(`Email: ${invoiceData.shop.email}`);
    }
    doc.moveDown();

    // Customer details
    doc.font('Helvetica-Bold').fontSize(11).text('BILLING ADDRESS:');
    doc.font('Helvetica').fontSize(10);
    doc.text(invoiceData.customer.name);
    doc.text(`Phone: ${invoiceData.customer.phone}`);
    if (invoiceData.customer.email) {
      doc.text(`Email: ${invoiceData.customer.email}`);
    }
    if (invoiceData.customer.address) {
      doc.text(invoiceData.customer.address);
      doc.text(
        `${invoiceData.customer.city || ''}, ${invoiceData.customer.state || ''} ${
          invoiceData.customer.pincode || ''
        }`
      );
    }
    doc.moveDown();

    // Items table
    this.drawItemsTable(doc, invoiceData.items);

    // Tax breakdown
    doc.moveDown();
    this.drawTaxSummary(doc, invoiceData);

    // Total
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total Amount: ₹${invoiceData.total.toFixed(2)}`, {
      align: 'right',
      underline: true,
    });

    doc.moveDown(2);

    // Terms
    doc.fontSize(9).font('Helvetica');
    doc.text('Terms & Conditions:', { underline: true });
    doc.text('1. Payment terms as per invoice', { align: 'left' });
    doc.text('2. Goods sold are not returnable after 7 days', { align: 'left' });
    doc.text('3. This is a computer generated invoice', { align: 'left' });

    doc.end();

    return doc as unknown as Readable;
  }

  /**
   * Calculate GST breakdown for order items
   */
  static calculateGSTBreakup(items: OrderItem[]): GSTBreakdown[] {
    const breakdown: GSTBreakdown[] = [];

    for (const item of items) {
      const amount = item.quantity * item.unitPrice - (item.discount || 0);

      const sgstRate = item.sgstRate || 0;
      const cgstRate = item.cgstRate || 0;
      const igstRate = item.igstRate || 0;

      const sgstAmount = (amount * sgstRate) / 100;
      const cgstAmount = (amount * cgstRate) / 100;
      const igstAmount = (amount * igstRate) / 100;

      breakdown.push({
        hsnCode: item.hsnCode || 'N/A',
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
        sgstRate,
        sgstAmount,
        cgstRate,
        cgstAmount,
        igstRate,
        igstAmount,
        totalTax: sgstAmount + cgstAmount + igstAmount,
      });
    }

    return breakdown;
  }

  /**
   * Generate a sequential invoice number
   */
  static generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Private helper to draw items table
   */
  private static drawItemsTable(doc: InstanceType<typeof PDFDocument>, items: OrderItem[]): void {
    const tableTop = doc.y;
    const itemX = 40;
    const quantityX = 300;
    const unitPriceX = 380;
    const amountX = 460;

    // Header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item', itemX, tableTop);
    doc.text('Qty', quantityX, tableTop);
    doc.text('Unit Price', unitPriceX, tableTop);
    doc.text('Amount', amountX, tableTop);

    // Horizontal line
    doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Items
    doc.font('Helvetica').fontSize(9);
    let y = tableTop + 25;

    for (const item of items) {
      const amount = item.quantity * item.unitPrice - (item.discount || 0);

      doc.text(item.productName.substring(0, 30), itemX, y);
      doc.text(item.quantity.toString(), quantityX, y);
      doc.text(`₹${item.unitPrice.toFixed(2)}`, unitPriceX, y);
      doc.text(`₹${amount.toFixed(2)}`, amountX, y);

      y += 20;
    }

    // Bottom line
    doc.moveTo(itemX, y).lineTo(550, y).stroke();
  }

  /**
   * Private helper to draw tax summary
   */
  private static drawTaxSummary(doc: InstanceType<typeof PDFDocument>, invoiceData: InvoiceData): void {
    const summaryX = 380;
    let y = doc.y;

    doc.fontSize(10).font('Helvetica');

    doc.text(`Subtotal:`, summaryX, y);
    doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, summaryX + 100, y);
    y += 20;

    if (invoiceData.discount) {
      doc.text(`Discount:`, summaryX, y);
      doc.text(`-₹${invoiceData.discount.toFixed(2)}`, summaryX + 100, y);
      y += 20;
    }

    if (invoiceData.sgst) {
      doc.text(`SGST:`, summaryX, y);
      doc.text(`₹${invoiceData.sgst.toFixed(2)}`, summaryX + 100, y);
      y += 20;
    }

    if (invoiceData.cgst) {
      doc.text(`CGST:`, summaryX, y);
      doc.text(`₹${invoiceData.cgst.toFixed(2)}`, summaryX + 100, y);
      y += 20;
    }

    if (invoiceData.igst) {
      doc.text(`IGST:`, summaryX, y);
      doc.text(`₹${invoiceData.igst.toFixed(2)}`, summaryX + 100, y);
      y += 20;
    }
  }

  /**
   * Private helper to format date
   */
  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Generate e-invoice (IRN) - Placeholder for integration
   * This is a skeleton for GST e-invoice integration
   */
  static generateEInvoice(invoiceData: InvoiceData): string {
    // TODO: Implement e-invoice (IRN) generation
    // This requires integration with GST portal
    // For now, return a placeholder
    return `E-Invoice-${invoiceData.invoiceNumber}`;
  }

  /**
   * Send invoice via email - Placeholder for integration
   */
  static async sendInvoiceEmail(invoiceBuffer: Buffer, customerEmail: string, invoiceNumber: string): Promise<boolean> {
    // TODO: Implement email sending with Nodemailer
    // For now, log the action
    console.log(`[DEV] Would send invoice ${invoiceNumber} to ${customerEmail}`);
    return true;
  }
}

export default InvoiceService;
