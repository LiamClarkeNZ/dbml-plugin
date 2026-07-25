package nz.co.steelsky.dbmlplugin.preview

/** Builds JavaScript snippets that are injected into the webview via `executeJavaScript`. */
object RenderBridge {

    /** A double-quoted JS string literal safe to embed in injected script. */
    fun jsStringLiteral(s: String): String {
        val sb = StringBuilder(s.length + 2)
        sb.append('"')
        for (c in s) {
            when {
                c == '\\' -> sb.append("\\\\")
                c == '"' -> sb.append("\\\"")
                c == '\n' -> sb.append("\\n")
                c == '\r' -> sb.append("\\r")
                c == '\t' -> sb.append("\\t")
                c.code == 0x2028 -> sb.append("\\u2028") // JS line separator: illegal in a string literal
                c.code == 0x2029 -> sb.append("\\u2029") // JS paragraph separator
                c < ' ' -> sb.append("\\u%04x".format(c.code))
                else -> sb.append(c)
            }
        }
        sb.append('"')
        return sb.toString()
    }

    fun renderCall(json: String, hash: String): String =
        "window.render(${jsStringLiteral(json)}, ${jsStringLiteral(hash)});"

    fun applyThemeCall(vars: Map<String, String>): String {
        val body = vars.entries.joinToString(",") { (k, v) ->
            "${jsStringLiteral(k)}:${jsStringLiteral(v)}"
        }
        return "window.applyTheme({$body});"
    }
}
