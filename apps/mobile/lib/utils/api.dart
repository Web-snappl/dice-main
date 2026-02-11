import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'secure_storage.dart';
import '../config/app_config.dart';

class ApiClient {
  static void _log(String message, {bool isError = false}) {
    if (kDebugMode) debugPrint('[ApiClient] $message');
  }

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    // Allow override from settings, otherwise use AppConfig
    final override = prefs.getString('api_base_url');
    if (override != null && override.isNotEmpty) {
      return override;
    }
    // Use platform-specific URL for development (iOS vs Android)
    if (AppConfig.isDevelopment) {
      try {
        return Platform.isIOS ? AppConfig.apiBaseUrlIos : AppConfig.apiBaseUrl;
      } catch (_) {
        return AppConfig.apiBaseUrl;
      }
    }
    return AppConfig.apiBaseUrl;
  }

  /// Make an authenticated API request with JWT token
  static Future<dynamic> fetchFromBackend(
    String url,
    Map<String, String>? headers,
    String? body,
    String method, {
    bool requiresAuth = false,
  }) async {
    _log('[API Request] $method $url');

    try {
      final uri = Uri.parse(url);
      final request = http.Request(method, uri);

      // Add default headers
      final requestHeaders = <String, String>{
        'Content-Type': 'application/json',
        ...?headers,
      };

      // Add auth token if required
      if (requiresAuth) {
        final token = await SecureStorage.getAccessToken();
        if (token != null && token.isNotEmpty) {
          requestHeaders['Authorization'] = 'Bearer $token';
        }
      }

      request.headers.addAll(requestHeaders);

      if (body != null) {
        request.body = body;
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      // Handle token expiry - attempt refresh
      if (response.statusCode == 401 && requiresAuth) {
        final refreshed = await _refreshToken();
        if (refreshed) {
          // Retry the request with new token
          return fetchFromBackend(url, headers, body, method, requiresAuth: true);
        }
        throw Exception('Session expired. Please login again.');
      }

      dynamic data;

      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('application/json')) {
        data = json.decode(response.body);
      } else {
        if (response.statusCode == 404) {
          throw Exception('Endpoint not found (404): $url.');
        }
        throw Exception(
            'Server Error (${response.statusCode}): ${response.body.substring(0, response.body.length > 50 ? 50 : response.body.length)}...');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        if (data is Map<String, dynamic>) {
           if (data['message'] is List) {
             throw Exception((data['message'] as List).first);
           }
           throw Exception(data['message'] ?? 'API Error: ${response.statusCode}');
        }
        throw Exception('API Error: ${response.statusCode}');
      }

      return data;
    } catch (e) {
      _log('[API Error] $e', isError: true);
      if (e.toString().contains('Failed host lookup') ||
          e.toString().contains('NetworkError') ||
          e.toString().contains('SocketException')) {
        throw Exception('Connection Failed: Could not reach backend.');
      }
      rethrow;
    }
  }

  /// Attempt to refresh the access token
  static Future<bool> _refreshToken() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }

      final baseUrl = await getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await SecureStorage.updateAccessToken(data['accessToken']);
        _log('Token refreshed successfully');
        return true;
      }
      return false;
    } catch (e) {
      _log('Token refresh failed: $e', isError: true);
      return false;
    }
  }
}

class AuthApi {
  /// Login and receive JWT tokens
  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    final baseUrl = await ApiClient.getBaseUrl();

    // Detect if it's an email or phone number
    String cleanIdentifier = identifier.trim();
    bool isEmail = cleanIdentifier.contains('@');
    
    String queryParam;
    if (isEmail) {
      // It's an email - send as email parameter
      // FORCE LOWERCASE: Key fix for mobile keyboard auto-capitalization
      cleanIdentifier = cleanIdentifier.toLowerCase();
      queryParam = 'email=${Uri.encodeComponent(cleanIdentifier)}';
    } else {
      // It's a phone number - clean and send as phoneNumber parameter
      cleanIdentifier = cleanIdentifier.replaceAll(RegExp(r'\D'), '');
      queryParam = 'phoneNumber=${Uri.encodeComponent(cleanIdentifier)}';
    }

