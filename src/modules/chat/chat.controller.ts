import { authentication } from './../../common/middlware/authentication';
import { Router } from "express";
import chatService from "./chat.service";
import multerCloud from '../../common/middlware/multer.cloud';
import { store_enum } from '../../common/enum/multer.enum';

const chatRouter = Router({mergeParams:true});

chatRouter.get("/",authentication ,chatService.getChat)
chatRouter.post("/create-group",authentication ,multerCloud({ store_type: store_enum.memory }).single("attachment"),chatService.createGroup)
chatRouter.get("/group/:groupId",authentication ,chatService.getGroupChat)

export default chatRouter