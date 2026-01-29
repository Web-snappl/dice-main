
enum Screen {
  login,
  register,
  home,
  game,
  wallet,
  profile,
  history,
  admin,
  diceTable,
}

enum UserRole {
  user,
  admin,
}

enum GameResult {
  win,
  loss,
  draw,
}

enum TransactionType {
  deposit,
  withdraw,
  gameWin,
  gameBet,
  gameRefund,
  adminAdjustment,
}

enum TransactionStatus {
  success,
  pending,
  failed,
}

class UserWallet {
  final double balance;
  final double totalDeposited;
  final double totalWithdrawn;

  UserWallet({
    required this.balance,
    required this.totalDeposited,
    required this.totalWithdrawn,
  });

  factory UserWallet.fromJson(Map<String, dynamic> json) {
    return UserWallet(
      balance: (json['balance'] ?? 0).toDouble(),
      totalDeposited: (json['totalDeposited'] ?? 0).toDouble(),
      totalWithdrawn: (json['totalWithdrawn'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'balance': balance,
      'totalDeposited': totalDeposited,
      'totalWithdrawn': totalWithdrawn,
    };
  }

  UserWallet copyWith({
    double? balance,
    double? totalDeposited,
    double? totalWithdrawn,
  }) {
    return UserWallet(
      balance: balance ?? this.balance,
      totalDeposited: totalDeposited ?? this.totalDeposited,
      totalWithdrawn: totalWithdrawn ?? this.totalWithdrawn,
    );
  }
}

class UserStats {
  final int gamesPlayed;
  final int gamesWon;
  final double totalWagered;
  final double totalWon;

  UserStats({
    required this.gamesPlayed,
    required this.gamesWon,
    required this.totalWagered,
    required this.totalWon,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      gamesPlayed: json['gamesPlayed'] ?? 0,
      gamesWon: json['gamesWon'] ?? 0,
      totalWagered: (json['totalWagered'] ?? 0).toDouble(),
      totalWon: (json['totalWon'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gamesPlayed': gamesPlayed,
      'gamesWon': gamesWon,
      'totalWagered': totalWagered,
      'totalWon': totalWon,
    };
  }

  UserStats copyWith({
    int? gamesPlayed,
    int? gamesWon,
    double? totalWagered,
    double? totalWon,
  }) {
    return UserStats(
      gamesPlayed: gamesPlayed ?? this.gamesPlayed,
      gamesWon: gamesWon ?? this.gamesWon,
      totalWagered: totalWagered ?? this.totalWagered,
      totalWon: totalWon ?? this.totalWon,
    );
  }
}

class WithdrawalLimits {
  final int countThisWeek;
  final String lastWithdrawalDate;

  WithdrawalLimits({
    required this.countThisWeek,
    required this.lastWithdrawalDate,
  });

  factory WithdrawalLimits.fromJson(Map<String, dynamic> json) {
    return WithdrawalLimits(
      countThisWeek: json['countThisWeek'] ?? 0,
      lastWithdrawalDate: json['lastWithdrawalDate'] ?? DateTime.now().toIso8601String(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'countThisWeek': countThisWeek,
      'lastWithdrawalDate': lastWithdrawalDate,
    };
  }

  WithdrawalLimits copyWith({
    int? countThisWeek,
    String? lastWithdrawalDate,
  }) {
    return WithdrawalLimits(
      countThisWeek: countThisWeek ?? this.countThisWeek,
      lastWithdrawalDate: lastWithdrawalDate ?? this.lastWithdrawalDate,
    );
  }
}

class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? password;
  final UserWallet wallet;
  final String avatarUrl;
  final UserRole role;
  final bool? isBlocked;
  final UserStats stats;
  final WithdrawalLimits withdrawalLimits;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.password,
    required this.wallet,
    required this.avatarUrl,
    UserRole? role,
    this.isBlocked,
    required this.stats,
    required this.withdrawalLimits,
  }) : role = role ?? UserRole.user;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['uid'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      name: json['name'] ?? json['displayName'] ?? 'Unknown User',
      email: json['email'] ?? '',
      phone: json['phone'] ?? json['phoneNumber'],
      password: json['password'],
      wallet: json['wallet'] != null 
          ? UserWallet.fromJson(json['wallet'])
          : UserWallet(balance: json['balance']?.toDouble() ?? 0, totalDeposited: 0, totalWithdrawn: 0),
      avatarUrl: json['avatarUrl'] ?? 
          json['photoURL'] ?? 
          'https://ui-avatars.com/api/?name=${Uri.encodeComponent(json['displayName'] ?? 'User')}&background=random',
      role: json['role'] != null 
          ? (json['role'].toString().toUpperCase() == 'ADMIN' ? UserRole.admin : UserRole.user)
          : UserRole.user,
      isBlocked: json['isBlocked'],
      stats: json['stats'] != null ? UserStats.fromJson(json['stats']) : UserStats(gamesPlayed: 0, gamesWon: 0, totalWagered: 0, totalWon: 0),
      withdrawalLimits: json['withdrawalLimits'] != null 
          ? WithdrawalLimits.fromJson(json['withdrawalLimits'])
          : WithdrawalLimits(countThisWeek: 0, lastWithdrawalDate: DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'wallet': wallet.toJson(),
      'avatarUrl': avatarUrl,
      'role': role.name.toUpperCase(),
      'isBlocked': isBlocked,
      'stats': stats.toJson(),
      'withdrawalLimits': withdrawalLimits.toJson(),
    };
  }

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? password,
    UserWallet? wallet,
    String? avatarUrl,
    UserRole? role,
    bool? isBlocked,
    UserStats? stats,
    WithdrawalLimits? withdrawalLimits,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      password: password ?? this.password,
      wallet: wallet ?? this.wallet,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role ?? this.role,
      isBlocked: isBlocked ?? this.isBlocked,
      stats: stats ?? this.stats,
      withdrawalLimits: withdrawalLimits ?? this.withdrawalLimits,
    );
  }
}

