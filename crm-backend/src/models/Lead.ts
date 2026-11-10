import mongoose, { Document, Schema } from 'mongoose';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Demo Scheduled' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
export type LeadPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type LeadProduct = 'Z-Factory' | 'Z-Tracs' | 'Z-Market' | 'Z-Drone' | 'Z-Consultancy';
export type LeadSource = 'Website enquiry' | 'Brochure download' | 'Marketing campaign' | 'Referral' | 'Direct outreach' | 'Contact form';

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  leadId: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone?: string;
  interestedProduct: LeadProduct;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  requirements?: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  assignmentReason?: string;
  assignmentNotes?: string;
  nextFollowUp?: Date;
  lastActivityDate?: Date;
  notes?: string;
  isDuplicate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    leadId: { type: String, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    interestedProduct: {
      type: String,
      enum: ['Z-Factory', 'Z-Tracs', 'Z-Market', 'Z-Drone', 'Z-Consultancy'],
      required: true,
    },
    source: {
      type: String,
      enum: ['Website enquiry', 'Brochure download', 'Marketing campaign', 'Referral', 'Direct outreach', 'Contact form'],
      required: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
      default: 'New',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    requirements: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },
    assignmentReason: { type: String, default: '' },
    assignmentNotes: { type: String, default: '' },
    nextFollowUp: { type: Date, default: null },
    lastActivityDate: { type: Date, default: Date.now },
    notes: { type: String },
    isDuplicate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ firstName: 'text', lastName: 'text', company: 'text', email: 'text' });

// Auto-generate leadId before saving
leadSchema.pre('save', async function (next) {
  if (this.leadId) return next();
  const last = await Lead.findOne({}, { leadId: 1 }).sort({ leadId: -1 }).lean();
  let nextNum = 1001;
  if (last && last.leadId) {
    const num = parseInt(last.leadId.replace('LD-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.leadId = `LD-${String(nextNum).padStart(4, '0')}`;
  next();
});

export const Lead = mongoose.model<ILead>('Lead', leadSchema);

