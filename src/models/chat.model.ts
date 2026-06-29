import mongoose, { Types } from "mongoose";

interface IMessage {
    createdBy: Types.ObjectId,
    content: string
}

export interface IChat {
    // ovo(one verse one)
    createdBy: Types.ObjectId,
    participants: Types.ObjectId[],
    messages: IMessage[]
    // ovm(one verse many)
    group: string, // group name
    groupImage?: string,
    roomId: string
}

const messageSchema = new mongoose.Schema<IMessage>({

    content: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "userModel", required: true },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true
})

const ChatSchema = new mongoose.Schema<IChat>({
    participants: [{ type: Types.ObjectId, ref: "userModel", required: true }],
    createdBy: { type: Types.ObjectId, ref: "userModel", required: true },
    messages: [messageSchema],

    group: String,
    groupImage: String,
    roomId: String,

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true
})

// create model
export const chatModel = mongoose.model<IChat>("chatModel", ChatSchema);
