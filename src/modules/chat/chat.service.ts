import { NextFunction, Request, Response } from "express"
import { AppError } from "../../common/utiliti/global-error-handling"
import { ChatRepository } from "../../DB/Repository/chat.repository"
import { UserRepository } from "../../DB/Repository/user.repository"
import { IRequest } from "../../common/middlware/authentication"
import { Socket , Server} from 'socket.io';
import { exec } from "node:child_process"
import radisService from "../../common/service/radis.service"
import { Types } from "mongoose"
import { createGroupSchemaType } from "./realtime/chat.validation"
import { v4 as uuidv4 } from "uuid";
import { S3Service } from "../../common/service/S3.service"


class ChatService {
    constructor() { }
    private readonly _userRepo = new UserRepository()
    private readonly _chatRepo = new ChatRepository()
    private readonly _S3Service = new S3Service();

    // rest apis
   getChat = async (req: IRequest, res: Response) => {
        const { userId } = req.params

        const chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id!, userId],
                },
                group: { $exists: false },
            },
            projection: {
                messages: {$slice: -5}         

            },
            options: {
                populate: [
                    {
                        path: "participants"
                    }
                ],

            }
        })

        if (!chat) {
            throw new AppError("chat not found", 400)
        }

        return res.status(200).json({
        message: "Done",
        data: chat
      });

    }

    createGroup = async (req: IRequest, res: Response, next: NextFunction) => {
    let { group, groupImage, participants }: createGroupSchemaType = req.body
    const createdBy = req.user?._id!
    
    const dbParticipants = participants.map((participant: string) => Types.ObjectId.createFromHexString(participant))
    const users = await this._userRepo.find({
        filter: {
            _id: {
                $in: dbParticipants
            },
            friends: {
                $in: [createdBy]
            }
        }
    })
    if(users.length !== participants.length){
        throw new AppError ("some users not found", 404)
    }

  const roomId = `${group.replaceAll(/\s+/g, "-")}_${uuidv4()}`;
    if (req?.file) {
         groupImage = await this._S3Service.uploadFile({
        file: req.file as Express.Multer.File, 
        path: `chat/${roomId}`
       }) 
    }


    try {

        const chat = await this._chatRepo.create({
            group,
            groupImage:groupImage! ,
            participants: [...dbParticipants, createdBy],
            createdBy,
            roomId,
            messages: []
        })

        return res.status(200).json({ message: "success" , chat})

    } catch (error) {

        console.log(error);

        throw new AppError("chat not created");
    }

}


   getGroupChat = async (req: IRequest, res: Response) => {
        const { groupId } = req.params

        const chat = await this._chatRepo.findOne({
            filter: {
                _id: groupId , 
                participants: {
                    $all: [req.user?._id!],
                },
                group: { $exists: true },
            },
            projection: {
                messages: {$slice: -5}         

            },
            options: {
                populate: [
                    {
                        path: "messages.createdBy"
                    }
                ],

            }
        })

        if (!chat) {
            throw new AppError("chat not found", 404)
        }

        return res.status(200).json({
        message: "Done",
        data: chat
      });

    }


        // socket.io
  sayHi =  (data: any) => {
    console.log("😒😒😒")
        console.log(data)
    }

   sendMessage =  async (data: any, socket: Socket, io: Server) => {
        console.log(data)
        const {sendTo, content} = data
        const createdBy = socket.data.user._id
        const user = await this._userRepo.findOne({ filter: {_id: sendTo}})
        if(!user){
            throw new AppError("user not found")
        }
        // there is an exists chat 
        const chat = await this._chatRepo.findOneAndUpdate({ 
            filter: {
                participants: {
                    $all: [sendTo,createdBy]
                }, 
                group: {$exists: false}

        }, 
        update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
        }
        })
        if (!chat) {
        await this._chatRepo.create({
            createdBy,
            messages: [{
                content,
                createdBy
            }],
            participants: [sendTo, createdBy]
        })
    }
        const conversation = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [createdBy, sendTo],
                },
                group: { $exists: false },
            },
            projection: {
                messages: {$slice: -5}         

            }
        })
        console.log(conversation)
    io.to(await radisService.getSockets(createdBy)).emit("successMessage", {conversation})
    io.to(await radisService.getSockets(sendTo)).emit("newMessage", {conversation,from : socket.data.user })

    }


   join_room =  async (data: any, socket: Socket, io: Server) => {
        console.log({ data });
        const { roomId } = data        
        const chat = await this._chatRepo.findOne({
            filter: {
               roomId,
               participants: {
                    $in: [socket.data.user._id]
                },
               group: { $exists: true }
            }
    })

        if (!chat) {
        throw new AppError("chat not found", 404)
       }
        socket.join(chat?.roomId!)



    }


   sendGroupMessage =  async (data: any, socket: Socket, io: Server) => {
        console.log(data)
        const {content, groupId} = data
        const createdBy = socket.data.user._id
 
        // there is an exists chat 
        const chat = await this._chatRepo.findOneAndUpdate({ 
            filter: {
                _id: groupId,
                participants: {
                    $all: [createdBy]
                }, 
                group: {$exists: true}

        }, 
        update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
        }
        })

        if (!chat) {
            throw new AppError("chat not found",404 )
     }

     const conversation = await this._chatRepo.findOne({
    filter: {
        _id: groupId
    },
    projection: {
        messages: { $slice: -5 }
    },
    options: {
        populate: [
            {
                path: "messages.createdBy"
            }
        ]
    }
});
    io.to(await radisService.getSockets(createdBy)).emit("successMessage", {conversation})
    io.to(chat.roomId).emit("newMessage", {conversation,from : socket.data.user, groupId})

    }

}



export default new ChatService()