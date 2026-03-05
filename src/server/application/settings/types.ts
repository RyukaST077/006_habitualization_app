export interface ProfileSettings {
  timezone: string;
  dayCutoffTime: string;
  version: number;
}

export interface UpdateProfileSettingsInput {
  timezone: string;
  dayCutoffTime: string;
  version: number;
}

export interface UpdateProfileSettingsResult extends ProfileSettings {
  saved: true;
  effectiveFrom: string;
}
