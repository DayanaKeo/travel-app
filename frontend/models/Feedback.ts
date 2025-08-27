import { Schema, models, model } from "mongoose";

const FeedbackSchema = new Schema(
  {
    userId: String,
    message: String,
    type: String
  },
  { timestamps: true }
);

export default models.Feedback || model("Feedback", FeedbackSchema);
