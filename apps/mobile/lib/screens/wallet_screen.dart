import 'package:flutter/material.dart';
import '../models/types.dart';
import '../utils/i18n.dart';
import '../utils/app_theme.dart';
import '../widgets/app_button.dart';
import 'package:url_launcher/url_launcher.dart';

class WalletScreen extends StatelessWidget {
  final User user;
  final Function(Screen) setScreen;
  final Function(User) setUser;
  final List<Transaction> transactions;
  final Function(Transaction) addTransaction;
  final Screen? returnScreen;
  final String language;

  const WalletScreen({
    super.key,
    required this.user,
    required this.setScreen,
    required this.setUser,
    required this.transactions,
    required this.addTransaction,
    this.returnScreen,
    this.language = 'English',
  });

  String t(String key) => I18n.translate(key, language);

  String get _formattedBalance {
    return user.wallet.balance.toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  @override
  Widget build(BuildContext context) {
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
                  icon: const Icon(Icons.arrow_back, color: AppColors.textMuted),
                  onPressed: () => setScreen(returnScreen ?? Screen.home),
                ),
                Expanded(
                  child: Text(
                    t('My Wallet'),
                    style: AppTextStyles.title(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Balance Card
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        Text(
                          t('Balance').toUpperCase(),
                          style: AppTextStyles.label(
                            fontSize: 12,
                            color: AppColors.textMuted,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '$_formattedBalance',
                          style: AppTextStyles.display(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'CFA',
                          style: AppTextStyles.label(
                            fontSize: 14,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          variant: ButtonVariant.primary,
                          fullWidth: true,
                          onPressed: () => _openWebWallet(context),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.add, size: 16, color: Colors.white),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  t('Deposit'),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppButton(
                          variant: ButtonVariant.secondary,
                          fullWidth: true,
                          onPressed: () => _openWebWallet(context),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.arrow_upward, size: 16, color: AppColors.textMain),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  t('Withdraw'),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Transactions Section
                  Text(
                    t('Recent Transactions').toUpperCase(),
                    style: AppTextStyles.label(
                      fontSize: 12,
                      color: AppColors.textMuted,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  if (transactions.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Center(
                        child: Text(
                          t('No transactions yet'),
                          style: AppTextStyles.body(color: AppColors.textMuted),
                        ),
                      ),
                    )
                  else
                    ...transactions.take(10).map((tx) => _buildTransactionItem(tx)),

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openWebWallet(BuildContext context) async {
    const url = 'https://dice-main-production.up.railway.app/dashboard/wallet';
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.surface,
            title: Text(t('Error'), style: AppTextStyles.title()),
            content: Text(t('Could not open web wallet'), style: AppTextStyles.body()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('OK', style: TextStyle(color: AppColors.primary)),
              ),
            ],
          ),
        );
      }
    }
  }

  Widget _buildTransactionItem(Transaction tx) {
    final isDeposit = tx.type == TransactionType.deposit;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDeposit 
                  ? AppColors.success.withValues(alpha: 0.1)
                  : AppColors.danger.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(
              isDeposit ? Icons.arrow_downward : Icons.arrow_upward,
              color: isDeposit ? AppColors.success : AppColors.danger,
              size: 18,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isDeposit ? t('Deposit') : t('Withdraw'),
                  style: AppTextStyles.body(
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMain,
                  ),
                ),
                Text(
                  tx.date,
                  style: AppTextStyles.label(
                    fontSize: 11,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isDeposit ? '+' : '-'}${tx.amount.toInt()} CFA',
            style: AppTextStyles.body(
              fontWeight: FontWeight.w600,
              color: isDeposit ? AppColors.success : AppColors.danger,
            ),
          ),
        ],
      ),
    );
  }
}
