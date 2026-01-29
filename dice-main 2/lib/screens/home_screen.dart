import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/types.dart';
import '../utils/i18n.dart';
import '../utils/app_theme.dart';
import '../widgets/dice_widget.dart';

class HomeScreen extends StatefulWidget {
  final User user;
  final Function(Screen) onScreenChange;
  final String language;

  const HomeScreen({
    super.key,
    required this.user,
    required this.onScreenChange,
    this.language = 'English',
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isFeaturedHovered = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  String t(String key) => I18n.translate(key, widget.language);

  // Helper to get formatted balance
  String get _formattedBalance {
    return widget.user.wallet.balance.toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth > 900;
        
        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          padding: EdgeInsets.all(isDesktop ? 32 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!isDesktop) ...[
                _buildMobileHeader(context),
                const SizedBox(height: 24),
              ],
              
              // Header Profile & Balance
              _FadeInUp(
                delay: 0,
                child: _buildMainHeader(context, isDesktop),
              ),
              const SizedBox(height: 24),
              
              // Trending Games
              _FadeInUp(
                delay: 1,
                child: _buildTrendingGamessection(context, isDesktop),
              ),
              const SizedBox(height: 24),
              
              // Featured Game
              _FadeInUp(
                delay: 2,
                child: _buildFeaturedGame(context, isDesktop),
              ),
              const SizedBox(height: 24),
              
              // All Games Grid
              _FadeInUp(
                delay: 3,
                child: _buildAllGames(context, isDesktop),
              ),
              // Bottom spacing for mobile nav
              if (!isDesktop) const SizedBox(height: 80),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMobileHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(Icons.menu, color: Colors.white, size: 28),
          onPressed: () {
            Scaffold.of(context).openDrawer();
          },
        ),
        Text(
          t('Dice World'),
          style: AppTextStyles.title(
            fontSize: 20,
            color: AppColors.neon,
            letterSpacing: 3,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(width: 48),
      ],
    );
  }

  Widget _buildMainHeader(BuildContext context, bool isDesktop) {
    return Container(
      padding: EdgeInsets.all(isDesktop ? 24 : 16),
      decoration: BoxDecoration(
        color: const Color(0xFF151921),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: isDesktop
          ? Row(
              children: [
                Expanded(flex: 1, child: _buildProfileInfo(isDesktop)),
                const SizedBox(width: 24),
                _buildWalletCard(context, isDesktop),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildProfileInfo(isDesktop),
                const SizedBox(height: 16),
                _buildWalletCard(context, isDesktop),
              ],
            ),
    );
  }

  Widget _buildProfileInfo(bool isDesktop) {
    return Row(
      children: [
        Container(
          width: isDesktop ? 56 : 48,
          height: isDesktop ? 56 : 48,
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.neon.withValues(alpha: 0.3), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: AppColors.neon.withValues(alpha: 0.2),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Container(
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFF1a222e),
            ),
            child: Center(
              child: Text(
                'US',
                style: GoogleFonts.orbitron(
                  color: AppColors.neon,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.user.name.toUpperCase(),
                style: GoogleFonts.orbitron(
                  fontSize: isDesktop ? 18 : 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.emoji_events_outlined, color: AppColors.gold, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    t('Pro Member'),
                    style: AppTextStyles.body(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWalletCard(BuildContext context, bool isDesktop) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1115),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              children: [
                const Icon(Icons.account_balance_wallet, color: Colors.orange, size: 24),
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  Text(
                    t('Wallet Balance'),
                    style: GoogleFonts.orbitron(
                      fontSize: isDesktop ? 10 : 8,
                      fontWeight: FontWeight.bold,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.neon.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      t('Top Up'),
                      style: GoogleFonts.orbitron(
                        fontSize: isDesktop ? 8 : 7,
                        fontWeight: FontWeight.w900,
                        color: AppColors.neon,
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                '$_formattedBalance CFA',
                style: GoogleFonts.orbitron(
                  fontSize: isDesktop ? 24 : 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.neon,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrendingGamessection(BuildContext context, bool isDesktop) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.local_fire_department, color: Colors.orange, size: 20),
            const SizedBox(width: 8),
            Text(
              t('Trending Games'),
              style: GoogleFonts.orbitron(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: isDesktop ? 4 : 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: isDesktop ? 1.5 : 1.0,
          children: [
            _TrendingGameCard(
              title: t('Casino Dice'),
              color: AppColors.gold,
              diceValue: 6,
              onTap: () => widget.onScreenChange(Screen.game),
              hasRotate: false,
            ),
            _TrendingGameCard(
              title: t('Dice Table'),
              color: AppColors.danger,
              diceValue: 5,
              onTap: () => widget.onScreenChange(Screen.diceTable),
              hasRotate: true,
            ),
          ],
        ),
      ],
    );
  }


  Widget _buildFeaturedGame(BuildContext context, bool isDesktop) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.star_outline, color: AppColors.neon, size: 20),
            const SizedBox(width: 8),
            Text(
              t('Featured Games'),
              style: GoogleFonts.orbitron(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        MouseRegion(
          onEnter: (_) => setState(() => _isFeaturedHovered = true),
          onExit: (_) => setState(() => _isFeaturedHovered = false),
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            onTap: () => widget.onScreenChange(Screen.game),
            child: Container(
              height: isDesktop ? 260 : 200,
              decoration: BoxDecoration(
                color: const Color(0xFF0F1115),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.8),
                    blurRadius: 40,
                    offset: const Offset(0, 15),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Stack(
                  children: [
                    // Background Elements
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [
                              Colors.black.withValues(alpha: 0.8),
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.8),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Background Icon Pattern
                    Positioned(
                      right: -40,
                      top: -40,
                      child: Transform.rotate(
                        angle: 0.785, // 45 deg
                        child: Icon(
                          Icons.casino,
                          size: 300,
                          color: AppColors.neonDim.withValues(alpha: 0.1),
                        ),
                      ),
                    ),
                    
                    // Content
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: isDesktop ? 48 : 24, vertical: 24),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t('Casino Dice').toUpperCase(),
                                  style: GoogleFonts.orbitron(
                                    fontSize: isDesktop ? 48 : 28,
                                    fontWeight: FontWeight.w900,
                                    fontStyle: FontStyle.italic,
                                    color: Colors.white,
                                    letterSpacing: 2,
                                  ),
                                ),
                                SizedBox(height: isDesktop ? 12 : 8),
                                Text(
                                  t('Experience Thrill'),
                                  style: GoogleFonts.poppins(
                                    fontSize: isDesktop ? 16 : 12,
                                    color: Colors.white70,
                                    height: 1.3,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                SizedBox(height: isDesktop ? 24 : 16),
                                Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: isDesktop ? 32 : 24, 
                                    vertical: isDesktop ? 14 : 10
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.neon,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.neon.withValues(alpha: 0.4),
                                        blurRadius: 20,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                  child: Text(
                                    t('Play Now'),
                                    style: GoogleFonts.orbitron(
                                      color: Colors.black,
                                      fontWeight: FontWeight.w900,
                                      fontSize: isDesktop ? 14 : 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (isDesktop)
                            Row(
                              children: [
                                AnimatedRotation(
                                  duration: const Duration(milliseconds: 100),
                                  turns: _isFeaturedHovered ? 0.125 : 0,
                                  child: DiceWidget(
                                    value: 3, 
                                    size: DiceSize.lg, 
                                    color: DiceColor.neon,
                                    isHovered: _isFeaturedHovered,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                AnimatedRotation(
                                  duration: const Duration(milliseconds: 100),
                                  turns: _isFeaturedHovered ? -0.125 : 0,
                                  child: DiceWidget(
                                    value: 4, 
                                    size: DiceSize.lg, 
                                    color: DiceColor.neon,
                                    isHovered: _isFeaturedHovered,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAllGames(BuildContext context, bool isDesktop) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          t('All Games'),
          style: GoogleFonts.orbitron(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isDesktop ? 5 : 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 0.9,
          ),
          itemCount: 4,
          itemBuilder: (context, index) {
            return _buildAllGamesCard(index + 1);
          },
        ),
      ],
    );
  }

  Widget _buildAllGamesCard(int value) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => widget.onScreenChange(Screen.game),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F1115),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: DiceWidget(
                      value: value,
                      size: DiceSize.md,
                      color: DiceColor.neon,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                t('Dice Rolling'),
                style: GoogleFonts.poppins(
                  fontSize: MediaQuery.of(context).size.width > 600 ? 14 : 11,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}



// Simple internal widget to handle fade-in-up animation
class _FadeInUp extends StatefulWidget {
  final Widget child;
  final int delay;

  const _FadeInUp({required this.child, required this.delay});

  @override
  State<_FadeInUp> createState() => _FadeInUpState();
}

class _FadeInUpState extends State<_FadeInUp> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<Offset> _translate;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _opacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _translate = Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    // Staggered delay
    Future.delayed(Duration(milliseconds: widget.delay * 100), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _translate,
        child: widget.child,
      ),
    );
  }
}

class _TrendingGameCard extends StatefulWidget {
  final String title;
  final Color color;
  final int diceValue;
  final VoidCallback onTap;
  final bool hasRotate;

  const _TrendingGameCard({
    required this.title,
    required this.color,
    required this.diceValue,
    required this.onTap,
    this.hasRotate = false,
  });

  @override
  State<_TrendingGameCard> createState() => _TrendingGameCardState();
}

class _TrendingGameCardState extends State<_TrendingGameCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1F2833), Color(0xFF0B0C10)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _isHovered ? widget.color : Colors.grey.shade800,
              width: 1.5,
            ),
            boxShadow: _isHovered ? [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.6),
                blurRadius: 20,
                spreadRadius: 2,
              ),
              BoxShadow(
                color: widget.color.withValues(alpha: 0.3),
                blurRadius: 40,
                spreadRadius: 0,
              )
            ] : [],
          ),
          child: Stack(
            children: [
              // Hover Background Overlay
              Positioned.fill(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  decoration: BoxDecoration(
                    color: widget.color.withValues(alpha: _isHovered ? 0.08 : 0.0),
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 16), 
                child: Column(
                  children: [
                    Expanded(
                      child: Center(
                        child: Transform.rotate(
                          angle: widget.hasRotate ? 0.2 : 0,
                          child: Transform.scale(
                            scale: _isHovered ? 1.05 : 0.95,
                            child: DiceWidget(
                              value: widget.diceValue,
                              isRolling: false,
                              color: widget.color == AppColors.gold ? DiceColor.gold : DiceColor.danger,
                              size: MediaQuery.of(context).size.width > 600 ? DiceSize.lg : DiceSize.md,
                              isHovered: _isHovered,
                            ),
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 14, bottom: 12),
                      child: Text(
                        widget.title.toUpperCase(),
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: _isHovered ? Colors.white : widget.color,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
