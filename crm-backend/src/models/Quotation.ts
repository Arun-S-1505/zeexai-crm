import mongoose, { Document, Schema } from 'mongoose';

export type QuotationStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Sent'
  | 'Viewed'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Cancelled';

export interface IQuotationLineItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number; // percentage (e.g. 10%)
  taxRate: number; // percentage (e.g. 18%)
  lineTotal: number;
}

export interface IQuotationStatusHistory {
  status: QuotationStatus;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId;
  note?: string;
}

export interface IQuotation extends Document {
  _id: mongoose.Types.ObjectId;
  quotationNumber: string;
  title: string;
  customerName: string;
  company: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  relatedLead?: mongoose.Types.ObjectId;
  issueDate: Date;
  validUntil: Date;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  currency: string;
  lineItems: IQuotationLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  termsAndConditions?: string;
  status: QuotationStatus;
  statusHistory: IQuotationStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IQuotationLineItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unit: { type: String, default: 'Units' },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    taxRate: { type: Number, default: 18, min: 0, max: 100 },
    lineTotal: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const quotationSchema = new Schema<IQuotation>(
  {
    quotationNumber: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    billingAddress: { type: String, trim: true, default: '' },
    shippingAddress: { type: String, trim: true, default: '' },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    issueDate: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    currency: { type: String, default: 'INR' },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentTerms: { type: String, default: '50% advance on PO confirmation, 50% on installation completion.' },
    deliveryTerms: { type: String, default: 'Standard dispatch within 2-3 business weeks upon sign-off.' },
    notes: { type: String, default: '' },
    termsAndConditions: {
      type: String,
      default:
        'This quotation is valid for 30 calendar days from issue date. All intellectual property, edge models, and firmware rights remain under ZEE X AI proprietary ownership.',
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Pending Approval',
        'Approved',
        'Sent',
        'Viewed',
        'Accepted',
        'Rejected',
        'Expired',
        'Cancelled',
      ],
      default: 'Draft',
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ status: 1, createdAt: -1 });
quotationSchema.index({ quotationNumber: 'text', customerName: 'text', company: 'text' });

// Auto-sequence quotationNumber (QT-2026-001, QT-2026-002, ...)
quotationSchema.pre('save', async function (next) {
  if (this.quotationNumber) return next();
  const year = new Date().getFullYear();
  const last = await Quotation.findOne(
    { quotationNumber: new RegExp(`^QT-${year}-`) },
    { quotationNumber: 1 }
  )
    .sort({ quotationNumber: -1 })
    .lean();

  let nextNum = 1;
  if (last && last.quotationNumber) {
    const parts = last.quotationNumber.split('-');
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.quotationNumber = `QT-${year}-${String(nextNum).padStart(3, '0')}`;
  next();
});

export const Quotation = mongoose.model<IQuotation>('Quotation', quotationSchema);
