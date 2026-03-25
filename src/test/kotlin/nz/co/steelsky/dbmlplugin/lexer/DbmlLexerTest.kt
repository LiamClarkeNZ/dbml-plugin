package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.testFramework.LexerTestCase

class DbmlLexerTest : LexerTestCase() {
    override fun createLexer() = DbmlLexerAdapter()
    override fun getDirPath() = "src/test/testData/lexer"

    fun testKeywords() {
        doTest(
            "Table Enum Ref Project",
            """TABLE ('Table')
WHITE_SPACE (' ')
ENUM ('Enum')
WHITE_SPACE (' ')
REF ('Ref')
WHITE_SPACE (' ')
PROJECT ('Project')"""
        )
    }

    fun testOperators() {
        doTest(
            "< > - <>",
            """LT ('<')
WHITE_SPACE (' ')
GT ('>')
WHITE_SPACE (' ')
MINUS ('-')
WHITE_SPACE (' ')
NE ('<>')"""
        )
    }

    fun testNumbers() {
        doTest(
            "42 3.14",
            """NUMBER ('42')
WHITE_SPACE (' ')
NUMBER ('3.14')"""
        )
    }

    fun testComments() {
        doTest(
            "// line comment\n/* block */",
            """LINE_COMMENT ('// line comment')
NEWLINE ('\n')
BLOCK_COMMENT ('/* block */')"""
        )
    }

    fun testColorCode() {
        doTest(
            "#fff #aabbcc",
            """COLOR_CODE ('#fff')
WHITE_SPACE (' ')
COLOR_CODE ('#aabbcc')"""
        )
    }

    fun testIdentifiersAndNewlines() {
        doTest(
            "my_table\nmy_column",
            """LITERAL ('my_table')
NEWLINE ('\n')
LITERAL ('my_column')"""
        )
    }

    fun testTableDefinition() {
        doTest(
            "Table users {\n  id integer [pk]\n}",
            """TABLE ('Table')
WHITE_SPACE (' ')
LITERAL ('users')
WHITE_SPACE (' ')
LBRACE ('{')
NEWLINE ('\n')
WHITE_SPACE ('  ')
LITERAL ('id')
WHITE_SPACE (' ')
LITERAL ('integer')
WHITE_SPACE (' ')
LBRACK ('[')
PK ('pk')
RBRACK (']')
NEWLINE ('\n')
RBRACE ('}')"""
        )
    }

    fun testSingleQuotedString() {
        doTest(
            "'hello world'",
            "SINGLE_QUOTED_STRING (''hello world'')"
        )
    }

    fun testDoubleQuotedString() {
        doTest(
            "\"hello world\"",
            "DOUBLE_QUOTED_STRING ('\"hello world\"')"
        )
    }

    fun testTripleQuotedString() {
        doTest(
            "'''multi\nline'''",
            """TRIPLE_STRING_OPEN (''''')
TRIPLE_STRING_CONTENT ('multi')
NEWLINE ('\n')
TRIPLE_STRING_CONTENT ('line')
TRIPLE_STRING_CLOSE (''''')"""
        )
    }

    fun testTripleQuotedStringWithEscapes() {
        doTest(
            "'''it\\'s a test\\\\end'''",
            """TRIPLE_STRING_OPEN (''''')
TRIPLE_STRING_CONTENT ('it')
STRING_ESCAPE ('\'')
TRIPLE_STRING_CONTENT ('s a test')
STRING_ESCAPE ('\\')
TRIPLE_STRING_CONTENT ('end')
TRIPLE_STRING_CLOSE (''''')"""
        )
    }

    fun testExpression() {
        doTest(
            "`now()`",
            "EXPRESSION ('`now()`')"
        )
    }
}
