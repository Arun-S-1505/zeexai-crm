import mongoose, { Document, Schema } from 'mongoose';

export type AcknowledgementType =
  | 'Enquiry Received'
  | 'Lead Received'
  | 'Brochure Request'
  | 'Quotation Received'
  | 'Quotation Acceptance'
  | 'Document Received'
  | 'Meeting Confirmation'
  | 'General Acknowledgement';

export type AcknowledgementStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Sent'
  | 'Acknowledged'
  | 'Rejected'
  | 'Expired';

export interface IAcknowledgementHistory {
  status: AcknowledgementStatus;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId;
  note?: string;
}

export interface IAcknowledgement extends Document {
  _id: mongoose.Types.ObjectId;
  acknowledgementId: string;
  referenceNumber: string;
  contactName: string;
  company: string;
  email: string;
  phone?: string;
  relatedLead?: mongoose.Types.ObjectId;
  relatedQuotation?: mongoose.Types.ObjectId;
  type: AcknowledgementType;
  subject: string;
  content: string;
  status: AcknowledgementStatus;
  sentDate?: Date;
  responseDate?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  notes?: string;
  history: IAcknowledgementHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const acknowledgementSchema = new Schema<IAcknowledgement>(
  {
    acknowledgementId: { type: String, unique: true, index: true },
    referenceNumber: { type: String, trim: true, default: '' },
    contactName: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    relatedQuotation: { type: Schema.Types.ObjectId, ref: 'Quotation', default: null },
    type: {
      type: String,
      enum: [
        'Enquiry Received',
        'Lead Received',
        'Brochure Request',
        'Quotation Received',
        'Quotation Acceptance',
        'Document Received',
        'Meeting Confirmation',
        'General Acknowledgement',
      ],
      default: 'Enquiry Received',
    },
    subject: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'Draft',
        'Pending Approval',
        'Approved',
        'Sent',
        'Acknowledged',
        'Rejected',
        'Expired',
      ],
      default: 'Draft',
      index: true,
    },
    sentDate: { type: Date, default: null },
    responseDate: { type: Date, default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
    history: [
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

acknowledgementSchema.index({ createdAt: -1 });
acknowledgementSchema.index({ status: 1, createdAt: -1 });
acknowledgementSchema.index({ acknowledgementId: 'text', contactName: 'text', company: 'text' });

// Auto-sequence acknowledgementId (ACK-1001, ACK-1002, ...)
acknowledgementSchema.pre('save', async function (next) {
  if (this.acknowledgementId) return next();
  const last = await Acknowledgement.findOne({}, { acknowledgementId: 1 })
    .sort({ acknowledgementId: -1 })
    .lean();
  let nextNum = 1001;
  if (last && last.acknowledgementId) {
    const num = parseInt(last.acknowledgementId.replace('ACK-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.acknowledgementId = `ACK-${String(nextNum).padStart(4, '0')}`;
  next();
});

export const Acknowledgement = mongoose.model<IAcknowledgement>(
  'Acknowledgement',
  acknowledgementSchema
);
