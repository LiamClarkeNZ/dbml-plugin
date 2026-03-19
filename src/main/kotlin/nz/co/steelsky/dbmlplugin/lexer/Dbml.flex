package nz.co.steelsky.dbmlplugin.lexer;

import com.intellij.lexer.FlexLexer;
import com.intellij.psi.tree.IElementType;

import static nz.co.steelsky.dbmlplugin.psi.DbmlTypes.*;
import static com.intellij.psi.TokenType.BAD_CHARACTER;
import static com.intellij.psi.TokenType.WHITE_SPACE;

%%

%class DbmlLexer
%implements FlexLexer
%unicode
%function advance
%type IElementType

%state IN_SINGLE_STRING
%state IN_DOUBLE_STRING
%state IN_TRIPLE_STRING
%state IN_EXPRESSION
%state IN_BLOCK_COMMENT

// Character classes (from dbml-java Char.java — ASCII subset is sufficient for v1)
DIGIT = [0-9]
HEX_DIGIT = [0-9a-fA-F]
WORD_CHAR = [a-zA-Z0-9_]
WHITE_SPACE_CHAR = [ \t]
NEWLINE_CHAR = [\n\r]

// Composite patterns
INTEGER = {DIGIT}+
NUMBER = {INTEGER} ("." {INTEGER})?
WORD = {WORD_CHAR}+
COLOR_CODE_BODY = {HEX_DIGIT}{6} | {HEX_DIGIT}{3}

%%

// === YYINITIAL state ===
<YYINITIAL> {
    // Whitespace
    {WHITE_SPACE_CHAR}+         { return WHITE_SPACE; }
    {NEWLINE_CHAR}              { return NEWLINE; }

    // Line comments — handled entirely in YYINITIAL (no state needed)
    "//" [^\n\r]*               { return LINE_COMMENT; }
    // Block comments — opening delimiter transitions state without returning a token.
    // The closing "*/" in IN_BLOCK_COMMENT returns BLOCK_COMMENT covering the full literal.
    "/*"                        { yybegin(IN_BLOCK_COMMENT); }

    // Multi-character operators
    "<>"                        { return NE; }

    // Single-character operators and delimiters
    "-"                         { return MINUS; }
    "<"                         { return LT; }
    ">"                         { return GT; }
    "("                         { return LPAREN; }
    ")"                         { return RPAREN; }
    "["                         { return LBRACK; }
    "]"                         { return RBRACK; }
    "{"                         { return LBRACE; }
    "}"                         { return RBRACE; }
    ":"                         { return COLON; }
    ","                         { return COMMA; }
    "."                         { return DOT; }
    "~"                         { return TILDE; }

    // Colour codes (6-digit before 3-digit for longest match)
    "#" {COLOR_CODE_BODY}       { return COLOR_CODE; }

    // Strings — triple-quoted MUST come before single-quoted
    // Opening delimiters do NOT return a token — they just transition state.
    // The state's closing rule returns the token covering the entire literal.
    "'''"                       { yybegin(IN_TRIPLE_STRING); }
    "'"                         { yybegin(IN_SINGLE_STRING); }
    "\""                        { yybegin(IN_DOUBLE_STRING); }
    "`"                         { yybegin(IN_EXPRESSION); }

    // Numbers (before WORD so pure digit sequences match as NUMBER)
    {NUMBER}                    { return NUMBER; }

    // Keywords (case-insensitive, longest-first to avoid partial matches)
    [Tt][Aa][Bb][Ll][Ee][Gg][Rr][Oo][Uu][Pp]                   { return TABLEGROUP; }
    [Tt][Aa][Bb][Ll][Ee][Pp][Aa][Rr][Tt][Ii][Aa][Ll]           { return TABLEPARTIAL; }
    [Hh][Ee][Aa][Dd][Ee][Rr][Cc][Oo][Ll][Oo][Rr]               { return HEADERCOLOR; }
    [Ii][Nn][Cc][Rr][Ee][Mm][Ee][Nn][Tt]                        { return INCREMENT; }
    [Rr][Ee][Ss][Tt][Rr][Ii][Cc][Tt]                            { return RESTRICT; }
    [Dd][Ee][Ff][Aa][Uu][Ll][Tt]                                { return DEFAULT; }
    [Cc][Aa][Ss][Cc][Aa][Dd][Ee]                                { return CASCADE; }
    [Pp][Rr][Oo][Jj][Ee][Cc][Tt]                                { return PROJECT; }
    [Pp][Rr][Ii][Mm][Aa][Rr][Yy]                                { return PRIMARY; }
    [Ii][Nn][Dd][Ee][Xx][Ee][Ss]                                { return INDEXES; }
    [Uu][Nn][Ii][Qq][Uu][Ee]                                    { return UNIQUE; }
    [Dd][Ee][Ll][Ee][Tt][Ee]                                    { return DELETE; }
    [Uu][Pp][Dd][Aa][Tt][Ee]                                    { return UPDATE; }
    [Aa][Cc][Tt][Ii][Oo][Nn]                                    { return ACTION; }
    [Cc][Oo][Ll][Oo][Rr]                                        { return COLOR; }
    [Tt][Aa][Bb][Ll][Ee]                                        { return TABLE; }
    [Bb][Tt][Rr][Ee][Ee]                                        { return BTREE; }
    [Nn][Oo][Tt][Ee]                                            { return NOTE; }
    [Ee][Nn][Uu][Mm]                                            { return ENUM; }
    [Hh][Aa][Ss][Hh]                                            { return HASH; }
    [Tt][Yy][Pp][Ee]                                            { return TYPE; }
    [Nn][Aa][Mm][Ee]                                            { return NAME; }
    [Nn][Uu][Ll][Ll]                                            { return NULL; }
    [Nn][Oo][Tt]                                                { return NOT; }
    [Ss][Ee][Tt]                                                { return SET; }
    [Rr][Ee][Ff]                                                { return REF; }
    [Kk][Ee][Yy]                                                { return KEY; }
    [Pp][Kk]                                                    { return PK; }
    [Nn][Oo]                                                    { return NO; }
    [Aa][Ss]                                                    { return AS; }

    // Identifiers (any word that didn't match a keyword — JFlex longest-match ensures
    // "table_name" matches WORD not TABLE, because WORD is 10 chars vs TABLE's 5)
    {WORD}                      { return LITERAL; }

    // Catch-all
    [^]                         { return BAD_CHARACTER; }
}

