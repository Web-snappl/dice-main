import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'models/types.dart';
import 'utils/audio.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/game_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/history_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/admin_dashboard.dart';
import 'screens/dice_table_screen.dart';
import 'providers/app_provider.dart';
import 'utils/app_theme.dart';
import 'screens/register_screen.dart';
import 'widgets/game_layout.dart';
import 'utils/i18n.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AudioManager().init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppProvider()..initialize(),
      child: Consumer<AppProvider>(
        builder: (context, appState, _) {
          return MaterialApp(
            title: 'Dice Game',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.dark,
              primaryColor: AppColors.neon,
              scaffoldBackgroundColor: AppColors.background,
              colorScheme: const ColorScheme.dark(
                primary: AppColors.neon,
                secondary: AppColors.gold,
                error: AppColors.danger,
                surface: AppColors.panel,
              ),
              textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme).copyWith(
                bodyLarge: AppTextStyles.body(color: AppColors.textMain),
                bodyMedium: AppTextStyles.body(color: AppColors.textMuted),
                displayLarge: AppTextStyles.title(color: AppColors.textMain),
              ),
              appBarTheme: const AppBarTheme(
                backgroundColor: AppColors.panel,
                elevation: 0,
              ),
            ),
            home: const AppWrapper(),
          );
        },
      ),
    );
  }
}

class AppWrapper extends StatefulWidget {
  const AppWrapper({super.key});

  @override
  State<AppWrapper> createState() => _AppWrapperState();
}

