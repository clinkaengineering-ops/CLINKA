"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPrefsSchema = void 0;
const zod_1 = require("zod");
exports.updateNotificationPrefsSchema = zod_1.z.object({
    newBid: zod_1.z.boolean().optional(),
    bidAccepted: zod_1.z.boolean().optional(),
    fundsReleased: zod_1.z.boolean().optional(),
    newMessage: zod_1.z.boolean().optional(),
});
