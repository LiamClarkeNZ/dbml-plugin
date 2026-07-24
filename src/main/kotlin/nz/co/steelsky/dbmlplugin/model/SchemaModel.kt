package nz.co.steelsky.dbmlplugin.model

/** Relationship cardinality, derived from the DBML relation operator. */
enum class Cardinality {
    ONE_TO_ONE,   // -
    ONE_TO_MANY,  // <
    MANY_TO_ONE,  // >
    MANY_TO_MANY, // <>
}

data class ColumnModel(
    val name: String,
    val type: String,
    val pk: Boolean,
    val unique: Boolean,
    val notNull: Boolean,
    val increment: Boolean,
    val default: String?,
    val note: String?,
    val sourceOffset: Int,
)

data class IndexModel(
    val columns: List<String>,
    val pk: Boolean,
    val unique: Boolean,
    val name: String?,
    val sourceOffset: Int,
)

data class TableModel(
    /** Normalised identity key (unquoted, lower-cased, dotted qualifier preserved). */
    val key: String,
    /** Display name (last dotted segment, unquoted, original case). */
    val name: String,
    val alias: String?,
    val note: String?,
    val columns: List<ColumnModel>,
    val indexes: List<IndexModel>,
    val sourceOffset: Int,
)

data class EnumModel(
    val key: String,
    val name: String,
    val values: List<String>,
    val sourceOffset: Int,
)

data class RelationModel(
    /** Resolved table key when the endpoint matched a known table; otherwise the normalised raw name. */
    val fromTable: String,
    val fromColumns: List<String>,
    val toTable: String,
    val toColumns: List<String>,
    val cardinality: Cardinality,
    /** True when both endpoints matched a table in this schema. */
    val resolved: Boolean,
    val sourceOffset: Int,
)

data class GroupModel(
    val name: String,
    val tableKeys: List<String>,
    val sourceOffset: Int,
)

data class SchemaModel(
    val tables: List<TableModel>,
    val enums: List<EnumModel>,
    val relations: List<RelationModel>,
    val groups: List<GroupModel>,
    val parseErrorCount: Int,
)
