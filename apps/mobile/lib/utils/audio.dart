import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum SoundType {
  roll,
  win,
  loss,
  click,
  success,
}

/// AudioManager with synthesized sounds (no audio files required)
/// Mimics the React Web Audio API implementation
class AudioManager {
  static final AudioManager _instance = AudioManager._internal();
  factory AudioManager() => _instance;
  AudioManager._internal();

  void _log(String message) {
    if (kDebugMode) debugPrint('[AudioManager] $message');
  }

  final Map<SoundType, Source> _sources = {
    SoundType.click: UrlSource('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    SoundType.roll: UrlSource('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'),
    SoundType.win: UrlSource('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    SoundType.loss: UrlSource('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3'),
    SoundType.success: UrlSource('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
  };

  final List<AudioPlayer> _players = [];
  bool _muted = false;
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    
    try {
      final prefs = await SharedPreferences.getInstance();
      _muted = prefs.getBool('app_muted') ?? false;
      
      // Pre-warm players and cache sources
      for (int i = 0; i < 3; i++) {
        _players.add(AudioPlayer());
      }
      
      _initialized = true;
      _log('Audio initialized. Muted: $_muted');
    } catch (e) {
      _muted = false;
      _log('Audio init error: $e');
    }
  }

  AudioPlayer _getAvailablePlayer() {
    for (var player in _players) {
      if (player.state != PlayerState.playing) {
        return player;
      }
    }
    final newPlayer = AudioPlayer();
    _players.add(newPlayer);
    return newPlayer;
  }

  Future<void> play(SoundType sound) async {
    if (_muted) return;
    if (!_initialized) await init();

    final source = _sources[sound];
    if (source == null) return;

    try {
      final player = _getAvailablePlayer();
      await player.stop(); // Ensure it starts from beginning
      await player.setVolume(0.5);
      // Using play(source) directly is generally fast if Source is already created
      await player.play(source);
    } catch (e) {
      _log('Audio play error: $e');
    }
  }

  // Removed individual _playXXXX methods to use the generic play()
  Future<void> _playClick() => play(SoundType.click);
  Future<void> _playRoll() => play(SoundType.roll);
  Future<void> _playWin() => play(SoundType.win);
  Future<void> _playLoss() => play(SoundType.loss);
  Future<void> _playSuccess() => play(SoundType.success);

  Future<void> _playUrl(String url) async {
    if (_muted) return;
    if (!_initialized) await init();
    
    final player = _getAvailablePlayer();
    try {
      await player.setVolume(0.5);
      await player.play(UrlSource(url));
    } catch (e) {
      _log('Error playing sound $url: $e');
    }
  }

  Future<bool> toggleMute() async {
    _muted = !_muted;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('app_muted', _muted);
    } catch (e) {
      _log('Toggle mute error: $e');
    }
    
    // Stop all playing sounds when muting
    if (_muted) {
      for (var player in _players) {
        try {
          await player.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }
    }
    
    return _muted;
  }

  bool isMuted() => _muted;

  /// Resume audio context (for user interaction unlock)
  Future<void> resume() async {
    // In Flutter, audio doesn't need explicit resume like Web Audio API
    // This method is here for API compatibility
    await init();
  }

  /// Dispose all audio players
  Future<void> dispose() async {
    for (var player in _players) {
      try {
        await player.dispose();
      } catch (e) {
        // Ignore disposal errors
      }
    }
    _players.clear();
    _initialized = false;
  }
}
