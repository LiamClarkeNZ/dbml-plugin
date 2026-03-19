package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.psi.tree.IElementType
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

class DbmlHighlightingTest : BasePlatformTestCase() {
    private val highlighter = DbmlSyntaxHighlighter()

    fun testKeywordsHighlighted() {
        val keywordTokens = listOf(
            DbmlTypes.TABLE, DbmlTypes.PROJECT, DbmlTypes.REF,
            DbmlTypes.ENUM, DbmlTypes.NOTE, DbmlTypes.INDEXES,
        )
        for (token in keywordTokens) {
            val keys = highlighter.getTokenHighlights(token)
            assertTrue("Expected KEYWORD highlighting for $token", keys.contains(DbmlSyntaxHighlighter.KEYWORD))
        }
    }

    fun testStringHighlighted() {
        val stringTokens = listOf(
            DbmlTypes.SINGLE_QUOTED_STRING,
            DbmlTypes.DOUBLE_QUOTED_STRING,
            DbmlTypes.TRIPLE_QUOTED_STRING,
        )
        for (token in stringTokens) {
            val keys = highlighter.getTokenHighlights(token)
            assertTrue("Expected STRING highlighting for $token", keys.contains(DbmlSyntaxHighlighter.STRING))
        }
    }

    fun testCommentHighlighted() {
        assertHighlightContains(DbmlTypes.LINE_COMMENT, DbmlSyntaxHighlighter.LINE_COMMENT)
        assertHighlightContains(DbmlTypes.BLOCK_COMMENT, DbmlSyntaxHighlighter.BLOCK_COMMENT)
    }

    fun testNumberHighlighted() {
        assertHighlightContains(DbmlTypes.NUMBER, DbmlSyntaxHighlighter.NUMBER)
    }

    fun testOperatorHighlighted() {
        val operatorTokens = listOf(
            DbmlTypes.LT, DbmlTypes.GT, DbmlTypes.MINUS,
            DbmlTypes.NE, DbmlTypes.COLON, DbmlTypes.DOT,
        )
        for (token in operatorTokens) {
            assertHighlightContains(token, DbmlSyntaxHighlighter.OPERATOR)
        }
    }

    fun testBracesHighlighted() {
        assertHighlightContains(DbmlTypes.LBRACE, DbmlSyntaxHighlighter.BRACES)
        assertHighlightContains(DbmlTypes.RBRACE, DbmlSyntaxHighlighter.BRACES)
    }

    private fun assertHighlightContains(token: IElementType, expected: TextAttributesKey) {
        val keys = highlighter.getTokenHighlights(token)
        assertTrue("Expected ${expected.externalName} highlighting for $token", keys.contains(expected))
    }
}
