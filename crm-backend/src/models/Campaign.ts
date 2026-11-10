import mongoose, { Document, Schema } from 'mongoose';

export type CampaignType =
  | 'Email Marketing'
  | 'Social Media'
  | 'Paid Advertising'
  | 'Direct Marketing'
  | 'Website Campaign'
  | 'Event Campaign'
  | 'Other';

export type CampaignStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Cancelled';

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: string;
  name: string;
  type: CampaignType;
  channel: string;
  targetAudience?: string;
  objective?: string;
  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  budget: number;
  actualSpend: number;
  leadsGenerated: number;
  conversions: number;
  revenueGenerated: number;
  trackingCode: string;
  owner?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    campaignId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'Email Marketing',
        'Social Media',
        'Paid Advertising',
        'Direct Marketing',
        'Website Campaign',
        'Event Campaign',
        'Other',
      ],
      default: 'Email Marketing',
    },
    channel: { type: String, default: 'Email' },
    targetAudience: { type: String, default: '' },
    objective: { type: String, default: 'Lead Generation' },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Active', 'Paused', 'Completed', 'Cancelled'],
      default: 'Draft',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    budget: { type: Number, default: 0, min: 0 },
    actualSpend: { type: Number, default: 0, min: 0 },
    leadsGenerated: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 },
    revenueGenerated: { type: Number, default: 0, min: 0 },
    trackingCode: { type: String, trim: true, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ status: 1, type: 1 });
campaignSchema.index({ trackingCode: 1 });

campaignSchema.pre('save', async function (next) {
  if (this.campaignId) return next();
  const last = await Campaign.findOne({}, { campaignId: 1 }).sort({ campaignId: -1 }).lean();
  let nextNum = 1001;
  if (last && last.campaignId) {
    const num = parseInt(last.campaignId.replace('CMP-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.campaignId = `CMP-${String(nextNum).padStart(4, '0')}`;

  // Default tracking code if none specified
  if (!this.trackingCode) {
    this.trackingCode = `utm_campaign=${this.campaignId.toLowerCase()}`;
  }
  next();
});

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
