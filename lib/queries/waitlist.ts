import { supabase } from '../supabase';
import { ensureAnonSession } from '../auth';
import { WaitlistResult } from '../../types/waitlist';

export async function joinWaitlist(contact: string): Promise<WaitlistResult | null> {
  const ok = await ensureAnonSession();
  if (!ok) return null;

  const { data, error } = await supabase.rpc('join_waitlist', {
    p_contact: contact.trim(),
  });
  if (error) {
    console.error('Error joining waitlist:', error.message);
    return null;
  }
  return data as WaitlistResult;
}

export async function claimWaitlistBenefit(contact: string): Promise<boolean | null> {
  const ok = await ensureAnonSession();
  if (!ok) return null;

  const { data, error } = await supabase.rpc('claim_waitlist_benefit', {
    p_contact: contact.trim(),
  });
  if (error) {
    console.error('Error claiming waitlist benefit:', error.message);
    return null;
  }
  return data as boolean;
}
