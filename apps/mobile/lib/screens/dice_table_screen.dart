import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import '../widgets/dice_widget.dart';
import '../widgets/app_button.dart';
import '../utils/app_theme.dart';
import '../models/types.dart';
import '../utils/i18n.dart';
import '../utils/audio.dart';
import '../utils/api.dart';

class DiceTableScreen extends StatefulWidget {
  final User user;
  final Function(User) setUser;
  final Function(Screen) setScreen;
  final Function(GameRecord) addHistory;
  final bool isOnline;
  final String language;

  const DiceTableScreen({
    super.key,
    required this.user,
    required this.setUser,
    required this.setScreen,
    required this.addHistory,
    this.isOnline = true,
    this.language = 'English',
  });

  @override
  State<DiceTableScreen> createState() => _DiceTableScreenState();
}

class _DiceTableScreenState extends State<DiceTableScreen> {
  Map<int, double> _bets = {}; // {number: betAmount}
  int? _activeMenuNum;
  String _betMode = 'STD'; // STD or VIP
  String _customBetInput = '';
  int _diceValue = 1;
  String _gameState = 'IDLE'; // IDLE, ROLLING, RESULT
  Map<String, dynamic>? _resultMessage;
  bool _isMuted = false;
  bool _showLowBalanceModal = false;
  bool _showNoBetModal = false;
  bool _localFallback = false;
  int? _hoveredNum;
  int? _hoveredBetAmount;
  bool _isMouseInMenu = false;
  Timer? _menuSwitchTimer;
  final List<LayerLink> _layerLinks = List.generate(6, (index) => LayerLink());

  static const List<int> _betOptionsStd = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  static const List<int> _betOptionsVip = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
  static const int _multiplier = 5;

  String t(String key) => I18n.translate(key, widget.language);

  double get _totalBet {
    return _bets.values.fold<double>(0, (sum, amount) => sum + amount);
  }

  @override
  void initState() {
    super.initState();
    _isMuted = AudioManager().isMuted();
  }

  @override
  void dispose() {
    _menuSwitchTimer?.cancel();
    super.dispose();
  }

  Future<void> _toggleMute() async {
    final muted = await AudioManager().toggleMute();
    setState(() {
      _isMuted = muted;
    });
  }

  void _handleReset() {
    AudioManager().play(SoundType.click);
    setState(() {
      _gameState = 'IDLE';
      _bets = {};
      _resultMessage = null;
      _activeMenuNum = null;
      _menuSwitchTimer?.cancel();
      _isMouseInMenu = false;
    });
  }

