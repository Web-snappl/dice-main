/// Environment configuration for the mobile app
/// 
/// To switch between environments, change the [currentEnvironment] value.
/// For production builds, ensure [currentEnvironment] is set to [Environment.production].
class AppConfig {
  static const Environment currentEnvironment = Environment.development;
  
  static String get apiBaseUrl {
    switch (currentEnvironment) {
      case Environment.development:
        return 'http://10.0.2.2:3000'; // Android emulator localhost
      case Environment.staging:
        return 'https://staging-api.yourdomain.com';
      case Environment.production:
        return 'https://api-production-6de9.up.railway.app';
    }
  }
  
  /// iOS simulator uses localhost directly
  static String get apiBaseUrlIos {
    switch (currentEnvironment) {
      case Environment.development:
        return 'http://localhost:3000';
      case Environment.staging:
        return 'https://staging-api.yourdomain.com';
      case Environment.production:
        return 'https://api-production-6de9.up.railway.app';
    }
  }
  
  static bool get isProduction => currentEnvironment == Environment.production;
  static bool get isDevelopment => currentEnvironment == Environment.development;
}

enum Environment {
  development,
  staging,
  production,
}
