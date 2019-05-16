import mongoose from 'mongoose';

mongoose.Promise = Promise;
mongoose.plugin((schema) => {
  schema.options = schema.options || {};
  schema.options.timestamps = true;
  schema.options.toJSON = schema.options.toJSON || {};
  schema.options.toJSON.transform = (doc, ret) => {
    ret.id = ret._id;
    Reflect.deleteProperty(ret, '_id');
    Reflect.deleteProperty(ret, '__v');
    return ret;
  };
});
