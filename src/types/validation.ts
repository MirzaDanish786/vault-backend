import {z} from "zod"
export interface IValidateReturn<T>{
    success: boolean;
    data?: T;
    errors?: z.ZodError
}