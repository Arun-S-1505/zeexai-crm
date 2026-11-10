import mongoose, { Document, Schema } from 'mongoose';

export interface IConversationMessage {
  _id?: mongoose.Types.ObjectId;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  senderId?: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'failed';
  isInternalNote: boolean;
}

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  channel: 'Email' | 'Website enquiry' | 'WhatsApp' | 'Direct';
  status: 'Open' | 'Pending' | 'Resolved' | 'Archived';
  assignedTo?: mongoose.Types.ObjectId;
  relatedLead?: mongoose.Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  messages: IConversationMessage[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationMessageSchema = new Schema<IConversationMessage>(
  {
    sender: { type: String, enum: ['customer', 'agent', 'system'], required: true },
    senderName: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' },
    isInternalNote: { type: Boolean, default: false },
  },
  { timestamps: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    conversationId: { type: String, unique: true, index: true },
    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    contactPhone: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    channel: {
      type: String,
      enum: ['Email', 'Website enquiry', 'WhatsApp', 'Direct'],
      default: 'Website enquiry',
    },
    status: {
      type: String,
      enum: ['Open', 'Pending', 'Resolved', 'Archived'],
      default: 'Open',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    unreadCount: { type: Number, default: 0 },
    messages: [conversationMessageSchema],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });
conversationSchema.index({ contactName: 'text', contactEmail: 'text', company: 'text' });

// Auto-sequence conversationId (CONV-1001, CONV-1002, ...)
conversationSchema.pre('save', async function (next) {
  if (this.conversationId) return next();
  const last = await Conversation.findOne({}, { conversationId: 1 })
    .sort({ conversationId: -1 })
    .lean();
  let nextNum = 1001;
  if (last && last.conversationId) {
    const num = parseInt(last.conversationId.replace('CONV-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.conversationId = `CONV-${String(nextNum).padStart(4, '0')}`;
  next();
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