    // FORCE LOWERCASE: Ensure case-insensitivity on login
    // String queryParam logic handles this above

    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/auth/login?$queryParam&password=${Uri.encodeComponent(password)}',
      null,
      null,
      'GET',
    );

    // Store tokens securely
    if (response is Map<String, dynamic> && response['accessToken'] != null) {
      await SecureStorage.saveTokens(
        accessToken: response['accessToken'],
        refreshToken: response['refreshToken'] ?? '',
        userId: response['user']?['uid'] ?? '',
      );
      return response;
    } else if (response is Map<String, dynamic>) {
        return response;
    }
     throw Exception('Invalid login response');
  }

  /// Register a new user and receive JWT tokens
  static Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
    String? promoCode,
    String role = 'user',
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');

    final body = {
      'email': email.trim().toLowerCase(),
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': cleanPhone,
      'role': role,
    };
    if (promoCode != null && promoCode.isNotEmpty) {
      body['promoCode'] = promoCode;
    }

    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/auth/public/signup',
      null,
      json.encode(body),
      'POST',
    );

     // Store tokens securely
    if (response is Map<String, dynamic> && response['accessToken'] != null) {
      await SecureStorage.saveTokens(
        accessToken: response['accessToken'],
        refreshToken: response['refreshToken'] ?? '',
        userId: response['user']?['uid'] ?? '',
      );
      return response;
    } else if (response is Map<String, dynamic>) {
        return response;
    }
    throw Exception('Invalid signup response');
  }

  /// Validate a promo code without using it (public, no auth)
  static Future<Map<String, dynamic>> validatePromoCode(String code) async {
    final baseUrl = await ApiClient.getBaseUrl();
    try {
      final response = await ApiClient.fetchFromBackend(
        '$baseUrl/api/auth/public/validate-promo/${Uri.encodeComponent(code.toUpperCase())}',
        null,
        null,
        'GET',
      );
      if (response is Map<String, dynamic>) return response;
      return {'valid': false, 'reason': 'Invalid response'};
    } catch (e) {
      return {'valid': false, 'reason': 'Network error'};
    }
  }

  /// Get current user profile (requires auth)
  static Future<Map<String, dynamic>> getMe() async {
    final baseUrl = await ApiClient.getBaseUrl();
    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/auth/me',
      null,
      null,
      'GET',
      requiresAuth: true,
    );
     if (response is Map<String, dynamic>) return response;
     throw Exception('Invalid user profile response');
  }

  /// Logout - clear tokens
  static Future<void> logout() async {
    await SecureStorage.clearAll();
  }

  static Future<Map<String, dynamic>> forgotPassword({
    required String email,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();

    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/mailsender/forgotPassword',
      null,
      json.encode({
        'email': email,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      }),
      'POST',
    );
     if (response is Map<String, dynamic>) return response;
     throw Exception('Invalid response');
  }

  static Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String password,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();

    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/mailsender/resetPassword',
      null,
      json.encode({
        'email': email,
        'password': password,
      }),
      'POST',
    );
    if (response is Map<String, dynamic>) return response;
    throw Exception('Invalid response');
  }
}

