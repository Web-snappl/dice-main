import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/types.dart';
import '../utils/i18n.dart';
import '../utils/audio.dart';
import '../widgets/neon_button.dart';

enum WalletView { main, depositMethods, withdrawMethods }

class WalletScreen extends StatefulWidget {
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

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final String _websiteUrl = 'https://diceworld.com/wallet'; // Placeholder

  String t(String key) => I18n.translate(key, widget.language);

  void _handleBack() {
    widget.setScreen(widget.returnScreen ?? Screen.home);
  }

  Future<void> _launchWebPortal() async {
    AudioManager().play(SoundType.click);
    final Uri url = Uri.parse(_websiteUrl);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not launch $_websiteUrl')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SafeArea(
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFF1F2833),
                  border: Border(bottom: BorderSide(color: Colors.grey, width: 0.5)),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left, color: Colors.grey),
                      onPressed: _handleBack,
                    ),
                    Expanded(
                      child: Text(
                        t('My Wallet'),
                        style: GoogleFonts.orbitron(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
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
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1F2833), Colors.black],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.grey.shade800),
                        ),
                        child: Column(
                          children: [
                            Text(
                              t('Coin Balance'),
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey,
                                letterSpacing: 1.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${widget.user.wallet.balance.toInt().toStringAsFixed(0).replaceAllMapped(
                                    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                                    (Match m) => '${m[1]},',
                                  )} Coins',
                              style: GoogleFonts.rajdhani(
                                fontSize: 48,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF66FCF1),
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
                            child: _buildActionButton(
                              icon: Icons.add_circle_outline,
                              label: t('Get Coins'),
                              color: Colors.green,
                              onTap: _launchWebPortal,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildActionButton(
                              icon: Icons.output,
                              label: t('Sell Coins'),
                              color: Colors.orange,
                              onTap: _launchWebPortal,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Info Box
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF151921),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.blue.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline, color: Colors.blue, size: 24),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                t('Wallet Web Info'), // Need to add this translation key or hardcode for now
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.grey.shade300,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 24),

                      // Recent History
                      Text(
                        t('Coin Transactions'),
                        style: GoogleFonts.orbitron(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 12),
                      widget.transactions.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(32),
                              child: Text(
                                t('No Transactions Yet'),
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.grey,
                                  letterSpacing: 2,
                                ),
                              ),
                            )
                          : Column(
                              children: widget.transactions.take(5).map((tx) {
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF151a21),
                                    border: Border.all(color: Colors.grey.shade800),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: tx.type == TransactionType.deposit
                                              ? Colors.green.withOpacity(0.1)
                                              : Colors.orange.withOpacity(0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          tx.type == TransactionType.deposit
                                              ? Icons.arrow_downward
                                              : Icons.arrow_upward,
                                          color: tx.type == TransactionType.deposit
                                              ? Colors.green
                                              : Colors.orange,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              tx.type == TransactionType.deposit
                                                  ? t('Purchased Coins')
                                                  : t('Sold Coins'),
                                              style: GoogleFonts.poppins(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                            Text(
                                              tx.date,
                                              style: GoogleFonts.poppins(
                                                fontSize: 10,
                                                color: Colors.grey.shade500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        '${tx.type == TransactionType.deposit ? '+' : '-'}${tx.amount.toInt()}',
                                        style: GoogleFonts.rajdhani(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: tx.type == TransactionType.deposit
                                              ? Colors.green.shade400
                                              : Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          border: Border.all(color: color.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: Colors.black, // High contrast
                size: 28,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: GoogleFonts.orbitron(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
