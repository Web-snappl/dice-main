import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static void _log(String message, {bool isError = false}) {
    if (kDebugMode) debugPrint('[ApiClient] $message');
  }
  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    // Default to production URL if not set in settings
    return prefs.getString('api_base_url') ?? 
        'https://dicep-production.up.railway.app';
  }

  static Future<Map<String, dynamic>> fetchFromBackend(
    String url,
    Map<String, String>? headers,
    String? body,
    String method,
  ) async {
    _log('[API Request] $method $url');
    
    try {
      final uri = Uri.parse(url);
      final request = http.Request(method, uri);
      
      if (headers != null) {
        request.headers.addAll(headers);
      }
      
      if (body != null) {
        request.body = body;
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      Map<String, dynamic> data;
      
      final contentType = response.headers['content-type'] ?? '';
      if (contentType.contains('application/json')) {
        data = json.decode(response.body) as Map<String, dynamic>;
      } else {
        if (response.statusCode == 404) {
          throw Exception('Endpoint not found (404): $url.');
        }
        throw Exception('Server Error (${response.statusCode}): ${response.body.substring(0, response.body.length > 50 ? 50 : response.body.length)}...');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        if (data['message'] is List) {
          throw Exception((data['message'] as List).first);
        }
        throw Exception(data['message'] ?? 'API Error: ${response.statusCode}');
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
}

class AuthApi {
  static Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
    String role = 'user',
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');

    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/auth/signup',
      {
        'Content-Type': 'application/json',
        'Authorization': 'dice_game_secret_key',
      },
      json.encode({
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': cleanPhone, // Send as string
        'role': role,
      }),
      'POST',
    );
  }

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    final baseUrl = await ApiClient.getBaseUrl();
    
    // Only clean if it looks like a phone number (all digits/dashes/pluses)
    // If it contains @, it's an email, don't clean.
    String cleanIdentifier = identifier.trim();
    if (!cleanIdentifier.contains('@')) {
      cleanIdentifier = cleanIdentifier.replaceAll(RegExp(r'\D'), '');
    }

    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/auth/login?phoneNumber=${Uri.encodeComponent(cleanIdentifier)}&password=${Uri.encodeComponent(password)}',
      {
        'Content-Type': 'application/json',
        'Authorization': 'dice_game_secret_key',
      },
      null,
      'GET',
    );
  }

  static Future<Map<String, dynamic>> forgotPassword({
    required String email,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    
    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/mailsender/forgotPassword',
      {
        'Content-Type': 'application/json',
        'Authorization': 'dice_game_secret_key',
      },
      json.encode({
        'email': email,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      }),
      'POST',
    );
  }

  static Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String password,
  }) async {
    final baseUrl = await ApiClient.getBaseUrl();
    
    return await ApiClient.fetchFromBackend(
      '$baseUrl/api/mailsender/resetPassword',
      {
        'Content-Type': 'application/json',
        'Authorization': 'dice_game_secret_key',
      },
      json.encode({
        'email': email,
        'password': password,
      }),
      'POST',
    );
  }
}

class GameApi {
  static Future<Map<String, dynamic>> getLiveUsers() async {
    final baseUrl = await ApiClient.getBaseUrl();
    try {
      return await ApiClient.fetchFromBackend(
        '$baseUrl/api/game/searchPlayers',
        {
          'Content-Type': 'application/json',
          'Authorization': 'dice_game_secret_key',
        },
        null,
        'GET',
      );
    } catch (e) {
      ApiClient._log('Live Users API Error: $e');
      return {'onlineUsers': []};
    }
  }

  static Future<List<dynamic>> rollDice(List<Map<String, String>> players) async {
    final baseUrl = await ApiClient.getBaseUrl();
    final response = await ApiClient.fetchFromBackend(
      '$baseUrl/api/game/rollDice',
      {
        'Content-Type': 'application/json',
        'Authorization': 'dice_game_secret_key',
      },
      json.encode(players),
      'POST',
    );
    
    if (response['data'] != null) {
      return response['data'] as List<dynamic>;
    }
    return response as List<dynamic>;
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
      {
        'Content-Type': 'application/json',
        'Authorization': 'dice_game_secret_key',
      },
      json.encode({
        'uid': uid,
        'displayName': displayName,
        'vip': vip,
        'amount': amount,
      }),
      'POST',
    );
  }

  static Future<List<dynamic>> getDepositHistory() async {
    final baseUrl = await ApiClient.getBaseUrl();
    try {
      final response = await ApiClient.fetchFromBackend(
        '$baseUrl/api/admin/depositHistory',
        {
          'Content-Type': 'application/json',
          'Authorization': 'dice_game_secret_key',
        },
        null,
        'GET',
      );
      
      if (response['data'] != null) {
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
        {
          'Content-Type': 'application/json',
          'Authorization': 'dice_game_secret_key',
        },
        null,
        'GET',
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
      {
        'Content-Type': 'application/json',
        'Authorization': 'dice_game_secret_key',
      },
      json.encode({
        'uid': uid,
        'displayName': displayName,
        'amount': amount.toString(),
        'mobileNumber': mobileNumber,
        'method': method,
      }),
      'POST',
    );
  }

  static Future<List<dynamic>> getWithdrawalHistory() async {
    final baseUrl = await ApiClient.getBaseUrl();
    try {
      final response = await ApiClient.fetchFromBackend(
        '$baseUrl/api/admin/withdrawHistory',
        {
          'Content-Type': 'application/json',
          'Authorization': 'dice_game_secret_key',
        },
        null,
        'GET',
      );
      
      return response as List<dynamic>;
    } catch (e) {
      ApiClient._log('Withdrawal History API failed: $e');
      return [];
    }
  }
}
