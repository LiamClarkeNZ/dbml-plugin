package nz.co.steelsky.dbmlplugin.model

import com.intellij.psi.PsiFile
import com.intellij.psi.tree.TokenSet
import com.intellij.psi.util.PsiTreeUtil
import nz.co.steelsky.dbmlplugin.psi.DbmlColumnDefinition
import nz.co.steelsky.dbmlplugin.psi.DbmlColumnSetting
import nz.co.steelsky.dbmlplugin.psi.DbmlNoteValue
import nz.co.steelsky.dbmlplugin.psi.DbmlTableAlias
import nz.co.steelsky.dbmlplugin.psi.DbmlTableDefinition
import nz.co.steelsky.dbmlplugin.psi.DbmlTypes

object SchemaExtractor {

    /** Tokens the grammar accepts wherever an identifier may appear (mirrors `identifier_` in Dbml.bnf). */
    private val IDENTIFIER_TOKENS: TokenSet = TokenSet.create(
        DbmlTypes.LITERAL, DbmlTypes.DOUBLE_QUOTED_STRING, DbmlTypes.NAME, DbmlTypes.TYPE,
        DbmlTypes.NOTE, DbmlTypes.DEFAULT, DbmlTypes.KEY, DbmlTypes.PK, DbmlTypes.NULL,
        DbmlTypes.NOT, DbmlTypes.UNIQUE, DbmlTypes.INCREMENT, DbmlTypes.PRIMARY,
        DbmlTypes.INDEXES, DbmlTypes.BTREE, DbmlTypes.HASH, DbmlTypes.DELETE, DbmlTypes.UPDATE,
        DbmlTypes.CASCADE, DbmlTypes.RESTRICT, DbmlTypes.SET, DbmlTypes.NO, DbmlTypes.ACTION,
        DbmlTypes.HEADERCOLOR, DbmlTypes.COLOR, DbmlTypes.AS,
    )

    fun extract(file: PsiFile): SchemaModel {
        val tables = PsiTreeUtil.getChildrenOfTypeAsList(file, DbmlTableDefinition::class.java)
            .map(::extractTable)
        return SchemaModel(
            tables = tables,
            enums = emptyList(),
            relations = emptyList(),
            groups = emptyList(),
            parseErrorCount = 0,
        )
    }

    private fun extractTable(t: DbmlTableDefinition): TableModel {
        val nameEl = t.tableName
        val raw = nameEl?.text ?: ""
        val columns = t.columnDefinitionList.map(::extractColumn)
        return TableModel(
            key = normalize(raw),
            name = lastSegment(unquote(raw.trim())),
            alias = t.tableAlias?.let(::aliasName),
            note = t.noteValueList.firstOrNull()?.let(::noteText),
            columns = columns,
            indexes = emptyList(),
            sourceOffset = (nameEl ?: t).textRange.startOffset,
        )
    }

    private fun extractColumn(col: DbmlColumnDefinition): ColumnModel {
        val datatype = col.columnDatatype
        val name = if (datatype != null) {
            unquote(col.text.substring(0, datatype.startOffsetInParent).trim())
        } else {
            unquote(col.text.trim())
        }
        var pk = false
        var unique = false
        var notNull = false
        var increment = false
        var default: String? = null
        var note: String? = null
        col.columnSettings?.columnSettingList?.forEach { s ->
            when {
                s.columnInlineRef != null -> Unit // handled as a relation in Task 3
                s.has(DbmlTypes.PK) || (s.has(DbmlTypes.PRIMARY) && s.has(DbmlTypes.KEY)) -> pk = true
                s.has(DbmlTypes.UNIQUE) -> unique = true
                s.has(DbmlTypes.NOT) && s.has(DbmlTypes.NULL) -> notNull = true
                s.has(DbmlTypes.INCREMENT) -> increment = true
                s.has(DbmlTypes.DEFAULT) -> default = s.text.substringAfter(':').trim()
                s.has(DbmlTypes.NOTE) -> note = unquote(s.text.substringAfter(':').trim())
            }
        }
        return ColumnModel(
            name = name,
            type = datatype?.text?.trim() ?: "",
            pk = pk,
            unique = unique,
            notNull = notNull,
            increment = increment,
            default = default,
            note = note,
            sourceOffset = col.textRange.startOffset,
        )
    }

    private fun aliasName(a: DbmlTableAlias): String =
        a.node.getChildren(IDENTIFIER_TOKENS).lastOrNull()?.let { unquote(it.text) }
            ?: a.text.trim().substringAfter(' ').trim()

    private fun noteText(n: DbmlNoteValue): String =
        unquote(n.text.trim().removePrefix(":").trim().removeSurrounding("{", "}").trim())

    private fun DbmlColumnSetting.has(type: com.intellij.psi.tree.IElementType): Boolean =
        node.findChildByType(type) != null

    private fun unquote(s: String): String =
        if (s.length >= 2 && s.startsWith("\"") && s.endsWith("\"")) s.substring(1, s.length - 1) else s

    private fun normalize(s: String): String = unquote(s.trim()).lowercase()

    private fun lastSegment(s: String): String = s.substringAfterLast('.')
}
