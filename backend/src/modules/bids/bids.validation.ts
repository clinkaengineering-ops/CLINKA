import { z } from "zod";
import {
  bidDescriptionField,
  bidDurationField,
  bidPriceField,
} from "../../utils/fields";

export const createBidSchema = z.object({
  price: bidPriceField,
  duration: bidDurationField,
  description: bidDescriptionField,
});

export type CreateBidInput = z.infer<typeof createBidSchema>;
