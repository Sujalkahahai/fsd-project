import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Subject title is required'],
      trim: true,
    },
    why: {
      type: String,
      trim: true,
      maxlength: [250, 'Why note cannot exceed 250 characters'],
      default: '',
    },
    targetDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;

