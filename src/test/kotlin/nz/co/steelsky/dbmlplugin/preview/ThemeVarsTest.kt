package nz.co.steelsky.dbmlplugin.preview

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import java.awt.Color

class ThemeVarsTest : BasePlatformTestCase() {

    fun testProducesEveryDocumentedVariableAsHex() {
        val vars = ThemeVars.currentThemeVars()
        val expected = setOf(
            "--dbml-bg", "--dbml-fg", "--dbml-node-bg", "--dbml-header-bg",
            "--dbml-border", "--dbml-row-hover", "--dbml-badge-bg", "--dbml-badge-fg", "--dbml-edge",
        )
        assertEquals(expected, vars.keys)
        val hex = Regex("^#[0-9a-f]{6}$")
        vars.forEach { (name, value) ->
            assertTrue("$name should be #rrggbb but was $value", hex.matches(value))
        }
    }

    fun testHexFormatsColour() {
        assertEquals("#0a141e", ThemeVars.hex(Color(10, 20, 30)))
    }
}
