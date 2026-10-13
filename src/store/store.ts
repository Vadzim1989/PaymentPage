import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PaymentState {
  cardRegistrationTypePayment: boolean;
  registrationSber: boolean;
  invoiceData: unknown | null;
  errorMessage: string;
  deviceFingerprint: string | null;
  isOpenApiMirPaySupported: boolean;
  isPayBySavedCard: boolean;
  pageConfig: unknown | null;
  bankLogo: string | null;
  showFooterBank: boolean;
  showHeaderBank: boolean;
}

const initialState: PaymentState = {
  cardRegistrationTypePayment: false,
  registrationSber: false,
  invoiceData: null,
  errorMessage: '',
  deviceFingerprint: null,
  isOpenApiMirPaySupported: true,
  isPayBySavedCard: false,
  pageConfig: null,
  bankLogo: null,
  showFooterBank: false,
  showHeaderBank: false,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    changeCardRegistrationType(state, action: PayloadAction<boolean>) {
      state.cardRegistrationTypePayment = action.payload;
    },

    changeRegistrationSber(state, action: PayloadAction<boolean>) {
      state.registrationSber = action.payload;
    },

    setInvoiceData(state, action: PayloadAction<unknown | null>) {
      state.invoiceData = action.payload;
    },

    setErrorMessage(state, action: PayloadAction<string>) {
      state.errorMessage = action.payload;
    },

    setDeviceFingerprint(state, action: PayloadAction<string | null>) {
      state.deviceFingerprint = action.payload;
    },

    setIsOpenApiMirPaySupported(state, action: PayloadAction<boolean>) {
      state.isOpenApiMirPaySupported = action.payload;
    },

    setIsPayBySavedCard(state, action: PayloadAction<boolean>) {
      state.isPayBySavedCard = action.payload;
    },

    setPageConfig(state, action: PayloadAction<unknown | null>) {
      state.pageConfig = action.payload;
    },

    setBankLogo(state, action: PayloadAction<string | null>) {
      state.bankLogo = action.payload;
    },

    setShowFooterBank(state, action: PayloadAction<boolean>) {
      state.showFooterBank = action.payload;
    },

    setShowHeaderBank(state, action: PayloadAction<boolean>) {
      state.showHeaderBank = action.payload;
    },
  },
});

export const {
  changeCardRegistrationType,
  changeRegistrationSber,
  setInvoiceData,
  setErrorMessage,
  setDeviceFingerprint,
  setIsOpenApiMirPaySupported,
  setIsPayBySavedCard,
  setPageConfig,
  setBankLogo,
  setShowFooterBank,
  setShowHeaderBank,
} = paymentSlice.actions;

export const store = configureStore({
  reducer: {
    payment: paymentSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;