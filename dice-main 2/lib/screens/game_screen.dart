import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math';
import '../models/types.dart';
import '../utils/i18n.dart';
import '../widgets/dice_widget.dart';
import '../widgets/neon_button.dart';
import '../utils/audio.dart';
import '../utils/app_theme.dart';

class GameScreen extends StatefulWidget {
  final User user;
  final Function(User) onUserUpdate;
  final double betAmount;
  final Function(double) onBetAmountChange;
  final int playerCount;
  final Function(int) onPlayerCountChange;
  final Function(GameRecord) onHistoryAdd;
  final Function(Screen) onScreenChange;
  final double commissionRate;
  final bool isOnline;
  final String language;

  const GameScreen({
    super.key,
    required this.user,
    required this.onUserUpdate,
    required this.betAmount,
    required this.onBetAmountChange,
    required this.playerCount,
    required this.onPlayerCountChange,
    required this.onHistoryAdd,
    required this.onScreenChange,
    required this.commissionRate,
    required this.isOnline,
    this.language = 'English',
  });

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  String _gameState = 'READY'; // READY, MATCHING, ROLLING, RESULT
  List<int> _myDice = [1, 1];
  List<int> _leftDice = [1, 1];
  List<int> _rightDice = [1, 1];
  Map<String, dynamic>? _duelResults;
  int? _hoveredTableSize;
  bool _isRollHovered = false;
  late TextEditingController _betController;

  @override
  void initState() {
    super.initState();
    _betController = TextEditingController(text: widget.betAmount.toStringAsFixed(0));
  }

