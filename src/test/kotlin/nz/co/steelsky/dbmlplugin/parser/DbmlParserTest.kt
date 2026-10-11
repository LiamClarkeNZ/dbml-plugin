package nz.co.steelsky.dbmlplugin.parser

import com.intellij.psi.PsiErrorElement
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.testFramework.ParsingTestCase

class DbmlParserTest : ParsingTestCase("", "dbml", DbmlParserDefinition()) {

    fun testSimpleTable() {
        doTest(true)
    }

    fun testTableWithSettings() {
        doTest(true)
    }

    fun testEnum() {
        doTest(true)
    }

    fun testRef() {
        doTest(true)
    }

    fun testProject() {
        doTest(true)
    }

    fun testIndexes() {
        doTest(true)
    }

    fun testChecks() {
        doTest(true, true)
    }

    fun testTableGroup() {
        doTest(true)
    }

    fun testFullExample() {
        doTest(true)
    }

    fun testSchemaQualifiedColumnType() {
        doTest(true, true)
    }

    fun testInvalidSyntax() {
        doTest(true)
    }

    fun testRecords() {
        doTest(true, true)
    }

    fun testRecordsAsName() {
        doTest(true, true)
    }

    fun testRecordsExample() {
        doTest(true, true)
    }

    fun testRecordsRowsMustBeOnSeparateLines() {
        assertHasErrors("records t(a, b) {\n  1 'a'\n}")
        assertHasErrors("records t(a) {\n  1 2\n}")
    }

    fun testStandaloneRecordsRequireColumnList() {
        assertHasErrors("records t {\n  1\n}")
    }

    private fun assertHasErrors(src: String) {
        val file = createPsiFile("test", src)
        assertTrue(
            "expected a parse error in:\n$src",
            PsiTreeUtil.findChildrenOfType(file, PsiErrorElement::class.java).isNotEmpty(),
        )
    }

    override fun getTestDataPath(): String = "src/test/testData/parser"
    override fun skipSpaces(): Boolean = false
    override fun includeRanges(): Boolean = true
}
