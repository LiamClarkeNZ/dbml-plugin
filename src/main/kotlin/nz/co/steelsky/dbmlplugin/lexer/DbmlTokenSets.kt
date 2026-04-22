package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.psi.tree.TokenSet
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

object DbmlTokenSets {
    @JvmField
    val COMMENTS = TokenSet.create(DbmlTypes.LINE_COMMENT, DbmlTypes.BLOCK_COMMENT)

    @JvmField
    val STRINGS = TokenSet.create(
        DbmlTypes.SINGLE_QUOTED_STRING,
        DbmlTypes.DOUBLE_QUOTED_STRING,
        DbmlTypes.TRIPLE_STRING_OPEN,
        DbmlTypes.TRIPLE_STRING_CLOSE,
        DbmlTypes.TRIPLE_STRING_CONTENT,
    )

    @JvmField
    val KEYWORDS = TokenSet.create(
        DbmlTypes.PROJECT, DbmlTypes.TABLE, DbmlTypes.AS,
        DbmlTypes.REF, DbmlTypes.ENUM, DbmlTypes.RECORDS, DbmlTypes.TABLEGROUP,
        DbmlTypes.TABLEPARTIAL, DbmlTypes.HEADERCOLOR, DbmlTypes.COLOR,
        DbmlTypes.NOTE, DbmlTypes.PRIMARY, DbmlTypes.KEY,
        DbmlTypes.PK, DbmlTypes.NULL, DbmlTypes.NOT,
        DbmlTypes.UNIQUE, DbmlTypes.DEFAULT, DbmlTypes.INCREMENT,
        DbmlTypes.INDEXES, DbmlTypes.BTREE, DbmlTypes.HASH,
        DbmlTypes.TYPE, DbmlTypes.NAME, DbmlTypes.DELETE,
        DbmlTypes.UPDATE, DbmlTypes.CASCADE, DbmlTypes.RESTRICT,
        DbmlTypes.SET, DbmlTypes.NO, DbmlTypes.ACTION,
    )

    @JvmField
    val WHITE_SPACES = TokenSet.create(DbmlTokenTypes.WHITE_SPACE)
}
