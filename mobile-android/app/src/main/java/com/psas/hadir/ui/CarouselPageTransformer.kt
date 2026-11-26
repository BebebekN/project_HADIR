package com.psas.hadir.ui

import android.view.View
import androidx.viewpager2.widget.ViewPager2
import kotlin.math.abs

/**
 * Animasi slide halus pada carousel "Jadwalmu Hari Ini"
 */
class CarouselPageTransformer : ViewPager2.PageTransformer {
    override fun transformPage(page: View, position: Float) {
        val absPos = abs(position)
        page.apply {
            val scale = 1f - (0.06f * absPos.coerceAtMost(1f))
            scaleX = scale
            scaleY = scale
            alpha = 1f - (0.28f * absPos.coerceAtMost(1f))
            translationX = -position * 18f
        }
    }
}
