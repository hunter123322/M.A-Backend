export type UserAut = {
  created_at?: string;
  user_id?: number;
  email: string;
  password: string;
  username: string
}

export type UserInfo = {
  user_id?: number;
  firstName: string;
  lastName: string;
  middleName: string;
  age: number;
}

export type UserLocation = {
  country: string;
  region: string;
  district: string;
  municipality: string;
  barangay: string;
  zone: string;
  house_number: string;
}

export type User = {
  id: number;
  username: string;
  avatarUrl: number;
};

export type UserProfile = {
  user_id: number;
  user_bio: string;
  user_follower: number;
  user_avatar: number;
  user_nickname: string;
  user_following: number
}