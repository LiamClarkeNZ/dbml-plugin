package nz.co.steelsky.dbmlplugin.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class SchemaModelTest {

    @Test
    fun `models expose fields and value equality`() {
        val column = ColumnModel(
            name = "id", type = "int", pk = true, unique = false, notNull = true,
            increment = true, default = null, note = null, sourceOffset = 12,
        )
        val table = TableModel(
            key = "users", name = "users", alias = "u", note = "people",
            columns = listOf(column), indexes = emptyList(), sourceOffset = 6,
        )
        val model = SchemaModel(
            tables = listOf(table), enums = emptyList(),
            relations = emptyList(), groups = emptyList(), parseErrorCount = 0,
        )

        assertEquals("id", model.tables[0].columns[0].name)
        assertEquals(Cardinality.ONE_TO_MANY, Cardinality.valueOf("ONE_TO_MANY"))
        // data-class equality is relied on by tests in later tasks
        assertEquals(table, table.copy())
        assertNotEquals(table, table.copy(name = "accounts"))
    }
}
