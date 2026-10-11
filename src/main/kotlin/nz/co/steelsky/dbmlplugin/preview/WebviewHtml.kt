package nz.co.steelsky.dbmlplugin.preview

/** Loads the bundled single-file webview (built by the `:buildWebview` Gradle task). */
object WebviewHtml {

    const val RESOURCE = "/webview/index.html"

    val FALLBACK: String =
        "<!doctype html><html><body style=\"font-family:sans-serif;padding:16px\">" +
            "DBML preview is unavailable (webview bundle not found)." +
            "</body></html>"

    fun loadFrom(resourcePath: String): String =
        WebviewHtml::class.java.getResourceAsStream(resourcePath)
            ?.bufferedReader()
            ?.use { it.readText() }
            ?: FALLBACK

    fun load(): String = loadFrom(RESOURCE)
}
