package nz.co.steelsky.dbmlplugin.highlighting

import com.intellij.lexer.Lexer
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.HighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.editor.colors.TextAttributesKey.createTextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase
import com.intellij.psi.TokenType
import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.lexer.DbmlLexerAdapter
import nz.co.steelsky.dbmlplugin.lexer.DbmlTokenSets
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

class DbmlSyntaxHighlighter : SyntaxHighlighterBase() {
    companion object {
        val KEYWORD = createTextAttributesKey("DBML_KEYWORD", DefaultLanguageHighlighterColors.KEYWORD)
        val NUMBER = createTextAttributesKey("DBML_NUMBER", DefaultLanguageHighlighterColors.NUMBER)
        val STRING = createTextAttributesKey("DBML_STRING", DefaultLanguageHighlighterColors.STRING)
        val EXPRESSION = createTextAttributesKey("DBML_EXPRESSION", DefaultLanguageHighlighterColors.STRING)
        val LINE_COMMENT = createTextAttributesKey("DBML_LINE_COMMENT", DefaultLanguageHighlighterColors.LINE_COMMENT)
        val BLOCK_COMMENT = createTextAttributesKey("DBML_BLOCK_COMMENT", DefaultLanguageHighlighterColors.BLOCK_COMMENT)
        val OPERATOR = createTextAttributesKey("DBML_OPERATOR", DefaultLanguageHighlighterColors.OPERATION_SIGN)
        val BRACES = createTextAttributesKey("DBML_BRACES", DefaultLanguageHighlighterColors.BRACES)
        val BRACKETS = createTextAttributesKey("DBML_BRACKETS", DefaultLanguageHighlighterColors.BRACKETS)
        val PARENTHESES = createTextAttributesKey("DBML_PARENTHESES", DefaultLanguageHighlighterColors.PARENTHESES)
        val COLOR_CODE = createTextAttributesKey("DBML_COLOR_CODE", DefaultLanguageHighlighterColors.STRING)
        val BAD_CHARACTER = createTextAttributesKey("DBML_BAD_CHARACTER", HighlighterColors.BAD_CHARACTER)

        private val KEYWORD_KEYS = arrayOf(KEYWORD)
        private val NUMBER_KEYS = arrayOf(NUMBER)
        private val STRING_KEYS = arrayOf(STRING)
        private val EXPRESSION_KEYS = arrayOf(EXPRESSION)
        private val LINE_COMMENT_KEYS = arrayOf(LINE_COMMENT)
        private val BLOCK_COMMENT_KEYS = arrayOf(BLOCK_COMMENT)
        private val OPERATOR_KEYS = arrayOf(OPERATOR)
        private val BRACES_KEYS = arrayOf(BRACES)
        private val BRACKETS_KEYS = arrayOf(BRACKETS)
        private val PARENTHESES_KEYS = arrayOf(PARENTHESES)
        private val COLOR_CODE_KEYS = arrayOf(COLOR_CODE)
        private val BAD_CHARACTER_KEYS = arrayOf(BAD_CHARACTER)
        private val EMPTY_KEYS = emptyArray<TextAttributesKey>()
    }

    override fun getHighlightingLexer(): Lexer = DbmlLexerAdapter()

    override fun getTokenHighlights(tokenType: IElementType): Array<TextAttributesKey> {
        return when {
            DbmlTokenSets.KEYWORDS.contains(tokenType) -> KEYWORD_KEYS
            tokenType == DbmlTypes.NUMBER -> NUMBER_KEYS
            DbmlTokenSets.STRINGS.contains(tokenType) -> STRING_KEYS
            tokenType == DbmlTypes.EXPRESSION -> EXPRESSION_KEYS
            tokenType == DbmlTypes.LINE_COMMENT -> LINE_COMMENT_KEYS
            tokenType == DbmlTypes.BLOCK_COMMENT -> BLOCK_COMMENT_KEYS
            tokenType == DbmlTypes.COLOR_CODE -> COLOR_CODE_KEYS
            tokenType == DbmlTypes.LBRACE || tokenType == DbmlTypes.RBRACE -> BRACES_KEYS
            tokenType == DbmlTypes.LBRACK || tokenType == DbmlTypes.RBRACK -> BRACKETS_KEYS
            tokenType == DbmlTypes.LPAREN || tokenType == DbmlTypes.RPAREN -> PARENTHESES_KEYS
            tokenType == DbmlTypes.MINUS || tokenType == DbmlTypes.LT
                || tokenType == DbmlTypes.GT || tokenType == DbmlTypes.NE
                || tokenType == DbmlTypes.COLON || tokenType == DbmlTypes.COMMA
                || tokenType == DbmlTypes.DOT || tokenType == DbmlTypes.TILDE -> OPERATOR_KEYS
            tokenType == TokenType.BAD_CHARACTER -> BAD_CHARACTER_KEYS
            else -> EMPTY_KEYS
        }
    }
}
