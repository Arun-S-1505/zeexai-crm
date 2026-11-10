import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  recordRef?: string;
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    recordRef: { type: String, default: '' },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ module: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

