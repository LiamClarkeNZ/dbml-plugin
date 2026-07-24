package nz.co.steelsky.dbmlplugin.model

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import org.junit.Assert.assertNotEquals

class StructuralHashTest : BasePlatformTestCase() {

    private fun hash(src: String): String =
        SchemaExtractor.extract(myFixture.configureByText("test.dbml", src)).structuralHash()

    fun testRenamingAColumnDoesNotChangeHash() {
        val before = hash("Table users {\n  id int\n  email varchar\n}")
        val after = hash("Table users {\n  id int\n  email_address varchar\n}")
        assertEquals(before, after)
    }

    fun testChangingAColumnTypeDoesNotChangeHash() {
        val before = hash("Table users {\n  id int\n}")
        val after = hash("Table users {\n  id bigint\n}")
        assertEquals(before, after)
    }

    fun testAddingATableChangesHash() {
        val before = hash("Table users {\n  id int\n}")
        val after = hash("Table users {\n  id int\n}\nTable posts {\n  id int\n}")
        assertNotEquals(before, after)
    }

    fun testAddingAColumnChangesHash() {
        val before = hash("Table users {\n  id int\n}")
        val after = hash("Table users {\n  id int\n  email varchar\n}")
        assertNotEquals(before, after)
    }

    fun testAddingARelationChangesHash() {
        val base = "Table a {\n  id int\n}\nTable b {\n  id int\n  a_id int\n}\n"
        val before = hash(base)
        val after = hash(base + "Ref: b.a_id > a.id")
        assertNotEquals(before, after)
    }
}
