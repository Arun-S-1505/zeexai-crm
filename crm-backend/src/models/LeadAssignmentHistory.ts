import mongoose, { Document, Schema } from 'mongoose';

export interface ILeadAssignmentHistory extends Document {
  _id: mongoose.Types.ObjectId;
  lead: mongoose.Types.ObjectId;
  leadId: string;
  previousAssignee?: mongoose.Types.ObjectId;
  newAssignee?: mongoose.Types.ObjectId;
  assignedBy?: mongoose.Types.ObjectId;
  assignedAt: Date;
  reason?: string;
  priority?: string;
  notes?: string;
  method: 'Manual' | 'Bulk' | 'Round-Robin' | 'Reassignment';
}

const leadAssignmentHistorySchema = new Schema<ILeadAssignmentHistory>(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    leadId: { type: String, required: true },
    previousAssignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    newAssignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: Date.now, index: true },
    reason: { type: String, default: '' },
    priority: { type: String, default: 'Medium' },
    notes: { type: String, default: '' },
    method: {
      type: String,
      enum: ['Manual', 'Bulk', 'Round-Robin', 'Reassignment'],
      default: 'Manual',
    },
  },
  { timestamps: true }
);

leadAssignmentHistorySchema.index({ lead: 1, assignedAt: -1 });

export const LeadAssignmentHistory = mongoose.model<ILeadAssignmentHistory>(
  'LeadAssignmentHistory',
  leadAssignmentHistorySchema
);

