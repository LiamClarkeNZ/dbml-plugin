package nz.co.steelsky.dbmlplugin.lexer

import com.intellij.testFramework.LexerTestCase

class DbmlLexerBenchmarkTest : LexerTestCase() {
    override fun createLexer() = DbmlLexerAdapter()
    override fun getDirPath() = "src/test/testData/lexer"

    fun testLexerThroughput() {
        val singleTable = buildString {
            appendLine("Table users_0 [headercolor: #3498db] {")
            appendLine("  id integer [pk, increment]")
            appendLine("  name varchar(255) [not null]")
            appendLine("  email varchar(255) [unique, note: 'Login identifier']")
            appendLine("  status varchar [default: 'active']")
            appendLine("  created_at timestamp [default: `now()`]")
            appendLine("")
            appendLine("  indexes {")
            appendLine("    email [type: btree]")
            appendLine("    (name, email) [unique, pk]")
            appendLine("  }")
            appendLine("")
            appendLine("  Note: '''")
            appendLine("    User accounts table.")
            appendLine("    Here\\'s an escaped apostrophe.")
            appendLine("  '''")
            appendLine("}")
        }

        val largeInput = (0 until 500).joinToString("\n") { i ->
            singleTable.replace("users_0", "users_$i")
        }

        val lexer = createLexer()

        // Warmup
        repeat(3) {
            lexer.start(largeInput)
            while (lexer.tokenType != null) lexer.advance()
        }

        // Measure
        val iterations = 10
        val startNs = System.nanoTime()
        var tokenCount = 0L
        repeat(iterations) {
            lexer.start(largeInput)
            while (lexer.tokenType != null) {
                tokenCount++
                lexer.advance()
            }
        }
        val elapsedMs = (System.nanoTime() - startNs) / 1_000_000.0
        val tokensPerSecond = (tokenCount / (elapsedMs / 1000.0)).toLong()
        val charsPerSecond = (largeInput.length.toLong() * iterations / (elapsedMs / 1000.0)).toLong()

        println("Lexer benchmark: ${largeInput.length} chars, ${tokenCount / iterations} tokens/iteration, $iterations iterations")
        println("Throughput: $tokensPerSecond tokens/sec, $charsPerSecond chars/sec")
        println("Total time: ${elapsedMs.toLong()}ms")

        assertTrue("Lexer too slow: $tokensPerSecond tokens/sec (expected >500,000)", tokensPerSecond > 500_000)
    }
}
