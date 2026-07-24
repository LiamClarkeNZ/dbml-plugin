package nz.co.steelsky.dbmlplugin.model

import com.google.gson.JsonParser
import com.intellij.testFramework.fixtures.BasePlatformTestCase

class SchemaJsonTest : BasePlatformTestCase() {

    fun testSerialisesSchemaToJson() {
        val model = SchemaExtractor.extract(
            myFixture.configureByText(
                "test.dbml",
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
            ),
        )

        val json = model.toJson()
        val root = JsonParser.parseString(json).asJsonObject

        val tables = root.getAsJsonArray("tables")
        assertEquals(2, tables.size())
        assertEquals("users", tables[0].asJsonObject.get("key").asString)

        val relations = root.getAsJsonArray("relations")
        assertEquals(1, relations.size())
        assertEquals("MANY_TO_ONE", relations[0].asJsonObject.get("cardinality").asString)
        assertTrue(relations[0].asJsonObject.get("resolved").asBoolean)

        // null fields are omitted, not emitted as null
        val idColumn = tables[0].asJsonObject.getAsJsonArray("columns")[0].asJsonObject
        assertFalse(idColumn.has("default"))
    }
}
