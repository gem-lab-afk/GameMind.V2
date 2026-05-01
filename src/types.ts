export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id?: string;
  game_name: string;
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
}
