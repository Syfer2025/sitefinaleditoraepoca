import { supabase } from "./supabaseClient";

export interface TrackingSettings {
  ga4_id: string;
  google_ads_id: string;
  search_console_id: string;
  merchant_center_id: string;
  merchant_verification_id: string;
  business_name: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  business_phone: string;
  business_hours: string;
}

const SETTINGS_KEY = "tracking_settings";

export async function getTrackingSettings(): Promise<Partial<TrackingSettings>> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .single();

    if (!data?.value) return {};
    return JSON.parse(data.value) as TrackingSettings;
  } catch {
    return {};
  }
}

export async function saveTrackingSettings(settings: Partial<TrackingSettings>): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: SETTINGS_KEY, value: JSON.stringify(settings), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) throw new Error(error.message);
}
