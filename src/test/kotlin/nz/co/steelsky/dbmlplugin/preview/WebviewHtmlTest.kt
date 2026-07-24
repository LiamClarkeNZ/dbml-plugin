package nz.co.steelsky.dbmlplugin.preview

import org.junit.Assert.assertTrue
import org.junit.Test

class WebviewHtmlTest {

    @Test
    fun `loads an existing resource`() {
        val html = WebviewHtml.loadFrom("/webview-test.html")
        assertTrue(html.contains("fixture-webview"))
    }

    @Test
    fun `falls back when the resource is missing`() {
        val html = WebviewHtml.loadFrom("/does-not-exist.html")
        assertTrue(html.contains("unavailable"))
    }
}
