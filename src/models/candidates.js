import mongoose, { Schema } from 'mongoose';

const candidateSchema = new Schema({
  // name: { type: String, unique: true }, //  候选人姓名
  name: String,
  entry: String, // 参赛作品
}, {
  timestamps: true,
});

candidateSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('candidates', candidateSchema);