  Future<void> _handleRoll() async {
    setState(() => _activeMenuNum = null);
    if (widget.user.wallet.balance <= 0) {
      AudioManager().play(SoundType.loss);
      setState(() => _showLowBalanceModal = true);
      return;
    }

    if (_totalBet == 0) {
      AudioManager().play(SoundType.loss);
      setState(() => _showNoBetModal = true);
      return;
    }

    if (widget.user.wallet.balance < _totalBet) {
      AudioManager().play(SoundType.loss);
      setState(() => _showLowBalanceModal = true);
      return;
    }

    // Deduct funds
    widget.setUser(widget.user.copyWith(
      wallet: widget.user.wallet.copyWith(
        balance: widget.user.wallet.balance - _totalBet,
      ),
      stats: widget.user.stats.copyWith(
        gamesPlayed: widget.user.stats.gamesPlayed + 1,
        totalWagered: widget.user.stats.totalWagered + _totalBet,
      ),
    ));

    setState(() {
      _gameState = 'ROLLING';
      _activeMenuNum = null;
      _menuSwitchTimer?.cancel();
      _isMouseInMenu = false;
    });

    // Fetch from API if online
    int finalValue = 1;
    if (widget.isOnline && !_localFallback && _bets.keys.length < 6) {
      try {
        final playersPayload = [
          {
            'uid': widget.user.id, 
            'displayName': widget.user.name,
            'betAmount': _totalBet
          },
          {'uid': 'dealer-bot', 'displayName': 'Dealer'},
        ];
        final apiResponse = await GameApi.rollDice(playersPayload);
        
        if (apiResponse.isNotEmpty) {
          final myResult = apiResponse.firstWhere(
            (r) => r['uid'] == widget.user.id,
            orElse: () => {},
          );
          if (myResult['rollDiceResult'] != null) {
            finalValue = myResult['rollDiceResult'] as int;
          } else {
            setState(() => _localFallback = true);
            finalValue = Random().nextInt(6) + 1;
          }
        } else {
          finalValue = Random().nextInt(6) + 1;
        }
      } catch (e) {
        debugPrint('API Roll Failed: $e');
        setState(() => _localFallback = true);
        finalValue = Random().nextInt(6) + 1;
      }
    } else {
      finalValue = Random().nextInt(6) + 1;
    }

    // Perform rolling animation with changing numbers
  final random = Random();
  int currentRollValue = _diceValue;
  for (int i = 0; i < 15; i++) {
    await Future.delayed(const Duration(milliseconds: 100));
    
    // Play rolling sound every 4 cycles to keep it continuous
    if (i % 4 == 0) {
      AudioManager().play(SoundType.roll);
    }

    setState(() {
        int nextValue;
        do {
          nextValue = random.nextInt(6) + 1;
        } while (nextValue == currentRollValue); // Ensure it looks like it's changing
        currentRollValue = nextValue;
        _diceValue = currentRollValue;
      });
    }

    // House edge: if all 6 numbers covered, force 1
    if (_bets.keys.length == 6) {
      finalValue = 1;
    }

    _finalizeRoll(finalValue);
  }

  void _finalizeRoll(int finalValue) {
    setState(() {
      _diceValue = finalValue;
      _gameState = 'RESULT';
    });

    final isHouseWin = finalValue == 1;
    final winningBetAmount = _bets[finalValue] ?? 0;
    final isWin = !isHouseWin && winningBetAmount > 0;
    final winAmount = winningBetAmount * _multiplier;

    if (isWin) {
      AudioManager().play(SoundType.win);
      setState(() {
        _resultMessage = {
          'text': '${t('Win Caps')} +${winAmount.toInt()}',
          'type': 'WIN',
        };
      });
    } else {
      AudioManager().play(SoundType.loss);
      setState(() {
        _resultMessage = {
          'text': isHouseWin ? t('House Wins Specific') : t('Loss Caps'),
          'type': 'LOSS',
        };
      });
    }

    widget.setUser(widget.user.copyWith(
      wallet: widget.user.wallet.copyWith(
        balance: widget.user.wallet.balance + (isWin ? winAmount : 0),
      ),
      stats: widget.user.stats.copyWith(
        gamesWon: isWin ? widget.user.stats.gamesWon + 1 : widget.user.stats.gamesWon,
        totalWon: widget.user.stats.totalWon + (isWin ? winAmount : 0),
      ),
    ));

    widget.addHistory(GameRecord(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      date: TimeOfDay.now().format(context),
      betAmount: _totalBet,
      userScore: 0,
      opponentScore: finalValue,
      result: isWin ? GameResult.win : GameResult.loss,
    ));
  }

  void _handleSelectBet(int num, double amount) {
    setState(() {
      _bets[num] = amount;
      _activeMenuNum = null;
    });
    AudioManager().play(SoundType.click);
  }

