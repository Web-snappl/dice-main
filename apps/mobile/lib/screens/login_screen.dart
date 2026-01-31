import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../utils/app_theme.dart';
import '../utils/i18n.dart';
import '../providers/app_provider.dart';
import '../models/types.dart';
import '../widgets/app_button.dart';
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

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String t(String key) => I18n.translate(key, widget.language);

  bool get _isFormValid => 
      _identifierController.text.trim().isNotEmpty && 
      _passwordController.text.isNotEmpty;

  Future<void> _handleLogin() async {
    if (!_isFormValid) return;

    await AudioManager().play(SoundType.click);

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final success = await widget.onLogin(
        _identifierController.text, 
        _passwordController.text,
      );
      if (!mounted) return;
      if (success) {
        try {
          final app = context.read<AppProvider>();
          app.setScreen(app.isAdmin ? Screen.admin : Screen.home);
        } catch (_) {}
      } else {
        setState(() => _error = 'Login failed');
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: const Icon(
                    Icons.casino,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                
                // Title
                Text(
                  'DICE',
                  style: AppTextStyles.display(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textMain,
                  ),
                ),
                const SizedBox(height: 48),
                
                // Form
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('Welcome Back'),
                        style: AppTextStyles.title(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t('Enter Credentials'),
                        style: AppTextStyles.body(
                          color: AppColors.textMuted,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      if (_error != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.danger.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            border: Border.all(
                              color: AppColors.danger.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, 
                                color: AppColors.danger, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _error!,
                                  style: AppTextStyles.body(
                                    color: AppColors.danger,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      
                      _buildTextField(
                        controller: _identifierController,
                        label: t('Username / Email'),
                        icon: Icons.person_outline,
                      ),
                      const SizedBox(height: 16),
                      
                      _buildTextField(
                        controller: _passwordController,
                        label: t('Password'),
                        icon: Icons.lock_outline,
                        obscureText: true,
                      ),
                      const SizedBox(height: 24),
                      
                      AppButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        disabled: !_isFormValid || _isLoading,
                        fullWidth: true,
                        child: Text(_isLoading 
                            ? t('Logging In').toUpperCase() 
                            : t('Login').toUpperCase()),
                      ),
                      const SizedBox(height: 16),
                      
                      Center(
                        child: TextButton(
                          onPressed: () => context.read<AppProvider>()
                              .setScreen(Screen.register),
                          child: Text(
                            t('Create Account'),
                            style: AppTextStyles.body(
                              color: AppColors.textMuted,
                              fontSize: 14,
                            ),
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
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      style: AppTextStyles.body(color: AppColors.textMain),
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.label(color: AppColors.textMuted),
        prefixIcon: Icon(icon, color: AppColors.textMuted, size: 20),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: AppColors.primary),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16, vertical: 16),
      ),
    );
  }
}
