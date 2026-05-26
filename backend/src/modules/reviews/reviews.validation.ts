import { z } from "zod";
import { reviewCommentField, reviewRatingField } from "../../utils/fields";

export const createReviewSchema = z.object({
  rating: reviewRatingField,
  comment: reviewCommentField,
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
