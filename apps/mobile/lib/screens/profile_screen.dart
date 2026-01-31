import 'package:flutter/material.dart';

import '../models/types.dart';
import '../utils/i18n.dart';
import '../utils/audio.dart';
import '../utils/app_theme.dart';
import '../widgets/app_button.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/api.dart';

enum ProfileView { menu, editProfile, changePassword, language, sound }

class ProfileScreen extends StatefulWidget {
  final User user;
  final Function(User) setUser;
  final Function(Screen) setScreen;
  final VoidCallback onLogout;
  final Function(User)? onUpdateUser;
  final String language;
  final Function(String) setLanguage;

  const ProfileScreen({
    super.key,
    required this.user,
    required this.setUser,
    required this.setScreen,
    required this.onLogout,
    this.onUpdateUser,
    required this.language,
    required this.setLanguage,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  ProfileView _currentView = ProfileView.menu;

  String t(String key) => I18n.translate(key, widget.language);

  int get _winRate {
    if (widget.user.stats.gamesPlayed > 0) {
      return ((widget.user.stats.gamesWon / widget.user.stats.gamesPlayed) *
              100)
          .round();
    }
    return 0;
  }

  String _getHeaderTitle(ProfileView view) {
    switch (view) {
      case ProfileView.menu:
        return t('My Profile');
      case ProfileView.editProfile:
        return t('Edit Profile');
      case ProfileView.changePassword:
        return t('Change Password');
      case ProfileView.language:
        return t('Language');
      case ProfileView.sound:
        return t('Sound Settings');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentView == ProfileView.menu) {
      return _buildMenuView();
    }

    return SafeArea(
      child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left, color: Colors.grey),
                    onPressed: () =>
                        setState(() => _currentView = ProfileView.menu),
                  ),
                  Expanded(
                    child: Text(
                      _getHeaderTitle(_currentView),
                      textAlign: TextAlign.center,
                      style: AppTextStyles.title(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48), // Balance for back button
                ],
              ),
            ),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _buildContentView(),
              ),
            ),
          ],
        ),
    );
  }

  Widget _buildMenuView() {
    return SafeArea(
      child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header with buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t('My Profile'),
                    style: AppTextStyles.title(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 2,
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.white),
                        onPressed: () => setState(
                            () => _currentView = ProfileView.editProfile),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white.withValues(alpha: 0.05),
                          side: BorderSide(
                              color: Colors.white.withValues(alpha: 0.1)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.logout, color: Colors.red),
                        onPressed: widget.onLogout,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.red.withValues(alpha: 0.1),
                          side: BorderSide(
                              color: Colors.red.withValues(alpha: 0.3)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Profile Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    // Avatar
                    Stack(
                      children: [
                        Container(
                          width: 96,
                          height: 96,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.border),
                          ),
                          padding: const EdgeInsets.all(2),
                          child: CircleAvatar(
                            backgroundImage:
                                NetworkImage(widget.user.avatarUrl),
                            backgroundColor: Colors.black,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Name
                    Text(
                      widget.user.name,
                      style: AppTextStyles.title(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Role Badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.2),
                        border: Border.all(
                            color:
                                AppColors.gold.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        widget.user.role == UserRole.admin ? 'ADMIN' : t('VIP'),
                        style: AppTextStyles.body(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.gold,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Email & Phone
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.email,
                                size: 12, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(
                              widget.user.email,
                              style: AppTextStyles.body(
                                fontSize: 12,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                        if (widget.user.phone != null &&
                            widget.user.phone!.isNotEmpty) ...[
                          Container(
                            width: 1,
                            height: 12,
                            margin: const EdgeInsets.symmetric(horizontal: 12),
                            color: Colors.grey.shade600,
                          ),
                          Row(
                            children: [
                              const Icon(Icons.phone,
                                  size: 12, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                widget.user.phone!,
                                style: AppTextStyles.body(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Admin Button (if admin)
                    if (widget.user.role == UserRole.admin) ...[
                      SizedBox(
                        width: double.infinity,
                        child: AppButton(
                          fullWidth: true,
                          onPressed: () => widget.setScreen(Screen.admin),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.dashboard, size: 18),
                              const SizedBox(width: 8),
                              Text(t('Open Admin')),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Stats Grid
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                              t('Total Games'),
                              widget.user.stats.gamesPlayed.toString(),
                              Colors.white),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildStatCard(t('Win Rate'), '$_winRate%',
                              AppColors.primary),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildStatCard(
                              t('Total Won'),
                              '${(widget.user.stats.totalWon / 1000).toStringAsFixed(1)}k',
                              AppColors.gold),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Quick Actions
              Row(
                children: [
                  Expanded(
                    child: _buildQuickAction(
                      icon: Icons.download,
                      label: t('Deposit'),
                      color: Colors.green,
                      onTap: () => widget.setScreen(Screen.wallet),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildQuickAction(
                      icon: Icons.upload,
                      label: t('Withdraw'),
                      color: Colors.red,
                      onTap: () => widget.setScreen(Screen.wallet),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Account Settings
              Text(
                t('Account Settings'),
                style: AppTextStyles.body(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMuted,
                  letterSpacing: 2,
                ),
              ),

              const SizedBox(height: 12),

              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _buildSettingTile(
                      icon: Icons.history,
                      label: t('Recent History'),
                      color: Colors.blue,
                      onTap: () => widget.setScreen(Screen.history),
                    ),
                    _buildDivider(),
                    _buildSettingTile(
                      icon: Icons.lock,
                      label: t('Change Password'),
                      color: Colors.orange,
                      onTap: () => setState(
                          () => _currentView = ProfileView.changePassword),
                    ),
                    _buildDivider(),
                    _buildSettingTile(
                      icon: Icons.volume_up,
                      label: t('Sound Settings'),
                      color: Colors.green,
                      onTap: () =>
                          setState(() => _currentView = ProfileView.sound),
                    ),
                    _buildDivider(),
                    _buildSettingTile(
                      icon: Icons.language,
                      label: '${t('Language')} / Langue',
                      color: Colors.purple,
                      trailing: Text(
                        widget.language,
                        style: AppTextStyles.body(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                      onTap: () =>
                          setState(() => _currentView = ProfileView.language),
                    ),
                  ],
                ),
              ),


              const SizedBox(height: 24),

              // Logout Button
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: widget.onLogout,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    foregroundColor: Colors.red,
                  ),
                  child: Text(
                    t('Logout').toUpperCase(),
                    style: AppTextStyles.body(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
    );
  }

  Widget _buildStatCard(String label, String value, Color valueColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: AppTextStyles.body(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: AppColors.textMuted,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.digital(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: AppColors.panel,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: AppTextStyles.body(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade300,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String label,
    required Color color,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: AppTextStyles.body(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              if (trailing != null) trailing,
              if (trailing == null)
                Icon(Icons.chevron_right,
                    color: Colors.grey.shade600, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: Colors.grey.shade800,
    );
  }

  Widget _buildContentView() {
    switch (_currentView) {
      case ProfileView.editProfile:
        return _buildEditProfileView();
      case ProfileView.changePassword:
        return _buildChangePasswordView();
      case ProfileView.language:
        return _buildLanguageView();
      case ProfileView.sound:
        return _buildSoundView();
      default:
        return const SizedBox();
    }
  }

  Widget _buildEditProfileView() {
    String name = widget.user.name;
    String email = widget.user.email;
    String phone = widget.user.phone ?? '';
    String avatarUrl = widget.user.avatarUrl;

    return StatefulBuilder(
      builder: (context, setState) {
        return Column(
          children: [
            // Avatar
            GestureDetector(
              onTap: () async {
                final picker = ImagePicker();
                final XFile? image =
                    await picker.pickImage(source: ImageSource.gallery);

                if (image != null) {
                  // In a real app, you would upload this to a server
                  // For now, we'll just update the local state with the path
                  // Note: On web, you might want to use image.path or image.readAsBytes()
                  setState(() {
                    avatarUrl = image.path;
                  });
                }
              },
              child: Stack(
                children: [
                  Container(
                    width: 128,
                    height: 128,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary.withValues(alpha: 0.7), AppColors.primary],
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.4),
                          blurRadius: 30,
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(3),
                    child: CircleAvatar(
                      backgroundImage: NetworkImage(avatarUrl),
                      backgroundColor: Colors.black,
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt,
                          color: Colors.black, size: 18),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            Text(
              t('Tap to change photo'),
              style: AppTextStyles.body(
                fontSize: 10,
                color: AppColors.textMuted,
                letterSpacing: 2,
              ),
            ),

            const SizedBox(height: 32),

            // Name Field
            TextField(
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: t('First Name'),
                labelStyle:
                    AppTextStyles.label(color: Colors.grey, fontSize: 10),
                prefixIcon: const Icon(Icons.person, color: Colors.grey),
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade700),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade700),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.primary),
                ),
              ),
              onChanged: (value) => name = value,
            ),

            const SizedBox(height: 16),

            // Email Field (Read-only)
            TextField(
              style: const TextStyle(color: Colors.grey),
              readOnly: true,
              decoration: InputDecoration(
                labelText: 'Email',
                labelStyle:
                    AppTextStyles.label(color: Colors.grey, fontSize: 10),
                prefixIcon: const Icon(Icons.email, color: Colors.grey),
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade700),
                ),
              ),
              controller: TextEditingController(text: email),
            ),

            const SizedBox(height: 16),

            // Phone Field
            TextField(
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: t('Phone Number'),
                labelStyle:
                    AppTextStyles.label(color: Colors.grey, fontSize: 10),
                prefixIcon: const Icon(Icons.phone, color: Colors.grey),
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade700),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade700),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.primary),
                ),
              ),
              keyboardType: TextInputType.phone,
              onChanged: (value) => phone = value,
            ),

            const SizedBox(height: 32),

            AppButton(
              fullWidth: true,
              onPressed: () {
                if (name.trim().length < 3) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Name too short.')),
                  );
                  return;
                }

                final updated = widget.user.copyWith(
                  name: name,
                  phone: phone,
                  avatarUrl: avatarUrl,
                );

                widget.setUser(updated);
                widget.onUpdateUser?.call(updated);

                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(t('Success'))),
                );

                setState(() => _currentView = ProfileView.menu);
              },
              child: Text(t('Save Changes')),
            ),
          ],
        );
      },
    );
  }

  Widget _buildChangePasswordView() {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool isLoading = false;
    String? error;

    return StatefulBuilder(
      builder: (context, setState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Update your account password for better security.',
              style: AppTextStyles.body(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 24),

            if (error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                ),
                child: Text(
                  error!,
                  style: const TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),

            // Old Password
            TextField(
              controller: oldPasswordController,
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('Current Password', Icons.lock_outline),
            ),
            const SizedBox(height: 16),

            // New Password
            TextField(
              controller: newPasswordController,
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('New Password', Icons.vpn_key_outlined),
            ),
            const SizedBox(height: 16),

            // Confirm Password
            TextField(
              controller: confirmPasswordController,
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('Confirm New Password', Icons.lock_reset),
            ),
            const SizedBox(height: 32),

            AppButton(
              fullWidth: true,
              disabled: isLoading,
              onPressed: () async {
                if (newPasswordController.text.isEmpty) {
                  setState(() => error = 'Please enter a new password');
                  return;
                }
                if (newPasswordController.text != confirmPasswordController.text) {
                  setState(() => error = 'Passwords do not match');
                  return;
                }

                setState(() {
                  isLoading = true;
                  error = null;
                });

                try {
                  // Using the resetPassword API as change password proxy
                  await AuthApi.resetPassword(
                    email: widget.user.email,
                    password: newPasswordController.text,
                  );
                  
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Password updated successfully!')),
                  );
                  this.setState(() => _currentView = ProfileView.menu);
                } catch (e) {
                  setState(() {
                    isLoading = false;
                    error = e.toString().replaceAll('Exception: ', '');
                  });
                }
              },
              child: Text(isLoading ? 'UPDATING...' : 'CHANGE PASSWORD'),
            ),
          ],
        );
      },
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: AppTextStyles.label(color: AppColors.textMuted, fontSize: 10),
      prefixIcon: Icon(icon, color: Colors.grey, size: 20),
      filled: true,
      fillColor: AppColors.panel,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade700),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade700),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.primary),
      ),
    );
  }

  Widget _buildLanguageView() {
    final languages = [
      {'name': 'English', 'flag': '🇬🇧', 'region': 'International'},
      {'name': 'Français', 'flag': '🇫🇷', 'region': 'Afrique Francophone'},
    ];

    return Column(
      children: languages.map((lang) {
        final isSelected = widget.language == lang['name'];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                widget.setLanguage(lang['name']!);
                setState(() => _currentView = ProfileView.menu);
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary.withValues(alpha: 0.1)
                      : AppColors.panel,
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.border,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Text(
                      lang['flag']!,
                      style: const TextStyle(fontSize: 32),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lang['name']!,
                            style: AppTextStyles.body(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.white,
                            ),
                          ),
                          Text(
                            lang['region']!,
                            style: AppTextStyles.body(
                              fontSize: 10,
                              color: AppColors.textMuted,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary
                                  .withValues(alpha: 0.5),
                              blurRadius: 10,
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
      }).toList(),
    );
  }

  Widget _buildSoundView() {
    final audioManager = AudioManager();
    final isMuted = audioManager.isMuted();
    bool testPlaying = false;

    return StatefulBuilder(
      builder: (context, setState) {
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.panel,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(
                    t('Audio System'),
                    style: AppTextStyles.body(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    t('Audio Desc'),
                    textAlign: TextAlign.center,
                    style: AppTextStyles.body(
                      color: AppColors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 24),
                  GestureDetector(
                    onTap: () {
                      audioManager.play(SoundType.success);
                      setState(() {
                        testPlaying = true;
                      });
                      Future.delayed(const Duration(seconds: 1), () {
                        if (mounted) {
                          setState(() {
                            testPlaying = false;
                          });
                        }
                      });
                    },
                    child: Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: testPlaying
                            ? AppColors.primary
                            : Colors.grey.shade800,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: testPlaying
                              ? AppColors.primary
                              : Colors.grey.shade600,
                          width: 4,
                        ),
                        boxShadow: testPlaying
                            ? [
                                BoxShadow(
                                  color: AppColors.primary
                                      .withValues(alpha: 0.5),
                                  blurRadius: 30,
                                ),
                              ]
                            : null,
                      ),
                      child: Icon(
                        testPlaying ? Icons.volume_up : Icons.play_arrow,
                        size: 40,
                        color: testPlaying ? Colors.black : Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    testPlaying ? t('Playing') : t('Tap Test'),
                    style: AppTextStyles.body(
                      fontSize: 10,
                      color: AppColors.textMuted,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Mute Toggle
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.panel,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.volume_off,
                          color: Colors.grey.shade400, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        t('Mute All'),
                        style: AppTextStyles.body(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  Switch(
                    value: isMuted,
                    onChanged: (value) {
                      audioManager.toggleMute();
                      setState(() {});
                    },
                    activeThumbColor: AppColors.primary,
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
