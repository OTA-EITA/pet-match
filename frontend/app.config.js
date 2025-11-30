export default {
  expo: {
    name: "OnlyCats",
    slug: "onlycats-app",
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android", "web"],
    ios: {
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      usesCleartextTraffic: true,
    },
    extra: {
      apiHost: process.env.EXPO_PUBLIC_API_HOST || "192.168.3.5",
      apiPort: process.env.EXPO_PUBLIC_API_PORT || "8080",
      productionApiUrl: process.env.EXPO_PUBLIC_PRODUCTION_API_URL || "https://api.onlycats.example.com/api",
    }
  }
};
