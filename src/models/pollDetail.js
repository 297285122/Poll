import mongoose, { Schema } from 'mongoose';

const pollDetailSchema = new Schema({
  idOfTheme: String, // todo not null
  // email: { type: String, unique: true },
  // ip: { type: String, unique: true },
  email: String,
  ip: String,
  vote: [{
    id: String,
    name: String,
  }],
});

pollDetailSchema.index({ idOfTheme: 1, email: 1 }, { unique: true });
pollDetailSchema.index({ idOfTheme: 1, ip: 1 }, { unique: true });

export default mongoose.model('pollDetail', pollDetailSchema);
