// Navigation types for the app
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  PetList: undefined;
  PetDetail: { petId: string };
  Profile: undefined;
  Favorites: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}