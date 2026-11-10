import mongoose, { Document, Schema } from 'mongoose';

export type DirectMailType =
  | 'Brochure'
  | 'Product Catalogue'
  | 'Introduction Letter'
  | 'Marketing Letter'
  | 'Quotation'
  | 'Thank-you Letter'
  | 'Other';

export type DirectMailStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Delivered'
  | 'Returned'
  | 'Cancelled';

export interface IDirectMailHistory {
  status: DirectMailStatus;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId;
  note?: string;
}

export interface IDirectMail extends Document {
  _id: mongoose.Types.ObjectId;
  mailId: string;
  recipientName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mailType: DirectMailType;
  status: DirectMailStatus;
  relatedLead?: mongoose.Types.ObjectId;
  relatedCampaign?: mongoose.Types.ObjectId;
  scheduledDate?: Date;
  dispatchDate?: Date;
  deliveryDate?: Date;
  trackingNumber?: string;
  postalCarrier?: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  notes?: string;
  statusHistory: IDirectMailHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const directMailSchema = new Schema<IDirectMail>(
  {
    mailId: { type: String, unique: true, index: true },
    recipientName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true, default: '' },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    mailType: {
      type: String,
      enum: [
        'Brochure',
        'Product Catalogue',
        'Introduction Letter',
        'Marketing Letter',
        'Quotation',
        'Thank-you Letter',
        'Other',
      ],
      default: 'Brochure',
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Pending Approval',
        'Approved',
        'Ready for Dispatch',
        'Dispatched',
        'Delivered',
        'Returned',
        'Cancelled',
      ],
      default: 'Draft',
      index: true,
    },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    relatedCampaign: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
    scheduledDate: { type: Date, default: null },
    dispatchDate: { type: Date, default: null },
    deliveryDate: { type: Date, default: null },
    trackingNumber: { type: String, trim: true, default: '' },
    postalCarrier: { type: String, trim: true, default: '' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
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

directMailSchema.index({ createdAt: -1 });
directMailSchema.index({ status: 1, createdAt: -1 });
directMailSchema.index({ recipientName: 'text', companyName: 'text', city: 'text' });

// Auto-sequence mailId (DM-1001, DM-1002, ...)
directMailSchema.pre('save', async function (next) {
  if (this.mailId) return next();
  const last = await DirectMail.findOne({}, { mailId: 1 }).sort({ mailId: -1 }).lean();
  let nextNum = 1001;
  if (last && last.mailId) {
    const num = parseInt(last.mailId.replace('DM-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.mailId = `DM-${String(nextNum).padStart(4, '0')}`;
  next();
});

export const DirectMail = mongoose.model<IDirectMail>('DirectMail', directMailSchema);

