"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.createReviewSchema = zod_1.z.object({
    rating: fields_1.reviewRatingField,
    comment: fields_1.reviewCommentField,
});
