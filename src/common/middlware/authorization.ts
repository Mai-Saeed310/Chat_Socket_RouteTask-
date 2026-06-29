import { AppError } from "../utiliti/global-error-handling";




export const authorization = async (roles: string[] = [], role: string) => {
  if (!roles.includes(role)) {
        throw new AppError("unAuthorized");
    }
}