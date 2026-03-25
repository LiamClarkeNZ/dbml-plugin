package nz.co.steelsky.dbmlplugin.parser

import com.intellij.testFramework.ParsingTestCase

class DbmlParserBenchmarkTest : ParsingTestCase("", "dbml", DbmlParserDefinition()) {
    override fun getTestDataPath(): String = "src/test/testData/parser"
    override fun skipSpaces(): Boolean = false
    override fun includeRanges(): Boolean = true

    fun testParserPerformance() {
        val largeDbml = buildString {
            repeat(500) { i ->
                appendLine("Table table_$i [headercolor: #3498db] {")
                appendLine("  id integer [pk, increment]")
                repeat(8) { j ->
                    appendLine("  col_$j varchar(255) [not null]")
                }
                appendLine("")
                appendLine("  indexes {")
                appendLine("    col_0 [type: btree]")
                appendLine("    (col_0, col_1) [unique, pk]")
                appendLine("  }")
                appendLine("}")
                appendLine()
            }
        }

        // Warmup
        createPsiFile("warmup", largeDbml)

        val startMs = System.currentTimeMillis()
        val psiFile = createPsiFile("large", largeDbml)
        val elapsedMs = System.currentTimeMillis() - startMs

        assertNotNull(psiFile)
        println("Parser benchmark: ${largeDbml.length} chars (500 tables, ~${largeDbml.lines().size} lines)")
        println("Parse time: ${elapsedMs}ms")

        assertTrue("Parser too slow: ${elapsedMs}ms (expected <2000ms)", elapsedMs < 2000)

        // Verify no errors in PSI tree
        val text = toParseTreeText(psiFile, skipSpaces(), includeRanges())
        assertFalse("PSI tree contains error elements", text.contains("PsiErrorElement"))
    }
}
