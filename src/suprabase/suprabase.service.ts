import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase;

  constructor() {
    if (process.env.SUBDOMAIN === 'app') {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
      );
    }
  }

  getClient() {
    return this.supabase;
  }
}
