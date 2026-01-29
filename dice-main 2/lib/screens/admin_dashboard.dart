import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/types.dart';
import '../utils/api.dart';
import '../widgets/neon_button.dart';

enum AdminTab { dashboard, users, wallet, settings }

class AdminDashboard extends StatefulWidget {
  final VoidCallback onLogout;
  final double commissionRate;
  final Function(double) setCommissionRate;
  final VoidCallback onEnterGame;
  final List<User> users;
  final Function(User) onUpdateUser;
  final Function(String) onDeleteUser;
  final List<Transaction> masterTransactions;
  final Function(Transaction) addTransaction;

  const AdminDashboard({
    super.key,
    required this.onLogout,
    required this.commissionRate,
    required this.setCommissionRate,
    required this.onEnterGame,
    required this.users,
    required this.onUpdateUser,
    required this.onDeleteUser,
    required this.masterTransactions,
    required this.addTransaction,
  });

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  AdminTab _activeTab = AdminTab.dashboard;
  double _tempCommission = 5.0;
  String? _savedMessage;
  List<User> _liveUsers = [];
  bool _isLoadingUsers = false;
  List<dynamic> _apiDeposits = [];
  Map<String, dynamic> _profitStats = {'transactions': 0, 'commission': 5, 'totalProfit': 0};
  String _searchTerm = '';
  User? _editingUser;
  User? _managingWalletUser;
  String _walletAmount = '';
  String _walletAction = 'DEPOSIT';

  @override
  void initState() {
    super.initState();
    _tempCommission = widget.commissionRate;
    _fetchData();
  }

  void _fetchData() {
    _fetchLivePlayers();
    if (_activeTab == AdminTab.wallet) _fetchWalletData();
    if (_activeTab == AdminTab.dashboard) _fetchProfitData();
  }

