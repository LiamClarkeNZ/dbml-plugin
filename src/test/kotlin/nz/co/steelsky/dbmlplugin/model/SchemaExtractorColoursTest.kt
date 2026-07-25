package nz.co.steelsky.dbmlplugin.model

import com.intellij.testFramework.fixtures.BasePlatformTestCase

class SchemaExtractorColoursTest : BasePlatformTestCase() {

    private fun extract(src: String): SchemaModel =
        SchemaExtractor.extract(myFixture.configureByText("test.dbml", src))

    fun testExtractsTableHeaderColourLowerCased() {
        val model = extract(
            """
            Table users [headercolor: #B19888] {
              id int [pk]
            }
            """.trimIndent(),
        )
        assertEquals("#b19888", model.tables[0].headerColor)
    }

    fun testExpandsThreeDigitHeaderColour() {
        val model = extract(
            """
            Table users [headercolor: #ABC] {
              id int [pk]
            }
            """.trimIndent(),
        )
        assertEquals("#aabbcc", model.tables[0].headerColor)
    }

    fun testTableWithoutColourHasNull() {
        val model = extract(
            """
            Table users [note: 'people'] {
              id int [pk]
            }
            """.trimIndent(),
        )
        assertNull(model.tables[0].headerColor)
    }

    fun testExtractsGroupColour() {
        val model = extract(
            """
            Table users {
              id int [pk]
            }

            TableGroup core [color: #7C9772] {
              users
            }
            """.trimIndent(),
        )
        assertEquals("#7c9772", model.groups[0].color)
    }

    fun testExtractsRefColour() {
        val model = extract(
            """
            Table users {
              id int [pk]
            }

            Table orders {
              user_id int
            }

            Ref: orders.user_id > users.id [color: #61AFEF]
            """.trimIndent(),
        )
        assertEquals("#61afef", model.relations[0].color)
    }

    /** column_inline_ref has no settings clause in the grammar, so an inline ref cannot be coloured. */
    fun testInlineRefHasNoColour() {
        val model = extract(
            """
            Table users {
              id int [pk]
            }

            Table orders {
              user_id int [ref: > users.id]
            }
            """.trimIndent(),
        )
        assertEquals(1, model.relations.size)
        assertNull(model.relations[0].color)
    }

    fun testNormaliseColourRejectsMalformedValues() {
        assertNull(normaliseColour(null))
        assertNull(normaliseColour(""))
        assertNull(normaliseColour("b19888"))
        assertNull(normaliseColour("#12"))
        assertNull(normaliseColour("#12345"))
        assertNull(normaliseColour("#gggggg"))
        assertEquals("#b19888", normaliseColour("  #B19888  "))
    }
}
