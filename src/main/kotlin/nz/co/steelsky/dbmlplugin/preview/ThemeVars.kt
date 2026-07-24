package nz.co.steelsky.dbmlplugin.preview

import com.intellij.openapi.editor.colors.EditorColorsManager
import com.intellij.ui.JBColor
import com.intellij.util.ui.UIUtil
import java.awt.Color

/** Maps the current IDE theme to the CSS variables the webview consumes. */
object ThemeVars {

    fun currentThemeVars(): Map<String, String> {
        val scheme = EditorColorsManager.getInstance().globalScheme
        val bg = scheme.defaultBackground
        val fg = scheme.defaultForeground
        val panel = UIUtil.getPanelBackground()
        val header = if (isDark(panel)) panel.brighter() else panel.darker()
        val border = JBColor.border()
        val hover = if (isDark(bg)) bg.brighter() else bg.darker()
        val badgeBg = if (isDark(panel)) panel.brighter() else panel.darker()
        val label = UIUtil.getLabelForeground()
        return linkedMapOf(
            "--dbml-bg" to hex(bg),
            "--dbml-fg" to hex(fg),
            "--dbml-node-bg" to hex(panel),
            "--dbml-header-bg" to hex(header),
            "--dbml-border" to hex(border),
            "--dbml-row-hover" to hex(hover),
            "--dbml-badge-bg" to hex(badgeBg),
            "--dbml-badge-fg" to hex(label),
            "--dbml-edge" to hex(border),
        )
    }

    fun hex(c: Color): String = "#%02x%02x%02x".format(c.red, c.green, c.blue)

    private fun isDark(c: Color): Boolean =
        (0.299 * c.red + 0.587 * c.green + 0.114 * c.blue) < 128
}
