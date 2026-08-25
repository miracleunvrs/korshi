import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../theme/app_colors.dart';

class AppAvatar extends StatelessWidget {
  final String? imageUrl;
  final String fallback;
  final double size;
  final bool verified;
  final bool isOfficial;

  const AppAvatar({
    super.key,
    this.imageUrl,
    required this.fallback,
    this.size = 40,
    this.verified = false,
    this.isOfficial = false,
  });

  @override
  Widget build(BuildContext context) {
    final radius = size / 2;
    Widget avatar;
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      avatar = ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: CachedNetworkImage(
          imageUrl: imageUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(
            width: size,
            height: size,
            color: AppColors.primaryLight,
            child: Center(
              child: Text(
                fallback,
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          errorWidget: (_, __, ___) => _fallback(),
        ),
      );
    } else {
      avatar = _fallback();
    }

    if (!verified && !isOfficial) return avatar;

    return Stack(
      children: [
        avatar,
        if (isOfficial)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: const Icon(Icons.verified, size: 10, color: Colors.white),
            ),
          )
        else if (verified)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 1.5),
              ),
              child: const Icon(Icons.check, size: 8, color: Colors.white),
            ),
          ),
      ],
    );
  }

  Widget _fallback() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(size / 2),
      ),
      child: Center(
        child: Text(
          fallback.characters.take(2).toString().toUpperCase(),
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
            fontSize: size * 0.32,
          ),
        ),
      ),
    );
  }
}
