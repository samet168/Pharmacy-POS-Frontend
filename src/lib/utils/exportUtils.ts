/**
 * Pharmacy POS Export & Print Utility Library
 * Handles CSV data export and thermal receipt / A4 invoice printing.
 */

// 1. Export Data to CSV File
export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean)[]) {
  try {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            // Escape quotes and commas
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV Export Error:', error);
    throw error;
  }
}

// 2. Print Thermal POS Receipt (80mm format)
export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  unit?: string;
  total: number;
}

export interface ReceiptData {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  orderNumber: string;
  date: string;
  cashierName?: string;
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  grandTotal: number;
  grandTotalKHR?: number;
  paymentMethod: string;
  amountPaid?: number;
  changeDue?: number;
  notes?: string;
}

export function printThermalReceipt(data: ReceiptData) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  const khrAmount = data.grandTotalKHR || Math.round(data.grandTotal * 4100);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt #${data.orderNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 8px 4px;
            font-size: 11px;
            color: #000;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .header { margin-bottom: 8px; }
          .store-name { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
          .meta-table, .items-table, .total-table { width: 100%; border-collapse: collapse; }
          .items-table th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; font-size: 10px; }
          .items-table td { padding: 3px 0; vertical-align: top; }
          .total-table td { padding: 2px 0; }
          .grand-total { font-size: 14px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px double #000; padding: 4px 0; }
          .footer { margin-top: 12px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="store-name">${data.storeName || 'PHARMACY POS'}</div>
          <div>${data.storeAddress || 'Phnom Penh, Cambodia'}</div>
          <div>Tel: ${data.storePhone || '+855 23 888 999'}</div>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr><td>Invoice #: <strong>${data.orderNumber}</strong></td><td class="text-right">${data.date}</td></tr>
          <tr><td>Cashier: ${data.cashierName || 'Staff'}</td><td class="text-right">Cust: ${data.customerName || 'Walk-in'}</td></tr>
        </table>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th class="text-center">QTY</th>
              <th class="text-right">PRICE</th>
              <th class="text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${data.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.qty}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${item.total.toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="total-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">$${data.subtotal.toFixed(2)}</td>
          </tr>
          ${
            data.discount
              ? `<tr><td>Discount:</td><td class="text-right">-$${data.discount.toFixed(2)}</td></tr>`
              : ''
          }
          ${
            data.tax
              ? `<tr><td>VAT Tax (10%):</td><td class="text-right">$${data.tax.toFixed(2)}</td></tr>`
              : ''
          }
          <tr class="grand-total">
            <td>GRAND TOTAL:</td>
            <td class="text-right">$${data.grandTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total in KHR:</td>
            <td class="text-right">៛${khrAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Payment Method:</td>
            <td class="text-right font-bold">${data.paymentMethod}</td>
          </tr>
          ${
            data.amountPaid
              ? `<tr><td>Amount Paid:</td><td class="text-right">$${data.amountPaid.toFixed(2)}</td></tr>`
              : ''
          }
          ${
            data.changeDue !== undefined
              ? `<tr><td>Change Due:</td><td class="text-right">$${data.changeDue.toFixed(2)}</td></tr>`
              : ''
          }
        </table>

        <div class="divider"></div>

        <div class="footer text-center">
          <p class="font-bold">Thank you for visiting Pharmacy POS!</p>
          <p>We wish you good health and well-being.</p>
          <p style="font-size: 8px; color: #555;">Software by Pharmacy POS SaaS</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// 3. Print Official Invoice / Subscription PDF Document
export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  orgName: string;
  orgId: number;
  planName: string;
  maxBranches: number;
  maxUsers: number;
  billingPeriod: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
}

export function printOfficialInvoice(data: InvoiceData) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const totalKHR = Math.round(data.total * 4100);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${data.invoiceNumber} — ${data.planName} Subscription</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: 800; color: #0284c7; text-transform: uppercase; }
          .invoice-title { font-size: 28px; font-weight: 900; text-align: right; color: #0f172a; }
          .badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #15803d; border-radius: 20px; font-weight: bold; font-size: 11px; }
          .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #0f172a; color: #ffffff; padding: 10px 12px; text-align: left; font-size: 12px; }
          .items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .total-section { width: 300px; margin-left: auto; border-collapse: collapse; }
          .total-section td { padding: 6px 12px; }
          .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #0f172a; color: #0284c7; }
          .footer-section { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 11px; }
          .signature-box { margin-top: 40px; display: flex; justify-content: space-between; }
          .sig-line { width: 200px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 5px; font-size: 11px; font-weight: bold; color: #475569; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="company-logo">Pharmacy POS SaaS</div>
              <div>Multi-tenant Pharmacy Management System</div>
              <div>Phnom Penh, Kingdom of Cambodia</div>
              <div>Email: billing@pharmacypos.com · Tel: +855 23 888 999</div>
            </td>
            <td style="text-align: right;">
              <div class="invoice-title">INVOICE</div>
              <div style="margin-top: 5px;">#${data.invoiceNumber}</div>
              <div style="margin-top: 5px;"><span class="badge">${data.status.toUpperCase()}</span></div>
            </td>
          </tr>
        </table>

        <table class="info-grid">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
              <div class="info-box">
                <strong style="color: #0284c7;">Billed To (Customer):</strong>
                <div style="font-size: 15px; font-weight: bold; margin-top: 5px;">${data.orgName}</div>
                <div>Organization ID: #${data.orgId}</div>
                <div>Payment Method: ${data.paymentMethod}</div>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 15px;">
              <div class="info-box">
                <strong style="color: #0284c7;">Invoice Dates & Terms:</strong>
                <div>Invoice Date: <strong>${data.date}</strong></div>
                <div>Due Date: <strong>${data.dueDate}</strong></div>
                <div>Billing Period: <strong>${data.billingPeriod}</strong></div>
              </div>
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th>DESCRIPTION / ITEM</th>
              <th>BRANCHES QUOTA</th>
              <th>STAFF ACCOUNTS</th>
              <th style="text-align: right;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong style="font-size: 14px;">${data.planName} Subscription Plan</strong>
                <div style="color: #64748b; font-size: 11px;">Full access to Pharmacy POS Backoffice & POS System</div>
              </td>
              <td>Up to ${data.maxBranches} Branches</td>
              <td>Up to ${data.maxUsers} Users</td>
              <td style="text-align: right; font-weight: bold;">$${data.subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <table class="total-section">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">$${data.subtotal.toFixed(2)}</td>
          </tr>
          ${
            data.discount
              ? `<tr><td style="color: #16a34a;">Discount (20%):</td><td style="text-align: right; color: #16a34a;">-$${data.discount.toFixed(2)}</td></tr>`
              : ''
          }
          <tr>
            <td>VAT Tax (10%):</td>
            <td style="text-align: right;">$${data.tax.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL DUE:</td>
            <td style="text-align: right;">$${data.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-size: 11px; color: #64748b;">Total in KHR:</td>
            <td style="text-align: right; font-size: 11px; font-weight: bold;">៛${totalKHR.toLocaleString()}</td>
          </tr>
        </table>

        <div style="margin-top: 40px; padding: 15px; background: #f1f5f9; border-radius: 8px; font-size: 11px;">
          <strong>Payment Note:</strong> Thank you for your business. This invoice confirms successful subscription payment and immediate feature activation.
        </div>

        <div class="signature-box">
          <div class="sig-line">Prepared By (Pharmacy POS)</div>
          <div class="sig-line">Authorized Signatory</div>
        </div>

        <div class="footer-section">
          Thank you for choosing Pharmacy POS SaaS · www.pharmacypos.com
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
