import mongoose, { Document, Schema } from 'mongoose';

export type BrochureStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Archived';

export interface IBrochureDownload extends Document {
  _id: mongoose.Types.ObjectId;
  downloadId: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  brochureType: string;
  status: BrochureStatus;
  source: string;
  relatedLead?: mongoose.Types.ObjectId;
  notes?: string;
  isRepeat: boolean;
  downloadCount: number;
  downloadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const brochureDownloadSchema = new Schema<IBrochureDownload>(
  {
    downloadId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    company: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    brochureType: {
      type: String,
      required: true,
      default: 'Z-Factory Overview',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Archived'],
      default: 'New',
      index: true,
    },
    source: {
      type: String,
      default: 'Website Download',
    },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    notes: { type: String, default: '' },
    isRepeat: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 1 },
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

brochureDownloadSchema.index({ createdAt: -1 });
brochureDownloadSchema.index({ email: 1, createdAt: -1 });
brochureDownloadSchema.index({ name: 'text', email: 'text', company: 'text', phone: 'text' });

// Auto-generate downloadId: BD-1001, BD-1002...
brochureDownloadSchema.pre('save', async function (next) {
  if (this.downloadId) return next();
  const last = await BrochureDownload.findOne({}, { downloadId: 1 }).sort({ downloadId: -1 }).lean();
  let nextNum = 1001;
  if (last && last.downloadId) {
    const num = parseInt(last.downloadId.replace('BD-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.downloadId = `BD-${String(nextNum).padStart(4, '0')}`;
  next();
});

export const BrochureDownload = mongoose.model<IBrochureDownload>('BrochureDownload', brochureDownloadSchema);
