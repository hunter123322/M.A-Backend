import { User } from "./User.type";

export type JWTPayload = {
  user_id: number;
  email?: string;
  username: string;
  author?: User
}