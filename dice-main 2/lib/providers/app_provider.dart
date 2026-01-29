import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/types.dart';
import '../utils/api.dart';

class AppProvider extends ChangeNotifier {
  Screen _currentScreen = Screen.login;
  bool _isAuthenticated = false;
  bool _isAdmin = false;
  bool _isOnline = true;
  bool _isLoading = true;
  
  double _betAmount = 500;
  int _playerCount = 2;
  double _commissionRate = 5.0;
  String _language = 'Français';
  
  User? _currentUser;
  List<User> _registeredUsers = [];
  List<GameRecord> _history = [];
  List<Transaction> _transactions = [];

  Screen get currentScreen => _currentScreen;
  bool get isAuthenticated => _isAuthenticated;
  bool get isAdmin => _isAdmin;
  bool get isOnline => _isOnline;
  bool get isLoading => _isLoading;
  double get betAmount => _betAmount;
  int get playerCount => _playerCount;
  double get commissionRate => _commissionRate;
  String get language => _language;
  User? get currentUser => _currentUser;
  List<User> get registeredUsers => _registeredUsers;
  List<GameRecord> get history => _history;
  List<Transaction> get transactions => _transactions;

  Future<void> initialize() async {
    // Just load local data and proceed immediately to prevent black screen blocking
    try {
      final prefs = await SharedPreferences.getInstance();
      _language = prefs.getString('app_language') ?? 'Français';
      
      final usersJson = prefs.getString('app_users_v3');
      if (usersJson != null) {
        final List<dynamic> decoded = json.decode(usersJson);
        _registeredUsers = decoded.map((item) => User.fromJson(item)).toList();
      }
      
      final transactionsJson = prefs.getString('app_transactions');
      if (transactionsJson != null) {
        final List<dynamic> decoded = json.decode(transactionsJson);
        _transactions = decoded.map((item) => Transaction.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error loading persisted data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadPersistedData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _language = prefs.getString('app_language') ?? 'Français';
      
      final usersJson = prefs.getString('app_users_v3');
      if (usersJson != null) {
        final List<dynamic> decoded = json.decode(usersJson);
        _registeredUsers = decoded.map((item) => User.fromJson(item)).toList();
      }
      
      final transactionsJson = prefs.getString('app_transactions');
      if (transactionsJson != null) {
        final List<dynamic> decoded = json.decode(transactionsJson);
        _transactions = decoded.map((item) => Transaction.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error loading persisted data: $e');
    }
  }

  void setScreen(Screen screen) {
    _currentScreen = screen;
    notifyListeners();
  }

  void setBetAmount(double amount) {
    _betAmount = amount;
    notifyListeners();
  }

  void setPlayerCount(int count) {
    _playerCount = count;
    notifyListeners();
  }

  void setCommissionRate(double rate) {
    _commissionRate = rate;
    notifyListeners();
  }

  void setLanguage(String lang) {
    _language = lang;
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('app_language', lang);
    });
    notifyListeners();
  }

  void setCurrentUser(User user) {
    debugPrint('📝 setCurrentUser called with: ${user.name} (${user.id})');
    _currentUser = user;
    _persistUser(user);
    debugPrint('✅ _currentUser is now: ${_currentUser?.name ?? "NULL"}');
    notifyListeners();
    debugPrint('🔔 Listeners notified');
  }

  void setOnline(bool online) {
    _isOnline = online;
    notifyListeners();
  }

  void toggleOnlineStatus() {
    setOnline(!_isOnline);
  }

  Future<void> _persistUser(User user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final users = _registeredUsers.where((u) => u.id != user.id).toList();
      users.add(user);
      _registeredUsers = users;
      await prefs.setString('app_users_v3', _usersToJson(users));
    } catch (e) {
      debugPrint('Error persisting user: $e');
    }
  }

  String _usersToJson(List<User> users) {
    return json.encode(users.map((u) => u.toJson()).toList());
  }

  Future<bool> handleLogin(String identifier, String password) async {
    debugPrint('🔐 LOGIN ATTEMPT: identifier=$identifier');
    
    try {
      if (_isOnline) {
        try {
          debugPrint('🌐 Attempting API login...');
          final response = await AuthApi.login(identifier, password);
          final userData = response['data'] ?? response;
          
          debugPrint('📦 API Response received: ${userData != null ? "SUCCESS" : "NULL"}');
          
          if (userData != null) {
            final user = _mapApiUserToState(userData);
            debugPrint('👤 User mapped: ${user.name} (${user.id})');
            
            if (user.isBlocked == true) {
              throw Exception('Account is blocked. Contact support.');
            }

            // Restore wallet/stats from local cache
            final localUser = _registeredUsers.firstWhere(
              (u) => u.id == user.id || u.email == user.email,
              orElse: () => user,
            );
            
            final finalUser = User(
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              password: user.password,
              wallet: localUser.wallet,
              avatarUrl: user.avatarUrl,
              role: user.role,
              isBlocked: user.isBlocked,
              stats: localUser.stats,
              withdrawalLimits: user.withdrawalLimits,
            );

            debugPrint('✅ Final user created: ${finalUser.name}');
            debugPrint('💰 Balance: ${finalUser.wallet.balance}');
            
            setCurrentUser(finalUser);
            _isAuthenticated = true;
            _isAdmin = finalUser.role == UserRole.admin;
            
            debugPrint('🎯 Setting screen to: ${_isAdmin ? "ADMIN" : "HOME"}');
            debugPrint('📊 Current user after set: ${_currentUser?.name ?? "NULL"}');
            
            setScreen(_isAdmin ? Screen.admin : Screen.home);
            
            debugPrint('✅ LOGIN SUCCESSFUL!');
            return true;
          }
        } catch (e) {
          debugPrint('❌ API Login failed: $e');
          if (e.toString().contains('Invalid') || e.toString().contains('password')) {
            rethrow;
          }
          debugPrint('⚠️ Falling back to local login...');
        }
      }

      // Local login fallback
      debugPrint('🔍 Searching local users...');
      debugPrint('📋 Registered users count: ${_registeredUsers.length}');
      
      final localUser = _registeredUsers.firstWhere(
        (u) => (u.name == identifier || u.email == identifier || u.phone == identifier) &&
               (u.password == password),
      );

      debugPrint('👤 Local user found: ${localUser.name}');
      
      if (localUser.isBlocked == true) {
        throw Exception('Account is blocked.');
      }

      setCurrentUser(localUser);
      _isAuthenticated = true;
      _isAdmin = localUser.role == UserRole.admin;
      
      debugPrint('🎯 Setting screen to: ${_isAdmin ? "ADMIN" : "HOME"}');
      debugPrint('📊 Current user after set: ${_currentUser?.name ?? "NULL"}');
      
      setScreen(_isAdmin ? Screen.admin : Screen.home);
      
      debugPrint('✅ LOCAL LOGIN SUCCESSFUL!');
      return true;
    } catch (e) {
      debugPrint('❌ LOGIN ERROR: $e');
      rethrow;
    }
  }

  Future<bool> handleForgotPassword({
    required String email,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      await AuthApi.forgotPassword(
        email: email,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      return true;
    } catch (e) {
      debugPrint('Forgot Password Error: $e');
      rethrow;
    }
  }

  Future<bool> handleRegister(Map<String, dynamic> userData) async {
    try {
      if (_isOnline) {
        final response = await AuthApi.signup(
          email: userData['email'],
          password: userData['password'],
          firstName: userData['firstName'],
          lastName: userData['lastName'],
          phone: userData['phone'],
        );
        
        final apiUser = response['data'] ?? response;
        if (apiUser != null) {
          final user = _mapApiUserToState(apiUser);
          setCurrentUser(user);
          _isAuthenticated = true;
          _isAdmin = user.role == UserRole.admin;
          setScreen(_isAdmin ? Screen.admin : Screen.home);
          return true;
        }
      }

      // Local fallback if offline
      final user = _mapApiUserToState(userData);
      setCurrentUser(user);
      _isAuthenticated = true;
      _isAdmin = user.role == UserRole.admin;
      setScreen(_isAdmin ? Screen.admin : Screen.home);
      return true;
    } catch (e) {
      debugPrint('Register Error: $e');
      rethrow;
    }
  }

  User _mapApiUserToState(Map<String, dynamic> apiData) {
    return User(
      id: apiData['uid'] ?? apiData['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      name: apiData['displayName'] ?? apiData['name'] ?? 'Unknown User',
      email: apiData['email'] ?? '',
      phone: apiData['phone'] ?? apiData['phoneNumber'],
      password: apiData['password'],
      wallet: apiData['wallet'] != null
          ? UserWallet.fromJson(apiData['wallet'])
          : UserWallet(
              balance: (apiData['balance'] ?? 0).toDouble(),
              totalDeposited: 0,
              totalWithdrawn: 0,
            ),
      avatarUrl: apiData['photoURL'] ??
          'https://ui-avatars.com/api/?name=${Uri.encodeComponent(apiData['displayName'] ?? 'User')}&background=random',
      role: apiData['role'] != null
          ? (apiData['role'].toString().toUpperCase() == 'ADMIN'
              ? UserRole.admin
              : UserRole.user)
          : UserRole.user,
      isBlocked: apiData['isBlocked'] ?? false,
      stats: apiData['stats'] != null
          ? UserStats.fromJson(apiData['stats'])
          : UserStats(gamesPlayed: 0, gamesWon: 0, totalWagered: 0, totalWon: 0),
      withdrawalLimits: apiData['withdrawalLimits'] != null
          ? WithdrawalLimits.fromJson(apiData['withdrawalLimits'])
          : WithdrawalLimits(
              countThisWeek: 0,
              lastWithdrawalDate: DateTime.now().toIso8601String(),
            ),
    );
  }

  void addHistory(GameRecord record) {
    _history = [record, ..._history];
    notifyListeners();
  }

  void addTransaction(Transaction transaction) {
    _transactions = [transaction, ..._transactions];
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('app_transactions', json.encode(_transactions.map((t) => t.toJson()).toList()));
    });
    notifyListeners();
  }

  void updateRegisteredUser(User user) {
    _registeredUsers = _registeredUsers.map((u) => u.id == user.id ? user : u).toList();
    _persistUser(user);
    notifyListeners();
  }

  void deleteUser(String id) {
    _registeredUsers = _registeredUsers.where((u) => u.id != id).toList();
    if (_currentUser?.id == id) {
      logout();
    } else {
      notifyListeners();
      _persistAllUsers();
    }
  }

  Future<void> _persistAllUsers() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_users_v3', _usersToJson(_registeredUsers));
    } catch (e) {
      debugPrint('Error persisting users: $e');
    }
  }

  void logout() {
    _isAuthenticated = false;
    _isAdmin = false;
    _currentUser = null;
    setScreen(Screen.login);
  }
}
