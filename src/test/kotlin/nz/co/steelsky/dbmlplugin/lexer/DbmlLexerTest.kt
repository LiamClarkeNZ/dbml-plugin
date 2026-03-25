package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.testFramework.LexerTestCase

class DbmlLexerTest : LexerTestCase() {
    override fun createLexer() = DbmlLexerAdapter()
    override fun getDirPath() = "src/test/testData/lexer"

    fun testKeywords() {
        doTest(
            "Table Enum Ref Project",
            """'Table' ('Table')
WHITE_SPACE (' ')
'Enum' ('Enum')
WHITE_SPACE (' ')
'Ref' ('Ref')
WHITE_SPACE (' ')
'Project' ('Project')"""
        )
    }

    fun testOperators() {
        doTest(
            "< > - <>",
            """'<' ('<')
WHITE_SPACE (' ')
'>' ('>')
WHITE_SPACE (' ')
'-' ('-')
WHITE_SPACE (' ')
'<>' ('<>')"""
        )
    }

    fun testNumbers() {
        doTest(
            "42 3.14",
            """number ('42')
WHITE_SPACE (' ')
number ('3.14')"""
        )
    }

    fun testComments() {
        doTest(
            "// line comment\n/* block */",
            """LINE_COMMENT ('// line comment')
new line ('\n')
BLOCK_COMMENT ('/* block */')"""
        )
    }

    fun testColorCode() {
        doTest(
            "#fff #aabbcc",
            """colour code ('#fff')
WHITE_SPACE (' ')
colour code ('#aabbcc')"""
        )
    }

    fun testIdentifiersAndNewlines() {
        doTest(
            "my_table\nmy_column",
            """identifier ('my_table')
new line ('\n')
identifier ('my_column')"""
        )
    }

    fun testTableDefinition() {
        doTest(
            "Table users {\n  id integer [pk]\n}",
            """'Table' ('Table')
WHITE_SPACE (' ')
identifier ('users')
WHITE_SPACE (' ')
'{' ('{')
new line ('\n')
WHITE_SPACE ('  ')
identifier ('id')
WHITE_SPACE (' ')
identifier ('integer')
WHITE_SPACE (' ')
'[' ('[')
'pk' ('pk')
']' (']')
new line ('\n')
'}' ('}')"""
        )
    }

    fun testSingleQuotedString() {
        doTest(
            "'hello world'",
            "string (''hello world'')"
        )
    }

    fun testDoubleQuotedString() {
        doTest(
            "\"hello world\"",
            "quoted identifier ('\"hello world\"')"
        )
    }

    fun testTripleQuotedString() {
        doTest(
            "'''multi\nline'''",
            """''' (''''')
string content ('multi')
new line ('\n')
string content ('line')
''' (''''')"""
        )
    }

    fun testTripleQuotedStringWithEscapes() {
        doTest(
            "'''it\\'s a test\\\\end'''",
            """''' (''''')
string content ('it')
escape sequence ('\'')
string content ('s a test')
escape sequence ('\\')
string content ('end')
''' (''''')"""
        )
    }

    fun testExpression() {
        doTest(
            "`now()`",
            "expression ('`now()`')"
        )
    }
}
