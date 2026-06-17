"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBidSchema = void 0;
const zod_1 = require("zod");
const fields_1 = require("../../utils/fields");
exports.createBidSchema = zod_1.z.object({
    price: fields_1.bidPriceField,
    duration: fields_1.bidDurationField,
    description: fields_1.bidDescriptionField,
});