// === String states ===
// Opening delimiters in YYINITIAL do NOT return a token — they just transition state.
// Each state matches content without returning. Since zzStartRead is set at the start
// of each advance() call, when the closing delimiter returns a token type, the token
// spans from the opening delimiter through the closing delimiter — one token per literal.
// If EOF is hit before the closing delimiter, return BAD_CHARACTER.

<IN_SINGLE_STRING> {
    "\\'"                       { /* escaped quote, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "'"                         { yybegin(YYINITIAL); return SINGLE_QUOTED_STRING; }
    [^\\'\n\r]+                 { /* content, continue */ }
    [\n\r]                      { yybegin(YYINITIAL); return BAD_CHARACTER; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any other char, continue */ }
}

<IN_DOUBLE_STRING> {
    "\\\""                      { /* escaped quote, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "\""                        { yybegin(YYINITIAL); return DOUBLE_QUOTED_STRING; }
    [^\\\"\n\r]+                { /* content, continue */ }
    [\n\r]                      { yybegin(YYINITIAL); return BAD_CHARACTER; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any other char, continue */ }
}

<IN_TRIPLE_STRING> {
    "\\'''"                     { /* escaped triple quote, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "'''"                       { yybegin(YYINITIAL); return TRIPLE_QUOTED_STRING; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any char including newlines, continue */ }
}

<IN_EXPRESSION> {
    "\\`"                       { /* escaped backtick, continue */ }
    "\\\\"                      { /* escaped backslash, continue */ }
    "`"                         { yybegin(YYINITIAL); return EXPRESSION; }
    [^\\`\n\r]+                 { /* content, continue */ }
    [\n\r]                      { yybegin(YYINITIAL); return BAD_CHARACTER; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any other char, continue */ }
}

// === Block comment state ===
<IN_BLOCK_COMMENT> {
    "*/"                        { yybegin(YYINITIAL); return BLOCK_COMMENT; }
    <<EOF>>                     { yybegin(YYINITIAL); return BAD_CHARACTER; }
    [^]                         { /* any char, continue */ }
}
