export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          kind: string
          occurred_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          kind: string
          occurred_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          kind?: string
          occurred_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_movements: {
        Row: {
          amount: number
          created_at: string
          id: string
          movement_role: string
          transaction_id: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          movement_role: string
          transaction_id: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          movement_role?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          institution: string | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      wallet_balances: {
        Row: {
          archived_at: string | null
          balance: string
          created_at: string
          institution: string | null
          name: string
          type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Relationships: []
      }
      wallet_opening_balances: {
        Row: {
          movement_id: string
          occurred_at: string
          opening_balance: string
          transaction_id: string
          user_id: string
          wallet_id: string
        }
        Relationships: []
      }
    }
    Functions: {
      archive_wallet: {
        Args: { p_wallet_id: string }
        Returns: undefined
      }
      create_wallet: {
        Args: {
          p_institution?: string | null
          p_name: string
          p_opening_balance?: number
          p_wallet_type: string
        }
        Returns: string
      }
      restore_wallet: {
        Args: { p_wallet_id: string }
        Returns: undefined
      }
      update_wallet_opening_balance: {
        Args: { p_opening_balance: number; p_wallet_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
