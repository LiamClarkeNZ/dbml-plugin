package nz.co.steelsky.dbmlplugin.preview

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RenderBridgeTest {

    @Test
    fun `escapes quotes backslashes and newlines but leaves angle brackets`() {
        val out = RenderBridge.jsStringLiteral("""a"b\c</script>""" + "\n")
        assertEquals(""""a\"b\\c</script>\n"""", out)
    }

    @Test
    fun `renderCall embeds json as a string argument`() {
        val call = RenderBridge.renderCall("""{"k":"v"}""", "h1")
        assertEquals("""window.render("{\"k\":\"v\"}", "h1");""", call)
    }

    @Test
    fun `applyThemeCall builds an object literal`() {
        val call = RenderBridge.applyThemeCall(linkedMapOf("--dbml-bg" to "#fff"))
        assertTrue(call.startsWith("window.applyTheme({"))
        assertTrue(call.contains(""""--dbml-bg":"#fff""""))
    }
}
