package nz.co.steelsky.dbmlplugin.model

import com.intellij.testFramework.fixtures.BasePlatformTestCase

class SchemaExtractorRelationsTest : BasePlatformTestCase() {

    private fun extract(src: String): SchemaModel =
        SchemaExtractor.extract(myFixture.configureByText("test.dbml", src))

    fun testTopLevelRefResolvesEndpoints() {
        val model = extract(
            """
            Table users {
              id int [pk]
            }
            Table posts {
              id int [pk]
              user_id int
            }
            Ref: posts.user_id > users.id
            """.trimIndent(),
        )
        assertEquals(1, model.relations.size)
        val r = model.relations[0]
        assertEquals("posts", r.fromTable)
        assertEquals(listOf("user_id"), r.fromColumns)
        assertEquals("users", r.toTable)
        assertEquals(listOf("id"), r.toColumns)
        assertEquals(Cardinality.MANY_TO_ONE, r.cardinality)
        assertTrue(r.resolved)
    }

    fun testInlineRefBecomesRelation() {
        val model = extract(
            """
            Table users {
              id int [pk]
            }
            Table posts {
              id int [pk]
              user_id int [ref: > users.id]
            }
            """.trimIndent(),
        )
        assertEquals(1, model.relations.size)
        val r = model.relations[0]
        assertEquals("posts", r.fromTable)
        assertEquals(listOf("user_id"), r.fromColumns)
        assertEquals("users", r.toTable)
        assertEquals(listOf("id"), r.toColumns)
        assertTrue(r.resolved)
    }

    fun testCompositeAndUnresolvedRef() {
        val model = extract(
            """
            Table posts {
              a int
              b int
            }
            Ref: posts.(a, b) < missing.(x, y)
            """.trimIndent(),
        )
        val r = model.relations[0]
        assertEquals(listOf("a", "b"), r.fromColumns)
        assertEquals(listOf("x", "y"), r.toColumns)
        assertEquals("missing", r.toTable) // normalised raw, unresolved
        assertFalse(r.resolved)
        assertEquals(Cardinality.ONE_TO_MANY, r.cardinality)
    }
}
