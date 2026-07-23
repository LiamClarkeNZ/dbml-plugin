package nz.co.steelsky.dbmlplugin.model

import com.intellij.psi.PsiErrorElement
import com.intellij.psi.PsiFile
import com.intellij.psi.tree.TokenSet
import com.intellij.psi.util.PsiTreeUtil
import nz.co.steelsky.dbmlplugin.psi.DbmlColumnDefinition
import nz.co.steelsky.dbmlplugin.psi.DbmlColumnInlineRef
import nz.co.steelsky.dbmlplugin.psi.DbmlColumnSetting
import nz.co.steelsky.dbmlplugin.psi.DbmlEnumDefinition
import nz.co.steelsky.dbmlplugin.psi.DbmlEnumValue
import nz.co.steelsky.dbmlplugin.psi.DbmlIndexDefinition
import nz.co.steelsky.dbmlplugin.psi.DbmlNoteValue
import nz.co.steelsky.dbmlplugin.psi.DbmlRefColumnNames
import nz.co.steelsky.dbmlplugin.psi.DbmlRefDefinition
import nz.co.steelsky.dbmlplugin.psi.DbmlTableAlias
import nz.co.steelsky.dbmlplugin.psi.DbmlTableDefinition
import nz.co.steelsky.dbmlplugin.psi.DbmlTableGroup
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
        val resolver = TableResolver(tables)
        return SchemaModel(
            tables = tables,
            enums = PsiTreeUtil.getChildrenOfTypeAsList(file, DbmlEnumDefinition::class.java).map(::extractEnum),
            relations = extractRelations(file, resolver),
            groups = PsiTreeUtil.getChildrenOfTypeAsList(file, DbmlTableGroup::class.java).map(::extractGroup),
            parseErrorCount = PsiTreeUtil.findChildrenOfType(file, PsiErrorElement::class.java).size,
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
            indexes = t.indexesDefinitionList.flatMap { it.indexDefinitionList }.map(::extractIndex),
            sourceOffset = (nameEl ?: t).textRange.startOffset,
        )
    }

    private fun extractColumn(col: DbmlColumnDefinition): ColumnModel {
        val datatype = col.columnDatatype
        val name = columnName(col)
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

    private fun columnName(col: DbmlColumnDefinition): String {
        val datatype = col.columnDatatype
        return if (datatype != null) {
            unquote(col.text.substring(0, datatype.startOffsetInParent).trim())
        } else {
            unquote(col.text.trim())
        }
    }

    private data class RefEndpoint(val table: String, val columns: List<String>)

    private class TableResolver(tables: List<TableModel>) {
        private val byKey = HashMap<String, String>()

        init {
            tables.forEach { t ->
                byKey[t.key] = t.key
                byKey[t.key.substringAfterLast('.')] = t.key
                t.alias?.let { byKey[it.lowercase()] = t.key }
            }
        }

        /** Returns the matching table key, or null if the raw name matches no table. */
        fun resolve(rawTable: String): String? {
            val n = rawTable.lowercase()
            return byKey[n] ?: byKey[n.substringAfterLast('.')]
        }
    }

    private fun extractRelations(file: PsiFile, resolver: TableResolver): List<RelationModel> = buildList {
        PsiTreeUtil.findChildrenOfType(file, DbmlRefDefinition::class.java).forEach { refDef ->
            val body = refDef.refBody ?: return@forEach
            val ends = body.refColumnNamesList
            if (ends.size < 2) return@forEach
            add(
                makeRelation(
                    from = parseRef(ends[0]),
                    to = parseRef(ends[1]),
                    relText = body.relation.text,
                    resolver = resolver,
                    offset = refDef.textRange.startOffset,
                ),
            )
        }
        PsiTreeUtil.findChildrenOfType(file, DbmlColumnInlineRef::class.java).forEach { inl ->
            val colDef = PsiTreeUtil.getParentOfType(inl, DbmlColumnDefinition::class.java) ?: return@forEach
            val tableDef = PsiTreeUtil.getParentOfType(inl, DbmlTableDefinition::class.java) ?: return@forEach
            add(
                makeRelation(
                    from = RefEndpoint(tableDef.tableName?.text ?: "", listOf(columnName(colDef))),
                    to = parseRef(inl.refColumnNames),
                    relText = inl.relation.text,
                    resolver = resolver,
                    offset = inl.textRange.startOffset,
                ),
            )
        }
    }

    private fun makeRelation(
        from: RefEndpoint,
        to: RefEndpoint,
        relText: String,
        resolver: TableResolver,
        offset: Int,
    ): RelationModel {
        val fromKey = resolver.resolve(from.table)
        val toKey = resolver.resolve(to.table)
        return RelationModel(
            fromTable = fromKey ?: normalize(from.table),
            fromColumns = from.columns,
            toTable = toKey ?: normalize(to.table),
            toColumns = to.columns,
            cardinality = cardinalityOf(relText),
            resolved = fromKey != null && toKey != null,
            sourceOffset = offset,
        )
    }

    private fun parseRef(rcn: DbmlRefColumnNames): RefEndpoint {
        val idents = mutableListOf<String>()
        var parenAt = -1
        var child = rcn.firstChild
        while (child != null) {
            val type = child.node.elementType
            when {
                type == DbmlTypes.LPAREN -> parenAt = idents.size
                IDENTIFIER_TOKENS.contains(type) -> idents.add(unquote(child.text))
            }
            child = child.nextSibling
        }
        return if (parenAt >= 0) {
            RefEndpoint(idents.subList(0, parenAt).joinToString("."), idents.subList(parenAt, idents.size).toList())
        } else {
            val cols = if (idents.isNotEmpty()) listOf(idents.last()) else emptyList()
            val table = if (idents.size > 1) idents.subList(0, idents.size - 1).joinToString(".") else ""
            RefEndpoint(table, cols)
        }
    }

    private fun cardinalityOf(rel: String): Cardinality = when (rel.trim()) {
        "<" -> Cardinality.ONE_TO_MANY
        ">" -> Cardinality.MANY_TO_ONE
        "-" -> Cardinality.ONE_TO_ONE
        "<>" -> Cardinality.MANY_TO_MANY
        else -> Cardinality.ONE_TO_MANY
    }

    private fun aliasName(a: DbmlTableAlias): String =
        a.node.getChildren(IDENTIFIER_TOKENS).lastOrNull()?.let { unquote(it.text) }
            ?: a.text.trim().substringAfter(' ').trim()

    private fun noteText(n: DbmlNoteValue): String =
        unquote(n.text.trim().removePrefix(":").trim().removeSurrounding("{", "}").trim())

    private fun extractEnum(e: DbmlEnumDefinition): EnumModel {
        val nameEl = e.tableName
        val raw = nameEl?.text ?: ""
        return EnumModel(
            key = normalize(raw),
            name = lastSegment(unquote(raw.trim())),
            values = e.enumValueList.map(::enumValueName),
            sourceOffset = (nameEl ?: e).textRange.startOffset,
        )
    }

    private fun enumValueName(v: DbmlEnumValue): String {
        val settings = v.enumValueSettings
        val raw = if (settings != null) v.text.substring(0, settings.startOffsetInParent) else v.text
        return unquote(raw.trim())
    }

    private fun extractGroup(g: DbmlTableGroup): GroupModel = GroupModel(
        name = groupName(g),
        tableKeys = g.tableGroupEntryList.map { normalize(it.tableName.text) },
        sourceOffset = g.textRange.startOffset,
    )

    private fun groupName(g: DbmlTableGroup): String =
        g.node.getChildren(IDENTIFIER_TOKENS).firstOrNull()?.let { unquote(it.text) } ?: ""

    private fun extractIndex(idx: DbmlIndexDefinition): IndexModel {
        val settings = idx.indexSettings
        val composite = idx.indexColumnList.map { unquote(it.text.trim()) }
        val columns = if (composite.isNotEmpty()) {
            composite
        } else {
            val raw = if (settings != null) idx.text.substring(0, settings.startOffsetInParent) else idx.text
            listOf(unquote(raw.trim()))
        }
        var pk = false
        var unique = false
        var name: String? = null
        settings?.indexSettingList?.forEach { s ->
            when {
                s.node.findChildByType(DbmlTypes.PK) != null -> pk = true
                s.node.findChildByType(DbmlTypes.PRIMARY) != null && s.node.findChildByType(DbmlTypes.KEY) != null -> pk = true
                s.node.findChildByType(DbmlTypes.UNIQUE) != null -> unique = true
                s.node.findChildByType(DbmlTypes.NAME) != null -> name = unquote(s.text.substringAfter(':').trim())
            }
        }
        // Bare `[pk]` is a private rule: no index_setting child, but a direct PK token on the settings node.
        if (settings != null && settings.indexSettingList.isEmpty() && settings.node.findChildByType(DbmlTypes.PK) != null) {
            pk = true
        }
        return IndexModel(columns = columns, pk = pk, unique = unique, name = name, sourceOffset = idx.textRange.startOffset)
    }

    private fun DbmlColumnSetting.has(type: com.intellij.psi.tree.IElementType): Boolean =
        node.findChildByType(type) != null

    private fun unquote(s: String): String =
        if (s.length >= 2 && s.startsWith("\"") && s.endsWith("\"")) s.substring(1, s.length - 1) else s

    private fun normalize(s: String): String = unquote(s.trim()).lowercase()

    private fun lastSegment(s: String): String = s.substringAfterLast('.')
}
