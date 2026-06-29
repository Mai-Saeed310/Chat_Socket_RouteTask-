import z from "zod"
import { generalRules } from "../../../common/utiliti/generalRules"

export const createGroupSchema = {
    body: z.strictObject({
        group: z.string({error: "group name is required"}),
        groupImage: z.string().optional(),
        participants: z.array(generalRules.id)
            .min(1, "at least one participant required")
    }).superRefine((data, ctx) => {

        //  prevent duplicate participants
        const unique = new Set(data.participants)

        if (unique.size !== data.participants.length) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Duplicate participants not allowed"
            })
        }

        // ensure group has at least 2 people (you + others usually)
        if (data.participants.length < 1) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "group must have at least one participant"
            })
        }
    })
}

export type createGroupSchemaType = z.infer<typeof createGroupSchema.body>