class GameRecord {
  final String id;
  final String date;
  final double betAmount;
  final int userScore;
  final int opponentScore;
  final GameResult result;

  GameRecord({
    required this.id,
    required this.date,
    required this.betAmount,
    required this.userScore,
    required this.opponentScore,
    required this.result,
  });

  factory GameRecord.fromJson(Map<String, dynamic> json) {
    return GameRecord(
      id: json['id'],
      date: json['date'],
      betAmount: (json['betAmount'] ?? 0).toDouble(),
      userScore: json['userScore'] ?? 0,
      opponentScore: json['opponentScore'] ?? 0,
      result: GameResult.values.firstWhere(
        (e) => e.name.toUpperCase() == json['result'].toString().toUpperCase(),
        orElse: () => GameResult.draw,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date,
      'betAmount': betAmount,
      'userScore': userScore,
      'opponentScore': opponentScore,
      'result': result.name.toUpperCase(),
    };
  }
}

class Transaction {
  final String id;
  final String userId;
  final String userName;
  final TransactionType type;
  final double amount;
  final String date;
  final TransactionStatus status;
  final String method;
  final String? accountNumber;
  final String? adminNote;

  Transaction({
    required this.id,
    required this.userId,
    required this.userName,
    required this.type,
    required this.amount,
    required this.date,
    required this.status,
    required this.method,
    this.accountNumber,
    this.adminNote,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      type: TransactionType.values.firstWhere(
        (e) => e.name.toUpperCase() == json['type'].toString().toUpperCase().replaceAll('_', ''),
        orElse: () => TransactionType.deposit,
      ),
      amount: (json['amount'] ?? 0).toDouble(),
      date: json['date'],
      status: TransactionStatus.values.firstWhere(
        (e) => e.name.toUpperCase() == json['status'].toString().toUpperCase(),
        orElse: () => TransactionStatus.pending,
      ),
      method: json['method'] ?? 'Unknown',
      accountNumber: json['accountNumber'],
      adminNote: json['adminNote'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'type': type.name.toUpperCase(),
      'amount': amount,
      'date': date,
      'status': status.name.toUpperCase(),
      'method': method,
      'accountNumber': accountNumber,
      'adminNote': adminNote,
    };
  }
}
