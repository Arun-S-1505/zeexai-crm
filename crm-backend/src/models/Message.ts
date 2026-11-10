import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  isRead: boolean;
  relatedLead?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
  },
  { timestamps: true }
);

messageSchema.index({ to: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);

