import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PlanType } from "@/lib/types";
import { isSummerMonth } from "@/constants/electricity-plans";

interface SettingsState {
  planType: PlanType;
  location: string;
  householdSize: number;
  isSummer: boolean;
}

const initialState: SettingsState = {
  planType: "residential",
  location: "高雄",
  householdSize: 3,
  isSummer: isSummerMonth(),
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setPlanType(state, action: PayloadAction<PlanType>) {
      state.planType = action.payload;
    },
    setLocation(state, action: PayloadAction<string>) {
      state.location = action.payload;
    },
    setHouseholdSize(state, action: PayloadAction<number>) {
      state.householdSize = action.payload;
    },
    setIsSummer(state, action: PayloadAction<boolean>) {
      state.isSummer = action.payload;
    },
  },
});

export const { setPlanType, setLocation, setHouseholdSize, setIsSummer } =
  settingsSlice.actions;
