import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Event date is required'],
      trim: true,
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
    },
    tone: {
      type: String,
      default: 'bg-teal-50 text-teal-700',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
