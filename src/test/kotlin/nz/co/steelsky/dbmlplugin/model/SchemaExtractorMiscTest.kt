package nz.co.steelsky.dbmlplugin.model

import com.intellij.testFramework.fixtures.BasePlatformTestCase

class SchemaExtractorMiscTest : BasePlatformTestCase() {

    private fun extract(src: String): SchemaModel =
        SchemaExtractor.extract(myFixture.configureByText("test.dbml", src))

    fun testExtractsEnum() {
        val model = extract(
            """
            Enum job_status {
              created
              running
              done
            }
            """.trimIndent(),
        )
        assertEquals(1, model.enums.size)
        val e = model.enums[0]
        assertEquals("job_status", e.key)
        assertEquals(listOf("created", "running", "done"), e.values)
    }

    fun testExtractsTableGroup() {
        val model = extract(
            """
            Table users { id int }
            Table posts { id int }
            TableGroup core {
              users
              posts
            }
            """.trimIndent(),
        )
        assertEquals(1, model.groups.size)
        val g = model.groups[0]
        assertEquals("core", g.name)
        assertEquals(listOf("users", "posts"), g.tableKeys)
    }

    fun testExtractsIndexes() {
        val model = extract(
            """
            Table users {
              id int
              email varchar
              indexes {
                email [unique]
                (id, email) [pk]
              }
            }
            """.trimIndent(),
        )
        val idx = model.tables[0].indexes
        assertEquals(2, idx.size)
        assertEquals(listOf("email"), idx[0].columns)
        assertTrue(idx[0].unique)
        assertEquals(listOf("id", "email"), idx[1].columns)
        assertTrue(idx[1].pk)
    }

    fun testCountsParseErrors() {
        val model = extract("Table {{{ broken")
        assertTrue("expected at least one parse error", model.parseErrorCount > 0)
    }
}
