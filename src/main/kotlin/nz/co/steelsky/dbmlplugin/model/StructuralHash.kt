package nz.co.steelsky.dbmlplugin.model

import java.security.MessageDigest

/**
 * A digest of graph structure only - table/enum identities and counts, relation
 * endpoints, and group memberships. Column names, types, notes, defaults, and
 * source offsets are intentionally excluded so that cosmetic edits leave the hash
 * unchanged (Phase 3 re-runs layout only when this value changes).
 */
fun SchemaModel.structuralHash(): String {
    val sb = StringBuilder()
    tables.sortedBy { it.key }.forEach { t ->
        sb.append("T:").append(t.key).append('#').append(t.columns.size).append(';')
    }
    enums.sortedBy { it.key }.forEach { e ->
        sb.append("E:").append(e.key).append('#').append(e.values.size).append(';')
    }
    relations
        .map { "${it.fromTable}|${it.toTable}|${it.cardinality}" }
        .sorted()
        .forEach { sb.append("R:").append(it).append(';') }
    groups.sortedBy { it.name }.forEach { g ->
        sb.append("G:").append(g.name).append('=').append(g.tableKeys.sorted().joinToString(",")).append(';')
    }
    val digest = MessageDigest.getInstance("SHA-256").digest(sb.toString().toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it) }
}
