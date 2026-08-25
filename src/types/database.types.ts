// This file is a safe fallback until `npm run db:types` is run against a linked
// Supabase project. Keep the generated file here once the remote schema is available.
export type UserRole = "resident" | "hoa_official" | "service_provider" | "admin";
export type PostType = "post" | "announcement" | "service" | "help_request" | "poll" | "initiative" | "event" | "official_news" | "official_poll" | "fundraiser";
export type InitiativeStage = "proposal" | "discussion" | "voting" | "hoa_review" | "approved" | "fundraising" | "implementation" | "completed" | "rejected";
export type TerritoryType = "entrance" | "building" | "complex";

type Row = Record<string, any>;
type Table = { Row: Row; Insert: Row; Update: Row; Relationships: [] };
type PostRow = Row & { type: PostType; territory: TerritoryType };
type InitiativeRow = Row & { stage: InitiativeStage };

type TableNames =
  | "complexes" | "buildings" | "entrances" | "apartments" | "profiles"
  | "posts" | "post_attachments" | "comments" | "reactions" | "polls"
  | "poll_options" | "poll_votes" | "initiatives" | "initiative_supports"
  | "fundraisers" | "fundraiser_payments" | "chats" | "chat_members" | "messages"
  | "notifications" | "verification_requests" | "classifieds" | "service_providers";

type Tables = { [K in TableNames]: Table } & {
  posts: { Row: PostRow; Insert: Row; Update: Row; Relationships: [] };
  initiatives: { Row: InitiativeRow; Insert: Row; Update: Row; Relationships: [] };
};

export type Database = {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      post_type: PostType;
      initiative_stage: InitiativeStage;
      territory_type: TerritoryType;
    };
    CompositeTypes: Record<string, never>;
  };
};
