/// Environment configuration for the mobile app
/// 
/// To switch between environments, change the [currentEnvironment] value.
/// For production builds, ensure [currentEnvironment] is set to [Environment.production].
class AppConfig {
  static const Environment currentEnvironment = Environment.development;
  
  static String get apiBaseUrl {
    switch (currentEnvironment) {
      case Environment.development:
        return 'https://api-production-6de9.up.railway.app'; // Use Production API for testing logic
      case Environment.staging:
        return 'https://staging-api.yourdomain.com';
      case Environment.production:
        return 'https://api-production-6de9.up.railway.app';
    }
  }
  
  /// Optional iOS-specific API URL override
  static String get apiBaseUrlIos {
    switch (currentEnvironment) {
      case Environment.development:
        return 'https://api-production-6de9.up.railway.app';
      case Environment.staging:
        return 'https://staging-api.yourdomain.com';
      case Environment.production:
        return 'https://api-production-6de9.up.railway.app';
    }
  }
  
  static bool get isProduction => currentEnvironment == Environment.production;
  static bool get isDevelopment => currentEnvironment == Environment.development;

  static String get kkiapayApiKey {
    switch (currentEnvironment) {
      case Environment.development:
        return '1dee80d003c011f183fa9d968bd8511b'; // Public Test Key
      case Environment.staging:
      case Environment.production:
        return '1dee80d003c011f183fa9d968bd8511b'; // Replace with Live Public Key if different
    }
  }

  static bool get kkiapaySandbox => isDevelopment;
}

enum Environment {
  development,
  staging,
  production,
}
