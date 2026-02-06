import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice";
import authReducer from "./slices/authSlice";
import equipmentReducer from "./slices/equipmentSlice";
import eventReducer from "./slices/eventSlice";
import dashboardReducer from "./slices/dashboardSlice";
import formReducer from "./slices/formSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    equipment: equipmentReducer,
    events: eventReducer,
    dashboard: dashboardReducer,
    form: formReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