class _AppWrapperState extends State<AppWrapper> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Simulate splash screen
    await Future.delayed(const Duration(seconds: 2)); // Reduced time 
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SplashScreen();
    }

    return Consumer<AppProvider>(
      builder: (context, appState, _) {
        return _buildScreen(appState.currentScreen, appState);
      },
    );
  }

  Widget _buildScreen(Screen screen, AppProvider appState) {
    debugPrint('🖥️ _buildScreen called: screen=$screen, currentUser=${appState.currentUser?.name ?? "NULL"}');
    
    // Safety check: If user is null but screen requires user, redirect to login
    if (appState.currentUser == null && screen != Screen.login && screen != Screen.register) {
      debugPrint('⚠️ User is NULL but screen requires user! Redirecting to login...');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        appState.setScreen(Screen.login);
      });
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.neon),
        ),
      );
    }

    Widget screenWidget;
    switch (screen) {
      case Screen.login:
        return LoginScreen(
          onLogin: appState.handleLogin,
          onRegister: appState.handleRegister,
          language: appState.language,
        );
      case Screen.register:
        return RegisterScreen(
          onRegister: appState.handleRegister,
          language: appState.language,
        );
      case Screen.admin:
        return AdminDashboard(
          onLogout: appState.logout,
          commissionRate: appState.commissionRate,
          setCommissionRate: appState.setCommissionRate,
          onEnterGame: () => appState.setScreen(Screen.home),
          users: appState.registeredUsers,
          onUpdateUser: appState.setCurrentUser,
          onDeleteUser: (id) {
            appState.deleteUser(id);
          },
          masterTransactions: appState.transactions,
          addTransaction: appState.addTransaction,
        );
      case Screen.home:
        if (appState.currentUser == null) {
          // If home is requested but no user, redirecting will happen in _buildScreen start,
          // but we show a loader here to be safe and visible.
          screenWidget = const Scaffold(
            backgroundColor: AppColors.background,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppColors.neon),
                  SizedBox(height: 16),
                  Text('Authenticating...', style: TextStyle(color: Colors.white)),
                ],
              ),
            ),
          );
        } else {
          screenWidget = HomeScreen(
            user: appState.currentUser!,
            onScreenChange: appState.setScreen,
            language: appState.language,
          );
        }
        break;
      case Screen.game:
        screenWidget = GameScreen(
          user: appState.currentUser!,
          onUserUpdate: appState.setCurrentUser,
          betAmount: appState.betAmount,
          onBetAmountChange: appState.setBetAmount,
          playerCount: appState.playerCount,
          onPlayerCountChange: appState.setPlayerCount,
          onHistoryAdd: appState.addHistory,
          onScreenChange: appState.setScreen,
          commissionRate: appState.commissionRate,
          isOnline: appState.isOnline,
          language: appState.language,
        );
        break;
      case Screen.wallet:
        screenWidget = WalletScreen(
          user: appState.currentUser!,
          setScreen: appState.setScreen,
          setUser: appState.setCurrentUser,
          transactions: appState.transactions,
          addTransaction: appState.addTransaction,
          language: appState.language,
        );
        break;
      case Screen.history:
        screenWidget = HistoryScreen(
          history: appState.history,
          setScreen: appState.setScreen,
          language: appState.language,
        );
        break;
      case Screen.profile:
        screenWidget = ProfileScreen(
          user: appState.currentUser!,
          setUser: appState.setCurrentUser,
          setScreen: appState.setScreen,
          onLogout: appState.logout,
          onUpdateUser: (user) {
            appState.setCurrentUser(user);
            appState.updateRegisteredUser(user);
          },
          language: appState.language,
          setLanguage: appState.setLanguage,
        );
        break;
      case Screen.diceTable:
        screenWidget = DiceTableScreen(
          user: appState.currentUser!,
          setUser: appState.setCurrentUser,
          setScreen: appState.setScreen,
          addHistory: appState.addHistory,
          isOnline: appState.isOnline,
          language: appState.language,
        );
        break;
    }

    return GameLayout(
      currentScreen: screen,
      onScreenChange: appState.setScreen,
      onLogout: appState.logout,
      isAdmin: appState.isAdmin,
      language: appState.language,
      child: screenWidget,
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _pulseController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);

    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeIn);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Background Image
            Image.network(
              'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2940&auto=format&fit=crop',
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Container(color: const Color(0xFF0F1115));
              },
              errorBuilder: (context, error, stackTrace) => Container(color: const Color(0xFF0F1115)),
            ),
            // Gradient Overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.8),
                    Colors.black.withValues(alpha: 0.4),
                    Colors.black.withValues(alpha: 0.9),
                  ],
                ),
              ),
            ),
            // Content
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo Circle with Pulse Animation
                  ScaleTransition(
                    scale: _pulseAnimation,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.neon.withValues(alpha: 0.1),
                        border: Border.all(
                          color: AppColors.neon.withValues(alpha: 0.5),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.neon.withValues(alpha: 0.3),
                            blurRadius: 30,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Transform.translate(
                              offset: const Offset(-12, -6),
                              child: const Icon(
                                Icons.casino_outlined,
                                size: 55,
                                color: AppColors.neon,
                              ),
                            ),
                            Transform.translate(
                              offset: const Offset(12, 12),
                              child: const Icon(
                                Icons.casino_outlined,
                                size: 55,
                                color: AppColors.neon,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 48),
                  // DICE WORLD Text with Drop Shadow
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: AppTextStyles.title(
                        fontSize: MediaQuery.of(context).size.width < 600 ? 48 : 72,
                        fontWeight: FontWeight.w400,
                        letterSpacing: MediaQuery.of(context).size.width < 600 ? 4 : 8,
                      ).copyWith(
                        shadows: [
                          Shadow(
                            color: Colors.white.withValues(alpha: 0.5),
                            blurRadius: 15,
                          ),
                        ],
                      ),
                      children: const [
                        TextSpan(
                          text: 'DICE',
                          style: TextStyle(color: AppColors.textMain),
                        ),
                        TextSpan(text: ' '),
                        TextSpan(
                          text: 'WORLD',
                          style: TextStyle(
                            color: AppColors.neon,
                            shadows: [
                              Shadow(
                                color: AppColors.neon,
                                blurRadius: 15,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    I18n.translate('By Big Size', appState.language).toUpperCase(),
                    style: AppTextStyles.digital(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                      color: AppColors.gold,
                      letterSpacing: 4,
                    ),
                  ),
                  const SizedBox(height: 80),
                  // Smooth Loader Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.neon),
                        ),
                      ),
                      const SizedBox(width: 20),
                      Text(
                        I18n.translate('Loading Experience', appState.language),
                        style: AppTextStyles.body(
                          fontSize: 16,
                          color: AppColors.textMuted,
                          letterSpacing: 0.8,
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
    );
  }
}
