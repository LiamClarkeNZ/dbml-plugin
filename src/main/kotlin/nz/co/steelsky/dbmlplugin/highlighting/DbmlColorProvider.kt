package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.ElementColorProvider
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiElement
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes
import java.awt.Color

class DbmlColorProvider : ElementColorProvider {

    private var lastDocument: Document? = null
    private var lastStartOffset: Int = -1
    private var lastEndOffset: Int = -1

    override fun getColorFrom(element: PsiElement): Color? {
        if (element.node.elementType != DbmlTypes.COLOR_CODE) return null
        val hex = element.text.removePrefix("#")
        return when (hex.length) {
            6 -> parseHex6(hex)
            3 -> parseHex3(hex)
            else -> null
        }
    }

    override fun setColorTo(element: PsiElement, color: Color) {
        val hex = String.format("#%02x%02x%02x", color.red, color.green, color.blue)

        if (element.isValid) {
            val document = PsiDocumentManager.getInstance(element.project)
                .getDocument(element.containingFile) ?: return
            val range = element.textRange
            document.replaceString(range.startOffset, range.endOffset, hex)
            lastDocument = document
            lastStartOffset = range.startOffset
            lastEndOffset = range.startOffset + hex.length
        } else {
            val document = lastDocument ?: return
            if (lastStartOffset < 0 || lastEndOffset < 0) return
            document.replaceString(lastStartOffset, lastEndOffset, hex)
            lastEndOffset = lastStartOffset + hex.length
        }
    }

    private fun parseHex6(hex: String): Color? =
        runCatching { Color(hex.toInt(16)) }.getOrNull()

    private fun parseHex3(hex: String): Color? {
        val r = hex[0].toString().repeat(2).toInt(16)
        val g = hex[1].toString().repeat(2).toInt(16)
        val b = hex[2].toString().repeat(2).toInt(16)
        return Color(r, g, b)
    }
}
