package nz.co.steelsky.dbmlplugin.model

import com.intellij.testFramework.fixtures.BasePlatformTestCase

class SchemaExtractorTest : BasePlatformTestCase() {

    private fun extract(src: String): SchemaModel =
        SchemaExtractor.extract(myFixture.configureByText("test.dbml", src))

    fun testExtractsTableNameAndColumns() {
        val model = extract(
            """
            Table users {
              id int [pk, increment]
              email varchar [unique, not null]
            }
            """.trimIndent(),
        )
        assertEquals(1, model.tables.size)
        val t = model.tables[0]
        assertEquals("users", t.key)
        assertEquals("users", t.name)
        assertEquals(2, t.columns.size)

        val id = t.columns[0]
        assertEquals("id", id.name)
        assertEquals("int", id.type)
        assertTrue(id.pk)
        assertTrue(id.increment)

        val email = t.columns[1]
        assertEquals("email", email.name)
        assertEquals("varchar", email.type)
        assertTrue(email.unique)
        assertTrue(email.notNull)
    }

    fun testParameterisedTypeAndAlias() {
        val model = extract(
            """
            Table orders as o {
              total decimal(10,2)
            }
            """.trimIndent(),
        )
        val t = model.tables[0]
        assertEquals("o", t.alias)
        assertEquals("decimal(10,2)", t.columns[0].type)
    }

    fun testQuotedTableNameIsUnquotedAndKeyed() {
        val model = extract(
            """
            Table "User Accounts" {
              id int
            }
            """.trimIndent(),
        )
        val t = model.tables[0]
        assertEquals("User Accounts", t.name)
        assertEquals("user accounts", t.key)
    }

    fun testColumnSourceOffsetPointsAtColumn() {
        val src = "Table t {\n  id int\n}"
        val model = extract(src)
        val offset = model.tables[0].columns[0].sourceOffset
        assertTrue(src.substring(offset).startsWith("id"))
    }
}
