package nz.co.steelsky.dbmlplugin.preview

import com.intellij.testFramework.fixtures.BasePlatformTestCase

class DbmlPreviewFileEditorProviderTest : BasePlatformTestCase() {

    private val provider = DbmlPreviewFileEditorProvider()

    fun testAcceptsDbmlFiles() {
        val file = myFixture.configureByText("schema.dbml", "Table t {\n  id int\n}").virtualFile
        assertTrue(provider.accept(project, file))
    }

    fun testRejectsOtherFiles() {
        val file = myFixture.configureByText("notes.txt", "hello").virtualFile
        assertFalse(provider.accept(project, file))
    }

    fun testStableEditorTypeId() {
        assertEquals("dbml-preview", provider.editorTypeId)
    }
}
