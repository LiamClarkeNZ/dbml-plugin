package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.psi.TokenType

object DbmlTokenTypes {
    // Standard IntelliJ types — not in the BNF grammar
    @JvmField val WHITE_SPACE = TokenType.WHITE_SPACE
    @JvmField val BAD_CHARACTER = TokenType.BAD_CHARACTER
}
