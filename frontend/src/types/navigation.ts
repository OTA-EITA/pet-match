// Navigation types for the app
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  PetList: undefined;
  PetDetail: { petId: string };
  Profile: undefined;
  ProfileEdit: undefined;
  Favorites: undefined;
  InquiryForm: { petId: string };
  InquiryHistory: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}