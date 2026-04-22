package nz.co.steelsky.dbmlplugin.parser

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

    fun testTableGroup() {
        doTest(true)
    }

    fun testFullExample() {
        doTest(true)
    }

    fun testInvalidSyntax() {
        doTest(true)
    }

    fun testRecords() {
        doTest(true)
    }

    override fun getTestDataPath(): String = "src/test/testData/parser"
    override fun skipSpaces(): Boolean = false
    override fun includeRanges(): Boolean = true
}
