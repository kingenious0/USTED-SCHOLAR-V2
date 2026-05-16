import { supabase } from './supabase';

export async function sendWelcomeSMS(phoneNumber: string, name: string) {
  if (!phoneNumber) return;

  try {
    // We call our SECURE backend function instead of Wigal directly
    const { data, error } = await supabase.functions.invoke('send-welcome-sms', {
      body: { 
        phone: phoneNumber, 
        name: name 
      }
    });

    if (error) throw error;
    console.log('📬 Secure SMS Triggered:', data);
    return data;
  } catch (error) {
    console.error('❌ Secure SMS Failed:', error);
  }
}
