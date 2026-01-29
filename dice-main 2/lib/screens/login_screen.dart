import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_theme.dart';
import '../utils/i18n.dart';
import '../providers/app_provider.dart';
import '../models/types.dart';
import '../widgets/neon_button.dart';
import '../utils/audio.dart';

class LoginScreen extends StatefulWidget {
  final Future<bool> Function(String, String) onLogin;
  final Future<bool> Function(Map<String, dynamic>) onRegister;
  final String language;
  final String? initialMode;

  const LoginScreen({
    super.key,
    required this.onLogin,
    required this.onRegister,
    this.language = 'English',
    this.initialMode,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String t(String key) => I18n.translate(key, widget.language);

  bool get _isFormValid => _identifierController.text.trim().isNotEmpty && _passwordController.text.isNotEmpty;

  Future<void> _handleLogin() async {
    if (_identifierController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      return;
    }

    await AudioManager().play(SoundType.click);

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final success = await widget.onLogin(_identifierController.text, _passwordController.text);
      if (!mounted) return;
      if (success) {
        // Ensure app navigates to the correct screen in case provider didn't trigger UI update
        try {
          final app = context.read<AppProvider>();
          app.setScreen(app.isAdmin ? Screen.admin : Screen.home);
        } catch (_) {}
      } else {
        setState(() {
          _error = 'Login failed';
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Theme(
        data: Theme.of(context).copyWith(
          scrollbarTheme: ScrollbarThemeData(
            thumbColor: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.hovered)) return AppColors.neon;
              return AppColors.neon.withValues(alpha: 0.5);
            }),
            trackColor: WidgetStateProperty.all(Colors.transparent),
            radius: const Radius.circular(10),
            thickness: WidgetStateProperty.all(6),
          ),
        ),
        child: ScrollConfiguration(
          behavior: ScrollConfiguration.of(context).copyWith(
            scrollbars: false,
          ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isDesktop = constraints.maxWidth > 900;
            if (isDesktop) {
              return Row(
                children: [
                  // Left Side - Visuals (Clone of Splash Branding) - 50% Width
                  Expanded(
                    flex: 1,
                    child: Stack(
                      children: [
                        // Background Image
                        Positioned.fill(
                          child: Image.network(
                            'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2940&auto=format&fit=crop',
                            fit: BoxFit.cover,
                          ),
                        ),
                        // Overlay
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black.withValues(alpha: 0.7),
                                  Colors.black.withValues(alpha: 0.4),
                                  Colors.black.withValues(alpha: 0.8),
                                ],
                              ),
                            ),
                          ),
                        ),
                        // Branding Content
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              ScaleTransition(
                                scale: _pulseAnimation,
                                child: Container(
                                  width: 120,
                                  height: 120,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColors.neon.withValues(alpha: 0.1),
                                    border: Border.all(
                                      color: AppColors.neon.withValues(alpha: 0.3),
                                      width: 1.5,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.neon.withValues(alpha: 0.1),
                                        blurRadius: 20,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Transform.translate(
                                          offset: const Offset(-10, -5),
                                          child: const Icon(Icons.casino_outlined,
                                              size: 50, color: AppColors.neon),
                                        ),
                                        Transform.translate(
                                          offset: const Offset(10, 10),
                                          child: const Icon(Icons.casino_outlined,
                                              size: 50, color: AppColors.neon),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 40),
                              RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: AppTextStyles.title(
                                    fontSize: 64,
                                    fontWeight: FontWeight.w400,
                                    letterSpacing: 6,
                                  ).copyWith(
                                    shadows: [
                                      Shadow(
                                        color: Colors.white.withValues(alpha: 0.3),
                                        blurRadius: 10,
                                      ),
                                    ],
                                  ),
                                  children: const [
                                    TextSpan(
                                        text: 'DICE',
                                        style: TextStyle(color: AppColors.textMain)),
                                    TextSpan(text: ' '),
                                    TextSpan(
                                        text: 'WORLD',
                                        style: TextStyle(
                                          color: AppColors.neon,
                                          shadows: [
                                            Shadow(color: AppColors.neon, blurRadius: 10)
                                          ],
                                        )),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'BY BIG SIZE ENTERTAINMENT',
                                style: AppTextStyles.digital(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.gold,
                                  letterSpacing: 4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Right Side - Form - 50% Width
                  Expanded(
                    flex: 1,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF0F1115),
                      ),
                      child: Center(
                        child: Container(
                          constraints: const BoxConstraints(maxWidth: 450), // Increased width
                          child: _buildForm(),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }

            // Mobile View
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      // Branding Header
                      ScaleTransition(
                        scale: _pulseAnimation,
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.neon.withValues(alpha: 0.1),
                            border: Border.all(
                              color: AppColors.neon.withValues(alpha: 0.3),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.neon.withValues(alpha: 0.1),
                                blurRadius: 20,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Icon(Icons.casino_outlined,
                                size: 40, color: AppColors.neon),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: AppTextStyles.title(
                            fontSize: constraints.maxWidth < 400 ? 32 : 40,
                            fontWeight: FontWeight.w400,
                            letterSpacing: 4,
                          ),
                          children: const [
                            TextSpan(
                                text: 'DICE', style: TextStyle(color: AppColors.textMain)),
                            TextSpan(text: ' '),
                            TextSpan(text: 'WORLD', style: TextStyle(color: AppColors.neon)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'BY BIG SIZE ENTERTAINMENT',
                        style: AppTextStyles.digital(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppColors.gold,
                          letterSpacing: 2.5,
                        ),
                      ),
                      const SizedBox(height: 48),
                      // Glassy Form Container
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.05),
                            width: 1,
                          ),
                        ),
                        child: _buildForm(),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    ),
   );
  }

  Widget _buildForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          t('Welcome Back'),
          style: AppTextStyles.body(
            fontSize: 36,
            fontWeight: FontWeight.w600,
            color: AppColors.textMain,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          t('Enter Credentials'),
          style: AppTextStyles.body(
            fontSize: 14,
            color: AppColors.textMuted,
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 40),

        if (_error != null) _buildError(),

        _buildLabel(t('Username / Email / Phone')),
        _buildTextField(
          controller: _identifierController,
          hint: t('Enter ID'),
          icon: Icons.person_outline,
        ),
        const SizedBox(height: 24),

        _buildLabel(t('Password')),
        _buildTextField(
          controller: _passwordController,
          hint: '••••••••',
          icon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: 32),

        // Custom Login Button with Hover
        NeonButton(
          onPressed: _isLoading ? null : _handleLogin,
          disabled: !_isFormValid || _isLoading,
          fullWidth: true,
          variant: NeonButtonVariant.primary,
          child: Text(_isLoading ? t('Logging In') : t('Login')),
        ),

        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _HoverableLink(
              text: t('Create Account'),
              onTap: () => context.read<AppProvider>().setScreen(Screen.register),
              underline: true,
              color: Colors.white,
            ),
            const SizedBox(width: 48), // Increased gap
            _HoverableLink(
              text: t('Forgot Password'),
              onTap: _showForgotPasswordDialog,
              color: Colors.grey[500],
              hoverColor: Colors.white,
            ),
          ],
        ),
        const SizedBox(height: 40),
        Center(
          child: Text(
            t('Terms'),
            style: AppTextStyles.body(
              fontSize: 11,
              color: AppColors.textMuted.withValues(alpha: 0.5),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: AppTextStyles.body(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: const Color(0xFF94A3B8),
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscureText = false,
  }) {
    return _ThemedTextField(
      controller: controller,
      hint: hint,
      icon: icon,
      obscureText: obscureText,
      onChanged: (_) => setState(() {}),
    );
  }

  Widget _buildError() {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: AppColors.danger.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              _error!,
              style: AppTextStyles.body(
                color: AppColors.danger,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showForgotPasswordDialog() async {
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool dialogLoading = false;
    String? dialogError;
    bool dialogSuccess = false;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: const Color(0xFF0F1115),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: AppColors.neon.withValues(alpha: 0.3)),
            ),
            title: Text(
              t('Reset Password'),
              style: GoogleFonts.orbitron(color: Colors.white, fontSize: 18),
            ),
            content: SizedBox(
              width: 400,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (dialogSuccess)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle_outline, color: Colors.green, size: 20),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Password reset successfully!',
                              style: TextStyle(color: Colors.green, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    )
                  else ...[
                    Text(
                      'Enter your email and new password to reset your account.',
                      style: AppTextStyles.body(color: Colors.grey, fontSize: 13),
                    ),
                    const SizedBox(height: 20),
                    if (dialogError != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          dialogError!,
                          style: const TextStyle(color: Colors.red, fontSize: 12),
                        ),
                      ),
                    _ThemedTextField(
                      controller: emailController,
                      hint: t('Email Address'),
                      icon: Icons.email_outlined,
                    ),
                    const SizedBox(height: 16),
                    _ThemedTextField(
                      controller: passwordController,
                      hint: 'New Password',
                      icon: Icons.lock_outline,
                      obscureText: true,
                    ),
                    const SizedBox(height: 16),
                    _ThemedTextField(
                      controller: confirmPasswordController,
                      hint: 'Confirm New Password',
                      icon: Icons.lock_reset,
                      obscureText: true,
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(dialogSuccess ? t('Done') : t('Cancel'), style: const TextStyle(color: Colors.grey)),
              ),
              if (!dialogSuccess)
                NeonButton(
                  disabled: dialogLoading,
                  onPressed: () async {
                    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
                      setDialogState(() => dialogError = 'Please fill all fields');
                      return;
                    }
                    if (passwordController.text != confirmPasswordController.text) {
                      setDialogState(() => dialogError = 'Passwords do not match');
                      return;
                    }
                    
                    setDialogState(() {
                      dialogLoading = true;
                      dialogError = null;
                    });

                    try {
                      await context.read<AppProvider>().handleForgotPassword(
                        email: emailController.text.trim(),
                        newPassword: passwordController.text,
                        confirmPassword: confirmPasswordController.text,
                      );
                      setDialogState(() {
                        dialogLoading = false;
                        dialogSuccess = true;
                      });
                    } catch (e) {
                      setDialogState(() {
                        dialogLoading = false;
                        dialogError = e.toString().contains('404') 
                            ? 'Reset service temporarily unavailable' 
                            : e.toString().replaceAll('Exception: ', '');
                      });
                    }
                  },
                  child: Text(dialogLoading ? '...' : 'RESET NOW'),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _ThemedTextField extends StatefulWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscureText;
  final ValueChanged<String>? onChanged;

  const _ThemedTextField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscureText = false,
    this.onChanged,
  });

  @override
  State<_ThemedTextField> createState() => _ThemedTextFieldState();
}

class _ThemedTextFieldState extends State<_ThemedTextField> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22), // Darker background for input fields
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: _isFocused ? AppColors.neon.withValues(alpha: 0.5) : const Color(0xFF30363D),
          width: 1,
        ),
      ),
      child: Focus(
        onFocusChange: (value) => setState(() => _isFocused = value),
        child: TextField(
          controller: widget.controller,
          obscureText: widget.obscureText,
          style: GoogleFonts.poppins(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w400),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: GoogleFonts.poppins(color: const Color(0xFF6E7681), fontSize: 14),
            prefixIcon: Container(
              margin: const EdgeInsets.only(left: 12, right: 8),
              child: Icon(
                widget.icon,
                color: _isFocused ? AppColors.neon : const Color(0xFF6E7681),
                size: 20,
              ),
            ),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
          ),
          onChanged: widget.onChanged,
        ),
      ),
    );
  }
}

class _HoverableLink extends StatefulWidget {
  final String text;
  final VoidCallback onTap;
  final bool underline;
  final Color? color;
  final Color? hoverColor;

  const _HoverableLink({
    required this.text,
    required this.onTap,
    this.underline = false,
    this.color,
    this.hoverColor,
  });

  @override
  State<_HoverableLink> createState() => _HoverableLinkState();
}

class _HoverableLinkState extends State<_HoverableLink> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: TextButton(
        onPressed: widget.onTap,
        style: TextButton.styleFrom(
          padding: EdgeInsets.zero,
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        child: Text(
          widget.text,
          style: AppTextStyles.body(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: _isHovered
                ? (widget.hoverColor ?? AppColors.neon)
                : (widget.color ?? Colors.white),
            letterSpacing: 0.5,
          ).copyWith(
            decoration: widget.underline ? TextDecoration.underline : null,
            decorationColor: _isHovered ? (widget.hoverColor ?? AppColors.neon) : (widget.color ?? Colors.white),
            decorationStyle: TextDecorationStyle.solid,
            decorationThickness: 1.5,
          ),
        ),
      ),
    );
  }
}