  void _handleCustomSubmit(int num) {
    final val = double.tryParse(_customBetInput);
    if (val != null && val > 0) {
      _handleSelectBet(num, val);
      setState(() => _customBetInput = '');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SafeArea(
          child: Column(
            children: [
              // Top Bar
              Container(
                height: 60,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: const BoxDecoration(
                  color: AppColors.background,
                  border: Border(bottom: BorderSide(color: Colors.grey, width: 0.5)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left, color: Colors.grey),
                      onPressed: () => widget.setScreen(Screen.home),
                    ),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          t('Balance Caps'),
                          style: AppTextStyles.label(
                            fontSize: 9,
                            color: Colors.grey,
                            letterSpacing: 2,
                          ),
                        ),
                        Text(
                          widget.user.wallet.balance.toInt().toString().replaceAllMapped(
                                RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                                (Match m) => '${m[1]},',
                              ),
                          style: AppTextStyles.digital(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: Icon(_isMuted ? Icons.volume_off : Icons.volume_up, color: Colors.grey, size: 24),
                      onPressed: _toggleMute,
                    ),
                  ],
                ),
              ),

              // Game Area
              Expanded(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Background

                    // Background
                    Container(
                      color: AppColors.background,
                    ),

                    // Content Column
                    Column(
                      children: [
                        // Scrollable Main Board
                        Expanded(
                          child: SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 180),
                            child: Column(
                              children: [
                                const SizedBox(height: 12),

                                // Dice Container
                                Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: AppColors.border),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.3),
                                        blurRadius: 15,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                  child: DiceWidget(
                                    value: _diceValue,
                                    isRolling: _gameState == 'ROLLING',
                                    color: _gameState == 'RESULT' && _resultMessage?['type'] == 'WIN'
                                        ? DiceColor.gold
                                        : DiceColor.primary,
                                    size: DiceSize.md,
                                  ),
                                ),

                                // Result Feedback
                                if (_gameState == 'RESULT' && _resultMessage != null) ...[
                                  const SizedBox(height: 16),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: _resultMessage!['type'] == 'WIN'
                                          ? AppColors.gold.withOpacity(0.1)
                                          : AppColors.danger.withOpacity(0.1),
                                      border: Border.all(
                                        color: _resultMessage!['type'] == 'WIN'
                                            ? AppColors.gold
                                            : AppColors.danger,
                                        width: 1,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _resultMessage!['text'],
                                      style: AppTextStyles.title(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: _resultMessage!['type'] == 'WIN'
                                            ? AppColors.gold
                                            : AppColors.danger,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 32),

                                // Number Grid
                                Center(
                                  child: Container(
                                    clipBehavior: Clip.none,
                                    constraints: const BoxConstraints(maxWidth: 400),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(24),
                                      border: Border.all(color: AppColors.border),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.2),
                                          blurRadius: 30,
                                          offset: const Offset(0, 10),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      children: [
                                        Container(
                                          clipBehavior: Clip.none,
                                          decoration: BoxDecoration(
                                            color: AppColors.background,
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: Container(
                                            clipBehavior: Clip.none,
                                            padding: const EdgeInsets.symmetric(horizontal: 4),
                                            child: GridView.builder(
                                              clipBehavior: Clip.none,
                                              shrinkWrap: true,
                                              physics: const NeverScrollableScrollPhysics(),
                                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                                crossAxisCount: 3,
                                                childAspectRatio: 1.0,
                                                crossAxisSpacing: 8,
                                                mainAxisSpacing: 8,
                                              ),
                                              itemCount: 6,
                                              itemBuilder: (context, index) {
                                                final num = index + 1;
                                                final myBet = _bets[num];
                                                final isSelected = myBet != null;
                                                final isWinningNum = _gameState == 'RESULT' && _diceValue == num;

                                                return CompositedTransformTarget(
                                                  link: _layerLinks[index],
                                                  child: MouseRegion(
                                                    onEnter: (_) {
                                                      setState(() {
                                                        _hoveredNum = num;
                                                        if (_gameState == 'IDLE' && _activeMenuNum != num) {
                                                          _menuSwitchTimer?.cancel();
                                                          _activeMenuNum = num;
                                                          _isMouseInMenu = true;
                                                        }
                                                      });
                                                    },
                                                    onExit: (_) {
                                                      setState(() => _hoveredNum = null);
                                                      _menuSwitchTimer?.cancel();
                                                      _menuSwitchTimer = Timer(const Duration(milliseconds: 300), () {
                                                        if (mounted && !_isMouseInMenu) {
                                                          setState(() => _activeMenuNum = null);
                                                        }
                                                      });
                                                    },
                                                    child: Stack(
                                                      clipBehavior: Clip.none,
                                                      children: [
                                                        GestureDetector(
                                                          onTap: _gameState == 'IDLE'
                                                              ? () {
                                                                  _menuSwitchTimer?.cancel();
                                                                  if (_activeMenuNum != num) {
                                                                    setState(() {
                                                                      _activeMenuNum = num;
                                                                      _isMouseInMenu = true;
                                                                    });
                                                                    AudioManager().play(SoundType.click);
                                                                  }
                                                                }
                                                              : null,
                                                          child: Container(
                                                            decoration: BoxDecoration(
                                                              color: isWinningNum 
                                                                  ? AppColors.gold
                                                                  : isSelected 
                                                                      ? AppColors.primary
                                                                      : (_hoveredNum == num)
                                                                          ? AppColors.surface.withOpacity(0.8)
                                                                          : AppColors.background,
                                                              border: Border.all(
                                                                color: isWinningNum || isSelected 
                                                                    ? Colors.transparent 
                                                                    : AppColors.border,
                                                                width: 1,
                                                              ),
                                                              borderRadius: BorderRadius.circular(16),
                                                              boxShadow: isSelected || isWinningNum ? [
                                                                BoxShadow(
                                                                  color: (isWinningNum ? AppColors.gold : AppColors.primary).withOpacity(0.3),
                                                                  blurRadius: 12,
                                                                  offset: const Offset(0, 4),
                                                                )
                                                              ] : null,
                                                            ),
                                                            child: Center(
                                                              child: Text(
                                                                '$num',
                                                                style: AppTextStyles.display(
                                                                  fontSize: 48, 
                                                                  fontWeight: FontWeight.bold,
                                                                  color: isWinningNum 
                                                                      ? Colors.black 
                                                                      : isSelected 
                                                                          ? Colors.black 
                                                                          : Colors.white,
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                        ),
                                                        if (isSelected)
                                                          Positioned(
                                                            top: 8,
                                                            right: 8,
                                                            child: Container(
                                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                              decoration: BoxDecoration(
                                                                color: Colors.black.withOpacity(0.4),
                                                                borderRadius: BorderRadius.circular(4),
                                                              ),
                                                              child: Text(
                                                                myBet.toInt().toString(),
                                                                style: AppTextStyles.digital(
                                                                  fontSize: 10,
                                                                  fontWeight: FontWeight.bold,
                                                                  color: Colors.white,
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                      ],
                                                    ),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.touch_app, size: 12, color: AppColors.textMuted),
                                    const SizedBox(width: 4),
                                    Text(
                                      t('Hover Hint'),
                                      style: AppTextStyles.label(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textMuted,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Control Panel (Fixed at Bottom)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            border: Border(top: BorderSide(color: AppColors.border, width: 1)),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.background,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          t('Total Wager'),
                                          style: AppTextStyles.label(
                                            fontSize: 10,
                                            color: AppColors.textMuted,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${_totalBet.toInt()} Coins',
                                          style: AppTextStyles.digital(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                            color: _totalBet > 0 ? AppColors.primary : Colors.white,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 16),

                              if (_gameState == 'RESULT')
                                AppButton(
                                  fullWidth: true,
                                  variant: ButtonVariant.secondary,
                                  onPressed: _handleReset,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.refresh, size: 20),
                                      const SizedBox(width: 8),
                                      Text(t('Try Again'), style: const TextStyle(fontSize: 16)),
                                    ],
                                  ),
                                )
                              else
                                AppButton(
                                  fullWidth: true,
                                  variant: ButtonVariant.primary,
                                  onPressed: _gameState == 'ROLLING' ? null : _handleRoll,
                                  disabled: _gameState == 'ROLLING',
                                  size: ButtonSize.lg, // Equivalent to padding: const EdgeInsets.symmetric(vertical: 14)
                                  child: _gameState == 'ROLLING'
                                      ? Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            const SizedBox(
                                              width: 18,
                                              height: 18,
                                              child: CircularProgressIndicator(strokeWidth: 2),
                                            ),
                                            const SizedBox(width: 12),
                                            Text(t('Rolling Caps')),
                                          ],
                                        )
                                      : Text(t('Start Game Caps'), style: const TextStyle(fontSize: 16)),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    // Floating Overlay
                    if (_activeMenuNum != null && _gameState == 'IDLE' && _activeMenuNum! > 0 && _activeMenuNum! <= 6)
                      Positioned.fill(
                        child: GestureDetector(
                          behavior: HitTestBehavior.translucent,
                          onTap: () => setState(() => _activeMenuNum = null),
                          child: Stack(
                            children: [
                               CompositedTransformFollower(
                                 link: _layerLinks[_activeMenuNum! - 1],
                                 showWhenUnlinked: false,
                                 offset: Offset(
                                   ((_activeMenuNum! - 1) % 3 == 0) ? 0 : 
                                   ((_activeMenuNum! - 1) % 3 == 2) ? -100 : -50, 
                                   -10 
                                 ),
                                 child: MouseRegion(
                                   onEnter: (_) {
                                       _menuSwitchTimer?.cancel();
                                       setState(() => _isMouseInMenu = true);
                                     },
                                     onExit: (_) {
                                       setState(() => _isMouseInMenu = false);
                                     },
                                     child: GestureDetector(
                                       behavior: HitTestBehavior.opaque,
                                       onTap: () {}, 
                                       child: Column(
                                         mainAxisSize: MainAxisSize.min,
                                         children: [
                                           // Reduced bridge height for better proximity
                                           Container(
                                             height: 40,
                                             width: 220,
                                             color: Colors.transparent,
                                           ),
                                           _buildBettingMenu(_activeMenuNum!),
                                         ],
                                       ),
                                     ),
                                   ),
                                 ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Global Modals
        if (_showLowBalanceModal) _buildLowBalanceModal(),
        if (_showNoBetModal) _buildNoBetModal(),
      ],
    );
  }

  Widget _buildBettingMenu(int num) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Triangle Pointer (Pointing Up)
        Container(
          width: 0,
          height: 0,
          decoration: BoxDecoration(
            border: Border(
              left: const BorderSide(color: Colors.transparent, width: 6),
              right: const BorderSide(color: Colors.transparent, width: 6),
              bottom: BorderSide(color: AppColors.border, width: 8),
            ),
          ),
        ),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              width: 220,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.surface.withOpacity(0.95),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.8),
                    blurRadius: 30,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Mode Toggle
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _betMode = 'STD'),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              decoration: BoxDecoration(
                                color: _betMode == 'STD'
                                    ? AppColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: _betMode == 'STD' ? [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.5),
                                    blurRadius: 10,
                                  )
                                ] : null,
                              ),
                              child: Center(
                                child: Text(
                                  'STD',
                                  style: AppTextStyles.digital(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: _betMode == 'STD' ? Colors.black : Colors.grey.shade500,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _betMode = 'VIP'),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              decoration: BoxDecoration(
                                color: _betMode == 'VIP'
                                    ? AppColors.gold
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: _betMode == 'VIP' ? [
                                  BoxShadow(
                                    color: AppColors.gold.withOpacity(0.5),
                                    blurRadius: 10,
                                  )
                                ] : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.workspace_premium, size: 10, color: _betMode == 'VIP' ? Colors.black : Colors.grey.shade500),
                                  const SizedBox(width: 4),
                                  Text(
                                    'VIP',
                                    style: AppTextStyles.digital(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: _betMode == 'VIP' ? Colors.black : Colors.grey.shade500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Options Grid
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 6,
                      mainAxisSpacing: 6,
                      childAspectRatio: 2.5,
                    ),
                    itemCount: (_betMode == 'STD' ? _betOptionsStd : _betOptionsVip).length,
                    itemBuilder: (context, index) {
                      final amount = (_betMode == 'STD' ? _betOptionsStd : _betOptionsVip)[index];
                      final isVip = _betMode == 'VIP';
                      final isHovered = _hoveredBetAmount == amount;
                      
                      return MouseRegion(
                        onEnter: (_) => setState(() => _hoveredBetAmount = amount),
                        onExit: (_) => setState(() => _hoveredBetAmount = null),
                        child: GestureDetector(
                          onTap: () => _handleSelectBet(num, amount.toDouble()),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            decoration: BoxDecoration(
                              color: isHovered 
                                  ? (isVip ? AppColors.gold.withOpacity(0.3) : AppColors.primary.withOpacity(0.2))
                                  : (isVip ? AppColors.gold.withOpacity(0.1) : AppColors.background),
                              border: Border.all(
                                color: isHovered
                                    ? (isVip ? AppColors.gold : AppColors.primary)
                                    : (isVip ? AppColors.gold.withOpacity(0.3) : AppColors.border),
                                width: isHovered ? 1.5 : 1,
                              ),
                              borderRadius: BorderRadius.circular(6),
                              boxShadow: isHovered ? [
                                BoxShadow(
                                  color: (isVip ? AppColors.gold : AppColors.primary).withOpacity(0.3),
                                  blurRadius: 8,
                                )
                              ] : null,
                            ),
                            child: Center(
                              child: Text(
                                amount.toString(),
                                style: AppTextStyles.digital(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: isHovered ? Colors.white : Colors.grey.shade300,
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 8),

                  // Custom Input Row
                  Container(
                    padding: const EdgeInsets.only(top: 8),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: AppColors.border)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: TextField(
                              style: AppTextStyles.digital(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                hintText: t('Custom'),
                                hintStyle: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                              ),
                              onChanged: (value) => _customBetInput = value,
                              onSubmitted: (value) => _handleCustomSubmit(num),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () => _handleCustomSubmit(num),
                          child: Container(
                            height: 36,
                            width: 36,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(Icons.check, color: Colors.black, size: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLowBalanceModal() {
    return Container(
      color: Colors.black.withOpacity(0.8),
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.background,
            border: Border.all(color: AppColors.danger.withOpacity(0.5)),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.danger.withOpacity(0.2),
                blurRadius: 50,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.danger.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.danger.withOpacity(0.3)),
                ),
                child: const Icon(Icons.account_balance_wallet, color: AppColors.danger, size: 32),
              ),
              const SizedBox(height: 16),
              Text(
                t('Insuff Funds'),
                style: AppTextStyles.title(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _totalBet > 0
                    ? '${t('Total Bet Is')} ${_totalBet.toInt()} CFA.'
                    : t('Need Funds'),
                textAlign: TextAlign.center,
                style: AppTextStyles.body(color: Colors.grey, fontSize: 14),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   AppButton(
                    size: ButtonSize.sm,
                    variant: ButtonVariant.secondary,
                    onPressed: () => setState(() => _showLowBalanceModal = false),
                    child: Text(t('Cancel')),
                  ),
                  const SizedBox(width: 16),
                  AppButton(
                    size: ButtonSize.sm,
                    variant: ButtonVariant.primary,
                    onPressed: () {
                      setState(() => _showLowBalanceModal = false);
                      widget.setScreen(Screen.wallet);
                    },
                    child: Text(t('Deposit')),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNoBetModal() {
    return GestureDetector(
      onTap: () => setState(() => _showNoBetModal = false),
      child: Container(
        color: Colors.black.withOpacity(0.8),
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.background,
                border: Border.all(color: AppColors.gold.withOpacity(0.5)),
                borderRadius: BorderRadius.circular(24),
                 boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withOpacity(0.2),
                    blurRadius: 50,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.gold.withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                    ),
                    child: const Icon(Icons.warning_amber, color: AppColors.gold, size: 32),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    t('No Bet Placed'),
                    style: AppTextStyles.title(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    t('No Bet Msg'),
                    textAlign: TextAlign.center,
                    style: AppTextStyles.body(color: Colors.grey, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    onPressed: () => setState(() => _showNoBetModal = false),
                    fullWidth: true,
                    size: ButtonSize.md,
                    variant: ButtonVariant.primary,
                    child: Text(t('Ok Pick')),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
