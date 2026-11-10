import mongoose, { Document, Schema } from 'mongoose';

export interface ICRMSetting extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  category: 'general' | 'roles' | 'pipeline' | 'integrations' | 'notifications';
  value: any;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const crmSettingSchema = new Schema<ICRMSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ['general', 'roles', 'pipeline', 'integrations', 'notifications'],
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CRMSetting = mongoose.model<ICRMSetting>('CRMSetting', crmSettingSchema);

