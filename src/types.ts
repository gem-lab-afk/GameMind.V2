export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  platforms?: string[];
  genres?: string[];
  app_goal?: string;
  created_at: string;
  level?: number;
  current_xp?: number;
  equipped_avatar_frame?: string;
  equipped_title?: string;
  unlocked_rewards?: string[];
  is_leaderboard_on?: boolean;
}

export interface Session {
  id: string;
  user_id?: string;
  session_name: string;
  games_played: string[];
  planned_mins: number;
  actual_seconds: number;
  baseline_mood: number;
  satisfaction: number;
  duration_perception: number;
  end_mood: number;
  control_score: number;
  diary_entry: string;
  analyzer_tip: string;
  created_at: string;
  // Legacy compatibility fields for older rows/schemas
  game_name?: string;
  tags?: string[];
}

export interface SessionUser {
  id: string;
  email?: string;
}

export type AppTab = 'dashboard' | 'logs' | 'settings';

export interface TabChangeDetail {
  detail?: AppTab;
}