class GameApi {
  static Future<Map<String, dynamic>> getGameConfig(String gameId) async {
    final baseUrl = await ApiClient.getBaseUrl();
    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/game/config/$gameId',
      null,
      null,
      'GET',
      requiresAuth: true,
    );
     if (response is Map<String, dynamic>) return response;
    throw Exception('Invalid game config response');
  }

  static Future<Map<String, dynamic>> getLiveUsers() async {
    final baseUrl = await ApiClient.getBaseUrl();
    try {
      final response = await ApiClient.fetchFromBackend(
        '$baseUrl/api/game/searchPlayers',
        null,
        null,
        'GET',
        requiresAuth: true,
      );
       if (response is Map<String, dynamic>) return response;
       return {'onlineUsers': []};
    } catch (e) {
      ApiClient._log('Live Users API Error: $e');
      return {'onlineUsers': []};
    }
  }

  static Future<List<dynamic>> rollDice(
    List<Map<String, dynamic>> players, {
    String? gameId,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    final payload = players
        .map((player) => {
              ...player,
              if (gameId != null && gameId.isNotEmpty) 'gameId': gameId,
            })
        .toList();

    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/game/rollDice',
      null,
      json.encode(payload),
      'POST',
      requiresAuth: true,
    );

    if (response is Map<String, dynamic> && response['data'] != null) {
      return response['data'] as List<dynamic>;
    }
    if (response is List) {
      return response;
    }
    throw Exception('Unexpected response format');
  }
}

class AdminApi {
  static Future<Map<String, dynamic>> deposit({
    required String uid,
    required String displayName,
    required double amount,
    bool vip = false,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();

    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/admin/deposit',
      null,
      json.encode({
        'uid': uid,
        'displayName': displayName,
        'vip': vip,
        'amount': amount,
      }),
      'POST',
      requiresAuth: true,
    );
  }

  static Future<List<dynamic>> getDepositHistory() async {
    final baseUrl = await ApiClient.getBaseUrl();
    try {
      final response = await ApiClient.fetchFromBackend(
        '$baseUrl/api/admin/depositHistory',
        null,
        null,
        'GET',
        requiresAuth: true,
      );

      if (response is Map<String, dynamic> && response['data'] != null) {
        return response['data'] as List<dynamic>;
      }
      return response as List<dynamic>;
    } catch (e) {
      ApiClient._log('Deposit History API failed: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>> getProfitability({double commission = 5}) async {
    final baseUrl = await ApiClient.getBaseUrl();
    try {
      return await ApiClient.fetchFromBackend(
        '$baseUrl/api/admin/profitability?commission=$commission',
        null,
        null,
        'GET',
        requiresAuth: true,
      );
    } catch (e) {
      ApiClient._log('Profitability API failed: $e');
      return {
        'transactions': 0,
        'commission': 0,
        'totalProfit': 0,
        'depositHistory': [],
      };
    }
  }

  static Future<Map<String, dynamic>> requestWithdrawal({
    required String uid,
    required String displayName,
    required double amount,
    required String mobileNumber,
    required String method,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();

    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/admin/withdraw/request',
      null,
      json.encode({
        'uid': uid,
        'displayName': displayName,
        'amount': amount.toString(),
        'mobileNumber': mobileNumber,
        'method': method,
      }),
      'POST',
      requiresAuth: true,
    );
  }

}

class WalletApi {
  static Future<Map<String, dynamic>> createKkiapayDepositIntent({
    required double amount,
    String? phone,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/kkiapay/deposit-intent',
      null,
      json.encode({
        'amount': amount,
        if (phone != null && phone.isNotEmpty) 'phoneNumber': phone,
      }),
      'POST',
      requiresAuth: true,
    );
  }

  static Future<Map<String, dynamic>> initiateWithdrawal({
    required String phone,
    required double amount,
    String? requestId,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/kkiapay/withdraw',
      null,
      json.encode({
        'phoneNumber': phone,
        'amount': amount,
        if (requestId != null && requestId.isNotEmpty) 'requestId': requestId,
      }),
      'POST',
      requiresAuth: true,
    );
  }

  static Future<Map<String, dynamic>> verifyKkiapayTransaction({
    required String transactionId,
    required String referenceId,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/kkiapay/verify',
      null,
      json.encode({
        'transactionId': transactionId,
        'referenceId': referenceId,
      }),
      'POST',
      requiresAuth: true,
    );
  }

  static Future<Map<String, dynamic>> getKkiapayDepositStatus({
    required String referenceId,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/kkiapay/deposit-status/$referenceId',
      null,
      null,
      'GET',
      requiresAuth: true,
    );
  }
}
