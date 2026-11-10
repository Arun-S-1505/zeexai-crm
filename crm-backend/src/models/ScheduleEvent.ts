import mongoose, { Document, Schema } from 'mongoose';

export type MeetingType =
  | 'Product Demo'
  | 'Discovery Call'
  | 'Follow-up'
  | 'Sales Meeting'
  | 'Technical Discussion'
  | 'Internal Meeting'
  | 'Other';

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'No Show';

export interface IScheduleEvent extends Document {
  _id: mongoose.Types.ObjectId;
  appointmentId: string;
  title: string;
  contactName?: string;
  company?: string;
  type: MeetingType;
  date: Date;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  relatedLead?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  locationOrLink?: string;
  description?: string;
  reminder?: string;
  notes?: string;
  outcome?: string;
  color: 'purple' | 'blue' | 'green' | 'amber' | 'red';
  createdAt: Date;
  updatedAt: Date;
}

const scheduleEventSchema = new Schema<IScheduleEvent>(
  {
    appointmentId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: [
        'Product Demo',
        'Discovery Call',
        'Follow-up',
        'Sales Meeting',
        'Technical Discussion',
        'Internal Meeting',
        'Other',
      ],
      default: 'Discovery Call',
    },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true, default: '10:00 AM' },
    endTime: { type: String, default: '11:00 AM' },
    status: {
      type: String,
      enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'],
      default: 'Scheduled',
      index: true,
    },
    relatedLead: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    locationOrLink: { type: String, default: '' },
    description: { type: String, default: '' },
    reminder: { type: String, default: '15 min before' },
    notes: { type: String, default: '' },
    outcome: { type: String, default: '' },
    color: { type: String, enum: ['purple', 'blue', 'green', 'amber', 'red'], default: 'blue' },
  },
  { timestamps: true }
);

scheduleEventSchema.index({ date: 1, startTime: 1 });
scheduleEventSchema.index({ assignedTo: 1, date: 1 });

scheduleEventSchema.pre('save', async function (next) {
  if (this.appointmentId) return next();
  const last = await ScheduleEvent.findOne({}, { appointmentId: 1 }).sort({ appointmentId: -1 }).lean();
  let nextNum = 1001;
  if (last && last.appointmentId) {
    const num = parseInt(last.appointmentId.replace('APT-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  this.appointmentId = `APT-${String(nextNum).padStart(4, '0')}`;
  next();
});

export const ScheduleEvent = mongoose.model<IScheduleEvent>('ScheduleEvent', scheduleEventSchema);
