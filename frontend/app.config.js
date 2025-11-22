export default {
  expo: {
    name: "OnlyCats",
    slug: "onlycats-app",
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android"],
    extra: {
      apiHost: process.env.EXPO_PUBLIC_API_HOST || "192.168.3.22",
      apiPort: process.env.EXPO_PUBLIC_API_PORT || "18081",
      productionApiUrl: process.env.EXPO_PUBLIC_PRODUCTION_API_URL || "https://api.onlycats.example.com/api",
    }
  }
};
