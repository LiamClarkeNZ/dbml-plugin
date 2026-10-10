package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.DbmlLanguage

class DbmlTokenType(debugName: String) : IElementType(debugName, DbmlLanguage) {

    override fun toString(): String = FRIENDLY_NAMES[super.toString()] ?: super.toString()

    companion object {
        private val FRIENDLY_NAMES = mapOf(
            // Punctuation
            "COMMA" to "','",
            "COLON" to "':'",
            "DOT" to "'.'",
            "TILDE" to "'~'",
            "MINUS" to "'-'",
            "LT" to "'<'",
            "GT" to "'>'",
            "NE" to "'<>'",
            "LPAREN" to "'('",
            "RPAREN" to "')'",
            "LBRACK" to "'['",
            "RBRACK" to "']'",
            "LBRACE" to "'{'",
            "RBRACE" to "'}'",

            // Literals and values
            "LITERAL" to "identifier",
            "NUMBER" to "number",
            "SINGLE_QUOTED_STRING" to "string",
            "DOUBLE_QUOTED_STRING" to "quoted identifier",
            "TRIPLE_STRING_OPEN" to "'''",
            "TRIPLE_STRING_CLOSE" to "'''",
            "TRIPLE_STRING_CONTENT" to "string content",
            "STRING_ESCAPE" to "escape sequence",
            "EXPRESSION" to "expression",
            "COLOR_CODE" to "colour code",
            "NEWLINE" to "new line",

            // Keywords
            "PROJECT" to "'Project'",
            "TABLE" to "'Table'",
            "AS" to "'as'",
            "REF" to "'Ref'",
            "ENUM" to "'Enum'",
            "RECORDS" to "'Records'",
            "TABLEGROUP" to "'TableGroup'",
            "TABLEPARTIAL" to "'TablePartial'",
            "HEADERCOLOR" to "'headercolor'",
            "COLOR" to "'color'",
            "NOTE" to "'Note'",
            "PRIMARY" to "'primary'",
            "KEY" to "'key'",
            "PK" to "'pk'",
            "NULL" to "'null'",
            "NOT" to "'not'",
            "UNIQUE" to "'unique'",
            "DEFAULT" to "'default'",
            "INCREMENT" to "'increment'",
            "INDEXES" to "'indexes'",
            "BTREE" to "'btree'",
            "HASH" to "'hash'",
            "TYPE" to "'type'",
            "NAME" to "'name'",
            "DELETE" to "'delete'",
            "UPDATE" to "'update'",
            "CASCADE" to "'cascade'",
            "RESTRICT" to "'restrict'",
            "SET" to "'set'",
            "NO" to "'no'",
            "ACTION" to "'action'",
        )
    }
}
