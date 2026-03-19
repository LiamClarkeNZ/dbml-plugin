package nz.co.steelsky.dbmlplugin

import com.intellij.lang.BracePair
import com.intellij.lang.PairedBraceMatcher
import com.intellij.psi.PsiFile
import com.intellij.psi.tree.IElementType
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

class DbmlBraceMatcher : PairedBraceMatcher {
    companion object {
        private val PAIRS = arrayOf(
            BracePair(DbmlTypes.LBRACE, DbmlTypes.RBRACE, true),
            BracePair(DbmlTypes.LBRACK, DbmlTypes.RBRACK, false),
            BracePair(DbmlTypes.LPAREN, DbmlTypes.RPAREN, false),
        )
    }

    override fun getPairs(): Array<BracePair> = PAIRS
    override fun isPairedBracesAllowedBeforeType(lbraceType: IElementType, contextType: IElementType?): Boolean = true
    override fun getCodeConstructStart(file: PsiFile?, openingBraceOffset: Int): Int = openingBraceOffset
}