  Future<void> _fetchLivePlayers() async {
    setState(() => _isLoadingUsers = true);
    try {
      final result = await GameApi.getLiveUsers();
      final List<dynamic> players = (result['onlineUsers'] as List<dynamic>?) ?? [];
      
      final mappedPlayers = players.map((p) => User.fromJson({
        'uid': p['uid'] ?? p['id'],
        'displayName': p['displayName'] ?? p['name'] ?? 'Unknown',
        'email': p['email'] ?? '',
        'role': 'USER',
        'wallet': p['wallet'] ?? {'balance': p['balance'] ?? 0, 'totalDeposited': 0, 'totalWithdrawn': 0},
        'photoURL': p['photoURL'] ?? 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(p['displayName'] ?? 'User')}&background=random',
        'stats': p['stats'] ?? {'gamesPlayed': 0, 'gamesWon': 0, 'totalWagered': 0, 'totalWon': 0},
        'withdrawalLimits': {'countThisWeek': 0, 'lastWithdrawalDate': DateTime.now().toIso8601String()},
        'isBlocked': p['isBlocked'] ?? false,
      })).toList();

      setState(() => _liveUsers = mappedPlayers);
    } catch (e) {
      debugPrint('Failed to fetch live players: $e');
    } finally {
      setState(() => _isLoadingUsers = false);
    }
  }

  Future<void> _fetchWalletData() async {
    try {
      final history = await AdminApi.getDepositHistory();
      setState(() => _apiDeposits = history);
    } catch (e) {
      debugPrint('Failed to fetch deposit history: $e');
    }
  }

  Future<void> _fetchProfitData() async {
    try {
      final data = await AdminApi.getProfitability(commission: widget.commissionRate);
      setState(() {
        _profitStats = {
          'transactions': data['transactions'] ?? 0,
          'commission': data['commission'] ?? widget.commissionRate,
          'totalProfit': data['totalProfit'] ?? 0,
        };
      });
    } catch (e) {
      debugPrint('Failed to fetch profit: $e');
    }
  }

  void _handleSaveSettings() {
    widget.setCommissionRate(_tempCommission);
    setState(() {
      _savedMessage = 'Configuration Saved Successfully!';
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _savedMessage = null);
    });
  }

  void _handleDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete User'),
        content: const Text('Are you sure you want to delete this user permanently?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              widget.onDeleteUser(id);
              setState(() {
                _liveUsers = _liveUsers.where((u) => u.id != id).toList();
              });
              Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleWalletAdjustment() async {
    if (_managingWalletUser == null || _walletAmount.isEmpty) return;
    
    final amount = double.tryParse(_walletAmount) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid amount')),
      );
      return;
    }

    if (_walletAction == 'DEPOSIT') {
      try {
        await AdminApi.deposit(
          uid: _managingWalletUser!.id,
          displayName: _managingWalletUser!.name,
          amount: amount,
          vip: false,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Deposit Successful!')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Deposit Failed: $e')),
          );
        }
      }
    }

    final tx = Transaction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: _managingWalletUser!.id,
      userName: _managingWalletUser!.name,
      type: TransactionType.adminAdjustment,
      amount: _walletAction == 'DEPOSIT' ? amount : -amount,
      date: DateTime.now().toString(),
      status: TransactionStatus.success,
      method: 'ADMIN_CONSOLE',
      adminNote: 'Manual $_walletAction by Admin',
    );

    widget.addTransaction(tx);

    final updatedWallet = _managingWalletUser!.wallet.copyWith(
      balance: _walletAction == 'DEPOSIT'
          ? _managingWalletUser!.wallet.balance + amount
          : _managingWalletUser!.wallet.balance - amount,
    );

    final updatedUser = _managingWalletUser!.copyWith(wallet: updatedWallet);
    widget.onUpdateUser(updatedUser);
    
    setState(() {
      _liveUsers = _liveUsers.map((u) => u.id == updatedUser.id ? updatedUser : u).toList();
      _managingWalletUser = null;
      _walletAmount = '';
    });

    _fetchWalletData();
    _fetchProfitData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0C10),
      body: Row(
        children: [
          // Sidebar (Desktop)
          if (MediaQuery.of(context).size.width >= 768) _buildSidebar(),
          
          // Main Content
          Expanded(
            child: Column(
              children: [
                // Mobile Header
                if (MediaQuery.of(context).size.width < 768) _buildMobileHeader(),
                
                // Mobile Tabs
                if (MediaQuery.of(context).size.width < 768) _buildMobileTabs(),
                
                // Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: _buildContent(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 256,
      decoration: const BoxDecoration(
        color: Color(0xFF1F2833),
        border: Border(right: BorderSide(color: Colors.grey, width: 0.5)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(32),
            child: Text(
              'GROW ADMIN',
              style: GoogleFonts.orbitron(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildNavItem(AdminTab.dashboard, Icons.dashboard, 'Dashboard'),
                _buildNavItem(AdminTab.users, Icons.people, 'Online Players'),
                _buildNavItem(AdminTab.wallet, Icons.account_balance_wallet, 'Master Wallet'),
                _buildNavItem(AdminTab.settings, Icons.settings, 'Settings'),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildNavItem(AdminTab.dashboard, Icons.gamepad, 'Back to Game', isGameEntry: true),
                const SizedBox(height: 12),
                _buildNavItem(Screen.home as dynamic, Icons.logout, 'Logout', isLogout: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(dynamic tabOrScreen, IconData icon, String label, {bool isLogout = false, bool isGameEntry = false}) {
    final isActive = !isLogout && !isGameEntry && tabOrScreen is AdminTab && _activeTab == tabOrScreen;
    
    Color color = Colors.grey.shade400;
    if (isLogout) {
      color = Colors.red;
    } else if (isGameEntry) {
      color = const Color(0xFFFFD700); // Gold
    } else if (isActive) {
      color = const Color(0xFF66FCF1);
    }
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          if (isLogout) {
            widget.onLogout();
          } else if (isGameEntry) {
            widget.onEnterGame();
          } else if (tabOrScreen is AdminTab) {
            setState(() => _activeTab = tabOrScreen);
            _fetchData();
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF66FCF1).withValues(alpha: 0.1) : Colors.transparent,
            border: Border.all(
              color: isActive ? const Color(0xFF66FCF1).withValues(alpha: 0.5) : Colors.transparent,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 12),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMobileHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF1F2833),
        border: Border(bottom: BorderSide(color: Colors.grey, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Text(
              'GROW ADMIN',
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.orbitron(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.gamepad, color: Color(0xFFFFD700)),
                onPressed: widget.onEnterGame,
              ),
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.red),
                onPressed: widget.onLogout,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMobileTabs() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: const BoxDecoration(
        color: Color(0xFF1F2833),
        border: Border(bottom: BorderSide(color: Colors.grey, width: 0.5)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            SizedBox(
              width: MediaQuery.of(context).size.width / 3,
              child: _buildMobileTabButton('Overview', AdminTab.dashboard),
            ),
            SizedBox(
              width: MediaQuery.of(context).size.width / 3,
              child: _buildMobileTabButton('Master Wallet', AdminTab.wallet),
            ),
            SizedBox(
              width: MediaQuery.of(context).size.width / 3,
              child: _buildMobileTabButton('Users', AdminTab.users),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileTabButton(String label, AdminTab tab) {
    final isActive = _activeTab == tab;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          setState(() => _activeTab = tab);
          _fetchData();
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF66FCF1) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isActive ? Colors.black : Colors.grey.shade400,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_activeTab) {
      case AdminTab.dashboard:
        return _buildDashboardView();
      case AdminTab.users:
        return _buildUsersView();
      case AdminTab.wallet:
        return _buildWalletView();
      case AdminTab.settings:
        return _buildSettingsView();
    }
  }

  Widget _buildDashboardView() {
    final displayUsers = _liveUsers.isNotEmpty ? _liveUsers : widget.users;
    final activePlayersCount = displayUsers.length;
    final totalPlayerBalance = displayUsers.fold<double>(
      0,
      (sum, u) => sum + (u.wallet.balance),
    );

    final stats = [
      {
        'title': 'Online Players',
        'value': activePlayersCount.toString(),
        'icon': Icons.wifi,
        'color': const Color(0xFF66FCF1),
      },
      {
        'title': 'Total Deposits',
        'value': _apiDeposits.length.toString(),
        'icon': Icons.people,
        'color': Colors.blue,
      },
      {
        'title': 'Total Profit',
        'value': _formatCurrency(_profitStats['totalProfit'] ?? 0),
        'icon': Icons.trending_up,
        'color': Colors.purple,
      },
      {
        'title': 'Total Player Assets',
        'value': _formatCurrency(totalPlayerBalance),
        'icon': Icons.account_balance_wallet,
        'color': Colors.orange,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (MediaQuery.of(context).size.width >= 768) ...[
          Text(
            'Overview',
            style: GoogleFonts.orbitron(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 32),
        ],
        LayoutBuilder(
          builder: (context, constraints) {
            final crossAxisCount = constraints.maxWidth > 1200 ? 4 : (constraints.maxWidth > 800 ? 2 : 1);
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossAxisCount,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                mainAxisExtent: 180, // Increased further to prevent overflow
              ),
              itemCount: stats.length,
              itemBuilder: (context, index) {
                final stat = stats[index];
                return Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F2833),
                    border: Border.all(color: Colors.grey.shade800),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.4),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(stat['icon'] as IconData, color: stat['color'] as Color, size: 18),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Live',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          stat['title'] as String,
                          style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          stat['value'] as String,
                          style: GoogleFonts.rajdhani(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: index == 0 ? const Color(0xFF66FCF1) : Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
        
        // Edit User Modal
        if (_editingUser != null) _buildEditUserModal(),
        
        // Manage Wallet Modal
        if (_managingWalletUser != null) _buildManageWalletModal(),
      ],
    );
  }

  Widget _buildUsersView() {
    final displayUsers = _liveUsers.isNotEmpty ? _liveUsers : widget.users;
    final filteredUsers = displayUsers.where((u) {
      final search = _searchTerm.toLowerCase();
      return u.name.toLowerCase().contains(search) || u.email.toLowerCase().contains(search);
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.people, color: Color(0xFF66FCF1), size: 20),
            const SizedBox(width: 8),
            Text(
              'Online Players',
              style: GoogleFonts.orbitron(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            if (_isLoadingUsers) ...[
              const SizedBox(width: 8),
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ],
          ],
        ),
        const SizedBox(height: 24),
        
        // Search Bar
        TextField(
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Search name or email...',
            hintStyle: TextStyle(color: Colors.grey.shade600),
            prefixIcon: const Icon(Icons.search, color: Colors.grey),
            filled: true,
            fillColor: Colors.black.withValues(alpha: 0.3),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade700),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade700),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF66FCF1)),
            ),
          ),
          onChanged: (value) => setState(() => _searchTerm = value),
        ),
        
        const SizedBox(height: 24),
        
        // Users Table
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1F2833),
            border: Border.all(color: Colors.grey.shade800),
            borderRadius: BorderRadius.circular(16),
          ),
          child: filteredUsers.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text(
                    'No users found or no one is online.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredUsers.length,
                  itemBuilder: (context, index) {
                    final user = filteredUsers[index];
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: Colors.grey.shade800,
                            width: index < filteredUsers.length - 1 ? 1 : 0,
                          ),
                        ),
                      ),
                      child: Row(
                        children: [
                          // Avatar
                          Stack(
                            children: [
                              CircleAvatar(
                                backgroundImage: NetworkImage(user.avatarUrl),
                                radius: 20,
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: Colors.green,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: const Color(0xFF1F2833), width: 2),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          
                          // User Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user.name,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  user.email,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          
                          const SizedBox(width: 8),

                          // Balance & Actions
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    '${user.wallet.balance.toInt()} CFA',
                                    style: GoogleFonts.rajdhani(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF66FCF1),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(Icons.account_balance_wallet, size: 16),
                                      color: Colors.green,
                                      onPressed: () => setState(() => _managingWalletUser = user),
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(Icons.edit, size: 16),
                                      color: Colors.white,
                                      onPressed: () => setState(() => _editingUser = user),
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(Icons.delete, size: 16),
                                      color: Colors.red,
                                      onPressed: () => _handleDelete(user.id),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildWalletView() {
    final displayUsers = _liveUsers.isNotEmpty ? _liveUsers : widget.users;
    final totalPlayerBalance = displayUsers.fold<double>(
      0,
      (sum, u) => sum + u.wallet.balance,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.trending_up, color: Color(0xFF66FCF1), size: 20),
            const SizedBox(width: 8),
            Text(
              'Deposit History (API)',
              style: GoogleFonts.orbitron(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        
        // Summary Cards
        LayoutBuilder(
          builder: (context, constraints) {
            final isMobile = constraints.maxWidth < 600;
            return isMobile 
              ? Column(
                  children: [
                    _buildSummaryCard('Liquidity', totalPlayerBalance, Icons.account_balance_wallet, Colors.blue),
                    const SizedBox(height: 16),
                    _buildSummaryCard('Revenue', _profitStats['totalProfit'], Icons.attach_money, const Color(0xFFFFD700)),
                  ],
                )
              : Row(
                  children: [
                    Expanded(child: _buildSummaryCard('Liquidity', totalPlayerBalance, Icons.account_balance_wallet, Colors.blue)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildSummaryCard('Revenue', _profitStats['totalProfit'], Icons.attach_money, const Color(0xFFFFD700))),
                  ],
                );
          },
        ),
        
        const SizedBox(height: 24),
        
        // Deposit History Table
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1F2833),
            border: Border.all(color: Colors.grey.shade800),
            borderRadius: BorderRadius.circular(16),
          ),
          child: _apiDeposits.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text(
                    'No deposit history found.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _apiDeposits.length,
                  itemBuilder: (context, index) {
                    final tx = _apiDeposits[index];
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: Colors.grey.shade800,
                            width: index < _apiDeposits.length - 1 ? 1 : 0,
                          ),
                        ),
                      ),
                      child: Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          SizedBox(
                            width: 120,
                            child: Text(
                              tx['timestamp'] != null
                                  ? DateTime.parse(tx['timestamp']).toString().substring(0, 16)
                                  : 'N/A',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                    fontFamily: 'monospace',
                                  ),
                            ),
                          ),
                          SizedBox(
                            width: 150,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tx['displayName'] ?? 'Unknown',
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  tx['uid'] ?? '',
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'DEPOSIT',
                                  style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                '${tx['amount'] ?? 0}',
                                style: GoogleFonts.rajdhani(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildSettingsView() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2833),
        border: Border.all(color: Colors.grey.shade800),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.settings, color: Color(0xFF66FCF1), size: 20),
              const SizedBox(width: 8),
              Text(
                'System Configuration',
                style: GoogleFonts.orbitron(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          
          if (_savedMessage != null) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                border: Border.all(color: Colors.green),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check, color: Colors.green),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _savedMessage!,
                      style: GoogleFonts.poppins(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          const SizedBox(height: 32),
          
          Text(
            'Commission Rate (%)',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Slider(
                  value: _tempCommission,
                  min: 0,
                  max: 20,
                  divisions: 20,
                  label: '${_tempCommission.toInt()}%',
                  activeColor: const Color(0xFF66FCF1),
                  onChanged: (value) => setState(() => _tempCommission = value),
                ),
              ),
              Text(
                '${_tempCommission.toInt()}%',
                style: GoogleFonts.rajdhani(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF66FCF1),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.withValues(alpha: 0.1),
              border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info, color: Colors.blue, size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'What is Commission?',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade200,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'The percentage taken by the "House" from the total pot in multiplayer games.\n\nExample: If 2 players bet 1000 (Total Pot 2000) and commission is 5%, the House takes 100, and the Winner gets 1900.',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          NeonButton(
            fullWidth: true,
            onPressed: _handleSaveSettings,
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.save, size: 18),
                SizedBox(width: 8),
                Text('SAVE CONFIG'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditUserModal() {
    if (_editingUser == null) return const SizedBox();
    
    return Container(
      color: Colors.black.withValues(alpha: 0.8),
      child: Center(
        child: SingleChildScrollView(
          child: Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF151a21),
              border: Border.all(color: Colors.grey.shade700),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Edit User',
                    style: GoogleFonts.orbitron(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => setState(() => _editingUser = null),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextField(
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Name',
                  labelStyle: GoogleFonts.poppins(color: Colors.grey, fontSize: 12),
                  filled: true,
                  fillColor: Colors.black.withValues(alpha: 0.4),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade700),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade700),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF66FCF1)),
                  ),
                ),
                controller: TextEditingController(text: _editingUser!.name),
                onChanged: (value) {
                  _editingUser = _editingUser!.copyWith(name: value);
                },
              ),
              const SizedBox(height: 24),
              NeonButton(
                fullWidth: true,
                onPressed: () {
                  if (_editingUser != null) {
                    widget.onUpdateUser(_editingUser!);
                    setState(() {
                      _liveUsers = _liveUsers.map((u) => u.id == _editingUser!.id ? _editingUser! : u).toList();
                      _editingUser = null;
                    });
                  }
                },
                child: const Text('SAVE CHANGES'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

  Widget _buildManageWalletModal() {
    if (_managingWalletUser == null) return const SizedBox();
    
    return Container(
      color: Colors.black.withValues(alpha: 0.8),
      child: Center(
        child: SingleChildScrollView(
          child: Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF151a21),
              border: Border.all(color: Colors.grey.shade700),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Manage Wallet: ${_managingWalletUser!.name}',
                      style: GoogleFonts.orbitron(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => setState(() {
                      _managingWalletUser = null;
                      _walletAmount = '';
                    }),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  border: Border.all(color: Colors.grey.shade800),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      'Current Balance',
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: Colors.grey,
                        letterSpacing: 1.5,
                      ),
                    ),
                    Text(
                      '${_managingWalletUser!.wallet.balance.toInt()} CFA',
                      style: GoogleFonts.rajdhani(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF66FCF1),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Material(
                      color: _walletAction == 'DEPOSIT' ? Colors.green : Colors.grey.shade800,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        onTap: () => setState(() => _walletAction = 'DEPOSIT'),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(
                            'ADD FUNDS',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _walletAction == 'DEPOSIT' ? Colors.black : Colors.grey.shade400,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Material(
                      color: _walletAction == 'WITHDRAW' ? Colors.red : Colors.grey.shade800,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        onTap: () => setState(() => _walletAction = 'WITHDRAW'),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text(
                            'DEDUCT FUNDS',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _walletAction == 'WITHDRAW' ? Colors.white : Colors.grey.shade400,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextField(
                style: const TextStyle(color: Colors.white),
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Amount (CFA)',
                  labelStyle: GoogleFonts.poppins(color: Colors.grey, fontSize: 12),
                  filled: true,
                  fillColor: Colors.black.withValues(alpha: 0.4),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade700),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade700),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF66FCF1)),
                  ),
                ),
                controller: TextEditingController(text: _walletAmount),
                onChanged: (value) => _walletAmount = value,
              ),
              const SizedBox(height: 24),
              NeonButton(
                fullWidth: true,
                variant: _walletAction == 'DEPOSIT' ? NeonButtonVariant.primary : NeonButtonVariant.danger,
                onPressed: _handleWalletAdjustment,
                child: Text('CONFIRM $_walletAction'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

  String _formatCurrency(dynamic value) {
    if (value == null) return '0 CFA';
    final num val = value is num ? value : (double.tryParse(value.toString()) ?? 0);
    return '${val.toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    )} CFA';
  }

  Widget _buildSummaryCard(String label, dynamic value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1F2833), Colors.black],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: Colors.grey.shade800),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                label.toUpperCase(),
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              _formatCurrency(value),
              style: GoogleFonts.rajdhani(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: (label.toLowerCase().contains('revenue') && (value is num && value < 0)) ? Colors.red : Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
