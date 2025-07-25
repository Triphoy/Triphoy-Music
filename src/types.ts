export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  social_links: {
    spotify?: string;
    youtube?: string;
    soundcloud?: string;
    apple_music?: string;
  } | null;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
}

export interface Track {
  id: number;
  title: string;
  plays: number;
  duration: string;
  liked: boolean;
}

export interface Playlist {
  id: number;
  title: string;
  tracks: number;
  image: string;
}