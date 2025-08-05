// Navigation types for the app
export type RootStackParamList = {
  PetList: undefined;
  PetDetail: { petId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}