package nz.co.steelsky.dbmlplugin.preview

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.ui.ColorUtil
import java.awt.Color

class ThemeVarsTest : BasePlatformTestCase() {

    fun testProducesEveryDocumentedVariableAsHex() {
        val vars = ThemeVars.currentThemeVars()
        val colourKeys = setOf(
            "--dbml-bg", "--dbml-fg", "--dbml-node-bg", "--dbml-header-bg",
            "--dbml-border", "--dbml-row-hover", "--dbml-badge-bg", "--dbml-badge-fg", "--dbml-edge",
        )
        assertEquals(colourKeys + "--dbml-font", vars.keys)
        val hex = Regex("^#[0-9a-f]{6}$")
        colourKeys.forEach { name ->
            assertTrue("$name should be #rrggbb but was ${vars[name]}", hex.matches(vars.getValue(name)))
        }
    }

    fun testFontStackQuotesTheFamilyAndKeepsAFallback() {
        assertEquals("'JetBrains Mono', monospace", fontStack("JetBrains Mono"))
    }

    fun testFontStackStripsCharactersThatWouldBreakTheCssValue() {
        assertEquals("'Menlo', monospace", fontStack("Men'lo\";"))
    }

    fun testCurrentThemeVarsCarriesTheEditorFont() {
        val vars = ThemeVars.currentThemeVars()
        val font = vars["--dbml-font"]
        assertNotNull(font)
        assertTrue("font stack should end in a generic fallback but was $font", font!!.endsWith("monospace"))
    }

    fun testHexFormatsColour() {
        assertEquals("#0a141e", ThemeVars.hex(Color(10, 20, 30)))
    }

    fun testDarkSchemeLiftsSurfacesAboveTheCanvas() {
        val p = ThemeVars.palette(DARK_BG, DARK_FG)
        assertTrue("cards should sit above the canvas", lum(p, "--dbml-node-bg") > lum(p, "--dbml-bg"))
        assertTrue("headers should sit above cards", lum(p, "--dbml-header-bg") > lum(p, "--dbml-node-bg"))
        assertTrue("borders should sit above headers", lum(p, "--dbml-border") > lum(p, "--dbml-header-bg"))
    }

    fun testLightSchemeSinksTheCanvasBelowSurfaces() {
        val p = ThemeVars.palette(Color.WHITE, LIGHT_FG)
        assertTrue("canvas should recede behind cards", lum(p, "--dbml-bg") < lum(p, "--dbml-node-bg"))
        assertTrue("headers should be tinted below cards", lum(p, "--dbml-header-bg") < lum(p, "--dbml-node-bg"))
        assertTrue("borders should be darker than headers", lum(p, "--dbml-border") < lum(p, "--dbml-header-bg"))
    }

    /**
     * Regression guard. The palette used to take text colours from the editor scheme and surface
     * colours from the LAF, so a dark theme paired with a light editor scheme painted near-black
     * text onto dark cards. Deriving every value from one background/foreground pair keeps text
     * readable on every surface it can land on.
     */
    fun testTextStaysReadableOnEverySurface() {
        listOf(DARK_BG to DARK_FG, Color.WHITE to LIGHT_FG).forEach { (bg, fg) ->
            val p = ThemeVars.palette(bg, fg)
            listOf("--dbml-node-bg", "--dbml-header-bg", "--dbml-row-hover").forEach { surface ->
                assertContrast(p, "--dbml-fg", surface)
            }
            assertContrast(p, "--dbml-badge-fg", "--dbml-badge-bg")
        }
    }

    fun testEdgesAreVisibleAgainstTheCanvas() {
        listOf(DARK_BG to DARK_FG, Color.WHITE to LIGHT_FG).forEach { (bg, fg) ->
            val p = ThemeVars.palette(bg, fg)
            val ratio = contrast(lum(p, "--dbml-edge"), lum(p, "--dbml-bg"))
            assertTrue("edges only reach %.1f:1 against the canvas".format(ratio), ratio >= 2.0)
        }
    }

    private fun colour(p: Map<String, String>, name: String): Color =
        Color(Integer.parseInt(p.getValue(name).removePrefix("#"), 16))

    private fun lum(p: Map<String, String>, name: String): Double =
        ColorUtil.getLuminance(colour(p, name))

    private fun contrast(a: Double, b: Double): Double =
        (maxOf(a, b) + 0.05) / (minOf(a, b) + 0.05)

    private fun assertContrast(p: Map<String, String>, fgVar: String, bgVar: String) {
        val ratio = contrast(lum(p, fgVar), lum(p, bgVar))
        assertTrue("$fgVar on $bgVar is only %.1f:1".format(ratio), ratio >= 4.5)
    }

    private companion object {
        val DARK_BG = Color(0x1e, 0x1f, 0x22)
        val DARK_FG = Color(0xbc, 0xbe, 0xc4)
        val LIGHT_FG = Color(0x08, 0x08, 0x08)
    }
}
