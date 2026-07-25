package nz.co.steelsky.dbmlplugin.preview

import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.colors.EditorColorsManager
import com.intellij.ui.ColorUtil
import java.awt.Color

/**
 * Maps the current editor colour scheme to the CSS variables the webview consumes.
 *
 * Every value derives from the scheme's own background/foreground pair. The IDE's look-and-feel is
 * deliberately not consulted: IntelliJ lets any theme be paired with any editor colour scheme, so
 * blending LAF surface colours with scheme text colours produces an incoherent palette (a light
 * canvas behind dark cards, near-black text on them) for anyone running a mixed pairing.
 */
object ThemeVars {

    fun currentThemeVars(): Map<String, String> {
        val scheme = EditorColorsManager.getInstance().globalScheme
        val fg = scheme.defaultForeground
        // Keyword colours are designed to be legible against the editor background, which is exactly
        // what a highlight needs; fall back to the plain foreground when a scheme defines none.
        val accent = scheme.getAttributes(DefaultLanguageHighlighterColors.KEYWORD)?.foregroundColor ?: fg
        return palette(scheme.defaultBackground, fg) +
            mapOf(
                "--dbml-accent" to hex(accent),
                "--dbml-font" to fontStack(scheme.editorFontName),
            )
    }

    /** Derives the whole palette from one background/foreground pair. */
    fun palette(bg: Color, fg: Color): Map<String, String> {
        // Surfaces step towards whichever pole contrasts with the background - white on a dark
        // scheme, black on a light one - while the canvas always steps towards black. Cards
        // therefore read as raised above the canvas in either direction.
        val contrast = if (ColorUtil.isDark(bg)) Color.WHITE else Color.BLACK
        return linkedMapOf(
            "--dbml-bg" to hex(mix(bg, Color.BLACK, CANVAS_RECESS)),
            "--dbml-fg" to hex(fg),
            "--dbml-node-bg" to hex(bg),
            "--dbml-header-bg" to hex(mix(bg, contrast, HEADER_STEP)),
            "--dbml-border" to hex(mix(bg, contrast, BORDER_STEP)),
            "--dbml-row-hover" to hex(mix(bg, contrast, HOVER_STEP)),
            "--dbml-badge-bg" to hex(mix(bg, contrast, BADGE_STEP)),
            "--dbml-badge-fg" to hex(fg),
            "--dbml-edge" to hex(mix(bg, fg, EDGE_BLEND)),
        )
    }

    fun hex(c: Color): String = "#%02x%02x%02x".format(c.red, c.green, c.blue)

    /**
     * Blends per sRGB channel rather than via [ColorUtil.mix], whose blending space is an
     * implementation detail: the step constants below are tuned as plain channel fractions.
     */
    private fun mix(from: Color, towards: Color, fraction: Double): Color {
        fun channel(a: Int, b: Int) = (a + (b - a) * fraction).toInt().coerceIn(0, 255)
        return Color(
            channel(from.red, towards.red),
            channel(from.green, towards.green),
            channel(from.blue, towards.blue),
        )
    }

    private const val CANVAS_RECESS = 0.06
    private const val HOVER_STEP = 0.06
    private const val HEADER_STEP = 0.11
    private const val BADGE_STEP = 0.16
    private const val BORDER_STEP = 0.24
    private const val EDGE_BLEND = 0.55
}

/**
 * A CSS font-family value for an IDE font name. Single quotes avoid nesting inside the double-quoted
 * JS literal the bridge builds, and characters that could terminate the CSS value are dropped.
 */
internal fun fontStack(family: String): String {
    val safe = family.filterNot { it == '\'' || it == '"' || it == ';' || it == '\\' }.trim()
    return if (safe.isEmpty()) "monospace" else "'$safe', monospace"
}
