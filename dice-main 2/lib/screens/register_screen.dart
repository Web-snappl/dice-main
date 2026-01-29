import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_theme.dart';
import '../utils/i18n.dart';
import '../providers/app_provider.dart';
import '../models/types.dart';
import '../widgets/neon_button.dart';
import '../utils/audio.dart';

class RegisterScreen extends StatefulWidget {
  final Future<bool> Function(Map<String, dynamic>) onRegister;
  final String language;

  const RegisterScreen({
    super.key,
    required this.onRegister,
    this.language = 'English',
  });

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> with TickerProviderStateMixin {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String t(String key) => I18n.translate(key, widget.language);

  bool get _isValid =>
      _firstNameController.text.trim().isNotEmpty &&
      _lastNameController.text.trim().isNotEmpty &&
      _emailController.text.trim().isNotEmpty &&
      _phoneController.text.trim().isNotEmpty &&
      _passwordController.text.trim().isNotEmpty;

  Future<void> _handleRegister() async {
    await AudioManager().play(SoundType.click);
    
    if (!_isValid) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final userData = {
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'password': _passwordController.text,
      };
      await widget.onRegister(userData);
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
      body: ScrollConfiguration(
        behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isDesktop = constraints.maxWidth > 900;
            if (isDesktop) {
              return Row(
                children: [
                  // Left Side - Desktop Visuals
                  Expanded(
                    flex: 1,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: Image.network(
                            'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2942&auto=format&fit=crop',
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  AppColors.background.withValues(alpha: 0.5),
                                  AppColors.background,
                                ],
                              ),
                            ),
                          ),
                        ),
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 48),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                  Text(
                                    t('Join Elite'),
                                    style: AppTextStyles.title(
                                      fontSize: 42,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.white,
                                      letterSpacing: 3,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                               const SizedBox(height: 16),
                                Text(
                                  t('Register Desc'),
                                  style: AppTextStyles.body(
                                    fontSize: 18,
                                    color: Colors.grey[300]!,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 48),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    _buildStatTile('10K+', t('Active Players'), AppColors.neon),
                                    const SizedBox(width: 16),
                                    _buildStatTile('24/7', t('Instant Withdraw'), AppColors.gold),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    flex: 1,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF0F1115),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(24),
                            child: _HoverableBackBtn(
                              onTap: () => context.read<AppProvider>().setScreen(Screen.login),
                              text: t('Back to Login'),
                            ),
                          ),
                          Expanded(
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: FractionallySizedBox(
                                widthFactor: 0.9, // Wider for better fit
                                child: SingleChildScrollView(
                                  padding: const EdgeInsets.only(left: 60, right: 20, top: 40, bottom: 40),
                                  child: _buildForm(),
                                ),
                              ),
                            ),
                          ),
                        ],
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
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                  child: Column(
                    children: [
                      _HoverableBackBtn(
                        onTap: () => context.read<AppProvider>().setScreen(Screen.login),
                        text: t('Back to Login'),
                      ),
                      const SizedBox(height: 40),
                      _buildForm(),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatTile(String value, String label, Color color) {
    return Container(
      width: 150,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22).withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF30363D)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: AppTextStyles.digital(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label.toUpperCase(),
            style: AppTextStyles.body(
              fontSize: 10,
              color: const Color(0xFF6E7681),
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              t('Create Account').toUpperCase(),
              style: AppTextStyles.title(
                fontSize: constraints.maxWidth < 400 ? 28 : 36,
                fontWeight: FontWeight.w600,
                color: Colors.white,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              t('Join Table'),
              style: AppTextStyles.body(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 32),
            if (_error != null) _buildError(),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLabel(t('First Name')),
                      _buildTextField(
                        controller: _firstNameController,
                        hint: 'John',
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLabel(t('Last Name')),
                      _buildTextField(
                        controller: _lastNameController,
                        hint: 'Doe',
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildLabel(t('Email Address')),
            _buildTextField(
              controller: _emailController,
              hint: 'john@example.com',
              icon: Icons.mail_outline,
            ),
            const SizedBox(height: 24),
            _buildLabel(t('Phone')),
            _buildTextField(
              controller: _phoneController,
              hint: '+229 00 00 00 00',
              icon: Icons.phone_outlined,
            ),
            const SizedBox(height: 24),
            _buildLabel(t('Password')),
            _buildTextField(
              controller: _passwordController,
              hint: '******',
              icon: Icons.lock_outline,
              obscureText: true,
            ),
            const SizedBox(height: 48),
            NeonButton(
              onPressed: _handleRegister,
              disabled: !_isValid || _isLoading,
              fullWidth: true,
              variant: NeonButtonVariant.primary,
              child: Text(_isLoading ? t('Registering').toUpperCase() : t('Register Now').toUpperCase()),
            ),
            const SizedBox(height: 40),
          ],
        );
      },
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
    IconData? icon,
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
}

class _ThemedTextField extends StatefulWidget {
  final TextEditingController controller;
  final String hint;
  final IconData? icon;
  final bool obscureText;
  final ValueChanged<String>? onChanged;

  const _ThemedTextField({
    required this.controller,
    required this.hint,
    this.icon,
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
            prefixIcon: widget.icon != null 
                ? Container(
                    margin: const EdgeInsets.only(left: 12, right: 8),
                    child: Icon(
                      widget.icon,
                      color: _isFocused ? AppColors.neon : const Color(0xFF6E7681),
                      size: 20,
                    ),
                  ) 
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          ),
          onChanged: widget.onChanged,
        ),
      ),
    );
  }
}



class _HoverableBackBtn extends StatefulWidget {
  final VoidCallback onTap;
  final String text;

  const _HoverableBackBtn({required this.onTap, required this.text});

  @override
  State<_HoverableBackBtn> createState() => _HoverableBackBtnState();
}

class _HoverableBackBtnState extends State<_HoverableBackBtn> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: InkWell(
        onTap: widget.onTap,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              transform: Matrix4.translationValues(_isHovered ? -4 : 0, 0, 0),
              child: Icon(
                Icons.arrow_back,
                color: _isHovered ? Colors.white : Colors.white.withValues(alpha: 0.7),
                size: 20,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              widget.text,
              style: AppTextStyles.body(
                color: _isHovered ? Colors.white : Colors.white.withValues(alpha: 0.7),
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
