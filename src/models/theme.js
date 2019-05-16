import mongoose, { Schema } from 'mongoose';

const themeSchema = new Schema({
  // name: { type: String, unique: true }, // 活动名称
  name: String,
  content: String, // 活动内容
  candidate: [{
    id: String, // 候选人_id
    vote: { type: Number, default: 0 },
  }],
  startTime: Number, // 活动开始时间搓，单位为秒
  endTime: Number, // 活动截止时间搓，单位为秒
}, {
  timestamps: true,
});

themeSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('themes', themeSchema);
