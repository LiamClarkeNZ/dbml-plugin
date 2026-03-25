package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes
import java.awt.Color

class DbmlColorProviderTest : BasePlatformTestCase() {
    private val provider = DbmlColorProvider()

    fun testGetColorFrom6Digit() {
        val file = myFixture.configureByText("test.dbml", "Table t [headercolor: #3498db] {}")
        val colorElement = findColorCodeElement(file)
        assertNotNull("Expected COLOR_CODE element", colorElement)
        val color = provider.getColorFrom(colorElement!!)
        assertEquals(Color(0x34, 0x98, 0xdb), color)
    }

    fun testGetColorFrom3Digit() {
        val file = myFixture.configureByText("test.dbml", "Table t [headercolor: #fff] {}")
        val colorElement = findColorCodeElement(file)
        assertNotNull("Expected COLOR_CODE element", colorElement)
        val color = provider.getColorFrom(colorElement!!)
        assertEquals(Color(255, 255, 255), color)
    }

    fun testSetColorTo() {
        val file = myFixture.configureByText("test.dbml", "Table t [headercolor: #3498db] {}")
        val colorElement = findColorCodeElement(file)
        assertNotNull("Expected COLOR_CODE element", colorElement)
        com.intellij.openapi.command.WriteCommandAction.runWriteCommandAction(project) {
            provider.setColorTo(colorElement!!, Color(0xff, 0x00, 0xaa))
        }
        val document = com.intellij.psi.PsiDocumentManager.getInstance(project).getDocument(file)!!
        assertTrue("Expected document to contain #ff00aa after setColorTo, but got: ${document.text}", document.text.contains("#ff00aa"))
    }

    fun testGetColorFromNonColorElement() {
        val file = myFixture.configureByText("test.dbml", "Table t {}")
        val firstLeaf = file.viewProvider.findElementAt(0)
        assertNotNull(firstLeaf)
        assertNull(provider.getColorFrom(firstLeaf!!))
    }

    private fun findColorCodeElement(file: com.intellij.psi.PsiFile): com.intellij.psi.PsiElement? {
        val text = file.text
        for (i in text.indices) {
            val element = file.findElementAt(i)
            if (element != null && element.node.elementType == DbmlTypes.COLOR_CODE) {
                return element
            }
        }
        return null
    }
}