  @override
  void didUpdateWidget(GameScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.betAmount != oldWidget.betAmount) {
      final newText = widget.betAmount.toStringAsFixed(0);
      if (_betController.text != newText) {
        _betController.text = newText;
      }
    }
  }

  @override
  void dispose() {
    _betController.dispose();
    super.dispose();
  }

  String t(String key) => I18n.translate(key, widget.language);

  void _handleStartGame() {
    final activeDuels = widget.playerCount >= 3 ? 2 : 1;
    final totalBetRequired = widget.betAmount * activeDuels;

    if (widget.user.wallet.balance < totalBetRequired) {
      _showInsufficientFunds(totalBetRequired);
      return;
    }

    setState(() {
      _gameState = 'MATCHING';
    });

    Future.delayed(const Duration(milliseconds: 1500), () {
      _executeGameLogic();
    });
  }

  Future<void> _executeGameLogic() async {
    setState(() {
      _gameState = 'FOUND';
    });

    Future.delayed(const Duration(milliseconds: 1000), () {
      setState(() {
        _gameState = 'ROLLING';
      });
      _performRollSequence();
    });
  }

  Future<void> _performRollSequence() async {
    // Logic starts immediately as state is already ROLLING from previous step

    final totalBetRequired = widget.betAmount * activeDuels;

    // Deduct bet
    widget.onUserUpdate(
      widget.user.copyWith(
        wallet: widget.user.wallet.copyWith(
          balance: widget.user.wallet.balance - totalBetRequired,
        ),
        stats: widget.user.stats.copyWith(
          gamesPlayed: widget.user.stats.gamesPlayed + 1,
          totalWagered: widget.user.stats.totalWagered + totalBetRequired,
        ),
      ),
    );

    // Rolling animation - Optimized for better performance
    AudioManager().play(SoundType.roll);
    final random = Random();
    for (int i = 0; i < 10; i++) {
      await Future.delayed(const Duration(milliseconds: 80));
      if (mounted) {
      setState(() {
        _myDice = [random.nextInt(6) + 1, random.nextInt(6) + 1];
        _leftDice = [random.nextInt(6) + 1, random.nextInt(6) + 1];
        if (widget.playerCount >= 3) {
          _rightDice = [random.nextInt(6) + 1, random.nextInt(6) + 1];
        }
      });
      }
    }

    // Final results
    _myDice = [random.nextInt(6) + 1, random.nextInt(6) + 1];
    _leftDice = [random.nextInt(6) + 1, random.nextInt(6) + 1];
    if (widget.playerCount >= 3) {
      _rightDice = [random.nextInt(6) + 1, random.nextInt(6) + 1];
    }

    _calculateResults();
  }

  void _calculateResults() {
    final myTotal = _myDice[0] + _myDice[1];
    final leftTotal = _leftDice[0] + _leftDice[1];
    final rightTotal = widget.playerCount >= 3
        ? _rightDice[0] + _rightDice[1]
        : 0;

    double grossWinnings = 0;
    double totalFee = 0;
    String leftResult = 'LOSS';
    String? rightResult;

    Map<String, double> calculateWin(double bet) {
      final pot = bet * 2;
      final fee = (pot * widget.commissionRate / 100).floorToDouble();
      return {'payout': pot - fee, 'fee': fee};
    }

    if (myTotal > leftTotal) {
      leftResult = 'WIN';
      final win = calculateWin(widget.betAmount);
      grossWinnings += win['payout']!;
      totalFee += win['fee']!;
    } else if (myTotal == leftTotal) {
      leftResult = 'DRAW';
      grossWinnings += widget.betAmount;
    }

    if (widget.playerCount >= 3) {
      if (myTotal > rightTotal) {
        rightResult = 'WIN';
        final win = calculateWin(widget.betAmount);
        grossWinnings += win['payout']!;
        totalFee += win['fee']!;
      } else if (myTotal == rightTotal) {
        rightResult = 'DRAW';
        grossWinnings += widget.betAmount;
      } else {
        rightResult = 'LOSS';
      }
    }

    final activeDuels = widget.playerCount >= 3 ? 2 : 1;
    final totalBetRequired = widget.betAmount * activeDuels;
    final netWin = grossWinnings - totalBetRequired;

    if (netWin > 0) {
      AudioManager().play(SoundType.win);
    } else if (netWin < 0) {
      AudioManager().play(SoundType.loss);
    }

    // Update balance
    widget.onUserUpdate(
      widget.user.copyWith(
        wallet: widget.user.wallet.copyWith(
          balance: widget.user.wallet.balance + grossWinnings,
        ),
        stats: widget.user.stats.copyWith(
          gamesWon: netWin > 0
              ? widget.user.stats.gamesWon + 1
              : widget.user.stats.gamesWon,
          totalWon: widget.user.stats.totalWon + grossWinnings,
        ),
      ),
    );

    setState(() {
      _duelResults = {
        'left': leftResult,
        'right': rightResult,
        'netAmount': netWin,
        'feePaid': totalFee,
      };
      _gameState = 'RESULT';
    });

    // Add to history
    widget.onHistoryAdd(
      GameRecord(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        date: DateTime.now().toString(),
        betAmount: totalBetRequired,
        userScore: myTotal,
        opponentScore: leftTotal,
        result: netWin > 0
            ? GameResult.win
            : netWin < 0
                ? GameResult.loss
                : GameResult.draw,
      ),
    );
  }

  void _resetGame() {
    setState(() {
      _gameState = 'READY';
      _duelResults = null;
      _myDice = [1, 1];
      _leftDice = [1, 1];
      _rightDice = [1, 1];
    });
  }

  void _showInsufficientFunds(double required) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1F2833),
        title: Text(t('Insufficient Funds')),
        content: Text(
          '${t('Insuff Funds Desc').replaceAll('{amount}', required.toStringAsFixed(0))}\n${t('Your Balance')}: ${widget.user.wallet.balance.toStringAsFixed(0)} Coins',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(t('Cancel')),
          ),
          NeonButton(
            onPressed: () {
              Navigator.pop(context);
              widget.onScreenChange(Screen.wallet);
            },
            child: Text(t('Deposit Caps')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeDuels = widget.playerCount >= 3 ? 2 : 1;
    final totalBetRequired = widget.betAmount * activeDuels;

    return SafeArea(
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.panel,
              border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05), width: 1)),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => widget.onScreenChange(Screen.home),
                  child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                ),
                const Spacer(),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      t('Total Wager').toUpperCase(),
                      style: GoogleFonts.orbitron(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.white60,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.betAmount.toStringAsFixed(0),
                      style: GoogleFonts.orbitron(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.neon,
                        height: 1,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                const Icon(Icons.volume_up, color: Colors.white70, size: 24),
              ],
            ),
          ),
          Expanded(
            child: Column(
              children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Opponents
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildOpponent(
                        '${t('Player')} 2',
                        _leftDice,
                        _duelResults?['left'],
                      ),
                      if (widget.playerCount >= 3) ...[
                        const SizedBox(width: 80),
                        _buildOpponent(
                          '${t('Player')} 3',
                          _rightDice,
                          _duelResults?['right'],
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 40),
                  
                  // VS Badge
                  Text(
                    t('VS'),
                    style: GoogleFonts.orbitron(
                      fontSize: MediaQuery.of(context).size.width > 600 ? 80 : 40,
                      fontWeight: FontWeight.w900,
                      color: Colors.white.withValues(alpha: 0.05),
                    ),
                  ),
                  SizedBox(height: MediaQuery.of(context).size.width > 600 ? 40 : 20),
                  
                  // Player Dice
                  Column(
                    children: [
                      Text(
                        widget.user.name,
                        style: const TextStyle(
                          color: Color(0xFF66FCF1),
                          fontSize: 12,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          DiceWidget(
                            value: _myDice[0],
                            isRolling: _gameState == 'ROLLING',
                            color: (_duelResults?['netAmount'] ?? 0) > 0
                                ? DiceColor.gold
                                : DiceColor.neon,
                            size: MediaQuery.of(context).size.width > 600 ? DiceSize.lg : DiceSize.md,
                          ),
                          const SizedBox(width: 12),
                          DiceWidget(
                            value: _myDice[1],
                            isRolling: _gameState == 'ROLLING',
                            color: (_duelResults?['netAmount'] ?? 0) > 0
                                ? DiceColor.gold
                                : DiceColor.neon,
                            size: MediaQuery.of(context).size.width > 600 ? DiceSize.lg : DiceSize.md,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _gameState == 'ROLLING'
                            ? '...'
                            : _gameState == 'RESULT'
                                ? '${_myDice[0] + _myDice[1]}'
                                : '',
                        style: GoogleFonts.orbitron(
                          fontSize: MediaQuery.of(context).size.width > 600 ? 48 : 32,
                          fontWeight: FontWeight.bold,
                          color: (_duelResults?['netAmount'] ?? 0) > 0
                              ? AppColors.gold
                              : Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Bottom Controls
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFF0F1218),
            ),
            child: Column(
              children: [
                if (_gameState == 'READY') ...[
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isSmall = constraints.maxWidth < 400;
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          // Table Size
                          Expanded(
                            flex: 5,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t('Table Size').toUpperCase(),
                                  style: GoogleFonts.orbitron(
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white54,
                                    letterSpacing: 1,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF141920),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                                  ),
                                  child: Row(
                                    children: [2, 3].map((count) {
                                      bool isSelected = widget.playerCount == count;
                                      return Expanded(
                                        child: GestureDetector(
                                          onTap: () {
                                            AudioManager().play(SoundType.click);
                                            widget.onPlayerCountChange(count);
                                          },
                                          child: AnimatedContainer(
                                            duration: const Duration(milliseconds: 200),
                                            padding: const EdgeInsets.symmetric(vertical: 10),
                                            decoration: BoxDecoration(
                                              color: isSelected ? AppColors.neon : Colors.transparent,
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              count.toString(),
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.orbitron(
                                                color: isSelected ? Colors.black : Colors.white24,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Bet amount
                          Expanded(
                            flex: 2, // Decreased width relative to Table Size (2/7 instead of 2/5)
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  t('Select Amount').toUpperCase(),
                                  style: GoogleFonts.orbitron(
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white54,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                  Container(
                                    height: 48, // Increased height
                                    padding: const EdgeInsets.symmetric(horizontal: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF141920),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        IconButton(
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                          onPressed: () {
                                            AudioManager().play(SoundType.click);
                                            final newAmount = (widget.betAmount - 100).clamp(500.0, double.infinity);
                                            widget.onBetAmountChange(newAmount);
                                          },
                                          icon: const Icon(Icons.remove, color: AppColors.neon, size: 16),
                                        ),
                                        Expanded(
                                          child: TextField(
                                            controller: _betController,
                                            keyboardType: TextInputType.number,
                                            textAlign: TextAlign.center,
                                            cursorColor: AppColors.neon,
                                            style: GoogleFonts.orbitron(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w900,
                                              color: Colors.white,
                                            ),
                                            decoration: const InputDecoration(
                                              isDense: true,
                                              contentPadding: EdgeInsets.zero,
                                              border: InputBorder.none,
                                              hintText: '0',
                                              hintStyle: TextStyle(color: Colors.white24),
                                            ),
                                            onChanged: (value) {
                                              final val = double.tryParse(value);
                                              if (val != null) {
                                                widget.onBetAmountChange(val);
                                              }
                                            },
                                          ),
                                        ),
                                        IconButton(
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                          onPressed: () {
                                            AudioManager().play(SoundType.click);
                                            final newAmount = widget.betAmount + 100;
                                            widget.onBetAmountChange(newAmount);
                                          },
                                          icon: const Icon(Icons.add, color: AppColors.neon, size: 16),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  MouseRegion(
                    onEnter: (_) => setState(() => _isRollHovered = true),
                    onExit: (_) => setState(() => _isRollHovered = false),
                    child: GestureDetector(
                      onTap: _handleStartGame,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        decoration: BoxDecoration(
                          color: AppColors.neon,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                          BoxShadow(
                            color: AppColors.neon.withValues(alpha: _isRollHovered ? 0.6 : 0.5),
                            blurRadius: _isRollHovered ? 30 : 25,
                            spreadRadius: _isRollHovered ? 4 : 1,
                          ),
                          ],
                        ),
                        child: Text(
                          widget.playerCount > 2 
                            ? 'ROLL (${widget.playerCount - 1} DUELS)'.toUpperCase()
                            : 'ROLL (1 VS 1)'.toUpperCase(),
                          textAlign: TextAlign.center,
                          style: GoogleFonts.orbitron(
                            color: Colors.black,
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                    ),
                  ),
                ] else if (_gameState == 'MATCHING') ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF66FCF1).withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const CircularProgressIndicator(
                          color: Color(0xFF66FCF1),
                        ),
                        const SizedBox(width: 16),
                        Text(
                          t('Finding Players'),
                          style: const TextStyle(
                            color: Color(0xFF66FCF1),
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else if (_gameState == 'FOUND') ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF66FCF1).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF66FCF1)),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF66FCF1).withValues(alpha: 0.2),
                          blurRadius: 20,
                        )
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle, color: Color(0xFF66FCF1)),
                        const SizedBox(width: 16),
                        Text(
                          t('Opponent Found!'),
                          style: const TextStyle(
                            color: Color(0xFF66FCF1),
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else if (_gameState == 'ROLLING') ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF66FCF1).withValues(alpha: 0.2)),
                    ),
                    child: Center(
                      child: Text(
                        t('Rolling'),
                        style: const TextStyle(
                          color: Color(0xFF66FCF1),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ] else if (_gameState == 'RESULT') ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: (_duelResults?['netAmount'] ?? 0) > 0
                          ? const Color(0xFFFFD700).withValues(alpha: 0.1)
                          : Colors.black.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: (_duelResults?['netAmount'] ?? 0) > 0
                            ? const Color(0xFFFFD700).withValues(alpha: 0.5)
                            : Colors.white.withValues(alpha: 0.05),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            children: [
                              Text(
                                '${(_duelResults?['netAmount'] ?? 0) > 0 ? '+' : ''}${(_duelResults?['netAmount'] ?? 0).toStringAsFixed(0)} Coins',
                                style: GoogleFonts.orbitron(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: (_duelResults?['netAmount'] ?? 0) > 0
                                      ? AppColors.gold
                                      : (_duelResults?['netAmount'] ?? 0) < 0
                                          ? AppColors.danger
                                          : Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                        NeonButton(
                          onPressed: _resetGame,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.refresh, size: 18),
                              const SizedBox(width: 8),
                              Text(t('Again')),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
          ),
        ],
      ),
    );
  }

  Widget _buildOpponent(String name, List<int> dice, String? result) {
    final total = dice[0] + dice[1];
    return Column(
      children: [
        if (result != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: result == 'WIN'
                  ? const Color(0xFFFFD700)
                  : result == 'LOSS'
                      ? const Color(0xFFFF4C4C)
                      : Colors.grey,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              result,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ),
        Text(
          name.toUpperCase(),
          style: GoogleFonts.orbitron(
            fontSize: 9,
            color: Colors.white70,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            DiceWidget(
              value: dice[0],
              isRolling: _gameState == 'ROLLING',
              color: DiceColor.danger,
              size: DiceSize.sm,
            ),
            const SizedBox(width: 8),
            DiceWidget(
              value: dice[1],
              isRolling: _gameState == 'ROLLING',
              color: DiceColor.danger,
              size: DiceSize.sm,
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          _gameState == 'ROLLING'
              ? '...'
              : _gameState == 'RESULT'
                  ? total.toString()
                  : '',
          style: GoogleFonts.orbitron(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.danger,
          ),
        ),
      ],
    );
  }
}
