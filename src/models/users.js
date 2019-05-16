import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  // email: { type: String, unique: true },
  email: String,
  password: String,
  verified: { type: Boolean, default: false },
});

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('users', userSchema);
