+++
title = "Lexer"
description = "The lexer is the first step in the compilation process. It takes the source code and converts it into a stream of tokens."
date = "2023-09-20"
weight = 2
+++

> [Just give me the codez](https://github.com/abjrcode/ntlc/blob/main/compiler/src/lexer.rs)

# What is a lexer?

The **lexer**<sup><a href="#lexer_derivation">1</a></sup>, also known as the **tokenizer** or the **scanner**, is the first stage in the compilation process. It takes source code _(NTLC source code in our case)_ and converts it into a stream of "tokens".

\
First stage you say, are there more? Definitely!

\
Actually, the compiler is more like a pipeline. Each stage takes the output of the previous one and transforms it into something that is ready for the next stage to consume. The output of the lexer is the input of the parser, and so on.

\
Here is a very typical compiler pipeline<sup><a href="#compiler_pipeline">2</a></sup>:

![Compiler Pipeline](compiler_pipeline.svg)

## Why do we need a lexer?

Strictly speaking, we don't. It just allows us to work with the source code on a higher conceptual level. Later stages, namely the parser, will have way easier time reasoning about the structure of the source code if it doesn't have to worry about string indices, whitespace characters, and/or the nuances of character sets and text encoding.

\
Actually this is true of every stage in the pipeline. If the source language was so simple, you probably would not even need a compiler. You could get away with a few regular expressions and a bunch of string manipulation functions.

\
The compiler is essentially a systematic and deterministic way to convert a program written in one language to another. Remember the good old divide and conquer technique: it advises you to break a big problem into smaller manageable ones! Well, that's what the compiler really does with all its stages.

# Lexer output

Remember when we said earlier that the lexer converts source code to tokens. It is time we talk about those tokens.

The lexer typically outputs an array/vector/list of tokens _(technically speaking, that's if it is not a streaming lexer but let's ignore that for now)_.

\
Now, most of the time a token<sup><a href="#token">3</a></sup> is a structure that has a type and a value. Here is an example to illustrate how our NTLC snippet from the [previous post](@/ntlc/intro.md) would map to a list of tokens:

![Lexer Output](lexer_at_work.svg)

Notice that because our language is very simple, things almost map one-to-one without any additional data.

\
But, say for example our language was to support arbitrary numbers or strings, then we would probably extend our token type to include a value field that would hold the actual value of the token.

\
For instance, a string token might look like this:

```rust
pub enum Token {
    StringLiteral(String),
    //            ^^^^^^
    //            This is the value field
    //
    //
    // More token types ...
}
```

or in TypeScript:

```typescript
class StringLiteral {
  constructor(public readonly value: string) {}
}

type Token = StringLiteral | ...
```

\
When the lexer scans an input that has a string literal like "Hello World", it would emit a token of type `StringLiteral` with a value of "Hello World" like so:

```
Token::StringLiteral("Hello World")
```

\
One final thing, you might be thinking: wait, where did we get our token types from? Did we just make them up?

\
Actually, sort of. Remember, this is _our_ language and we get to define the rules, but, we won't get into those until the next article on [parsers](@/ntlc/parser/index.md).

## How do lexers work?

Before we describe the workings of the lexer, and parser for that matter, it is worth mentioning that there exists tools known as Parser Generators _([yacc](https://en.wikipedia.org/wiki/Yacc) and [Tree Sitter](https://tree-sitter.github.io/tree-sitter/) are such tools)_ that can actually generate code that implements the lexer and parser for your given you provide them with your programming language definition in some form or another, but hey, where is the fun in that!

\
Okay, getting back to how lexers work. They basically scan the input character by character<sup><a href="#lexer_regex">4</a></sup> _(and most of the time, they take a sneak peek ahead at the next character or characters)_ and try to match those characters against a set of rules. If a rule matches, the lexer would emit a token and move on to the next character. If it comes across an unexpected character, it would throw an error.

\
It's good to know that in NTLC we have the following token types:

```rust
pub enum Token {
    True, // Literal true
    False, // Literal false
    If, // Keyword if
    Then, // Keyword then
    Else, // Keyword else
    Zero, // Literal zero
    Succ, // builtin function succ()
    Pred, // builtin function pred()
    IsZero, // builtin function iszero()
    LeftParenthesis, // (
    RightParenthesis, // )
    EOF, // End of file (this is not something that ones types in but it's a handy way to represent
         // the end of the input)
}
```

\
Okay, enough with words. I feel that describing the workings of a compiler makes things sound more complicated than they actually are. So, let's just look at the code. I have left comments all over the place to explain what is going on.

<ol id="footnotes">
  <li id="lexer_derivation">The word "lexer" is derived from the Latin word "lexicon" which refers to the vocabulary of a language, including its words and their meanings.</li>
  <li id="compiler_pipeline">Actually, there is something quite satisfying about compilers: they are as "pure" as they can be. The compiler is essentially a function that takes a string and returns an alternative representation of that string -- no network calls, no database transactions, no file storage etc.</li>
  <li id="token">Sometimes the token encodes additional information such as the line number and column of the corresponding source code. Choosing what to store in a token depends on your application and requirements</li>
  <li id="lexer_regex">Most of the time, lexers are defined in terms of one or more more regular expressions and you will see why soon!</li>
</ol>

# Full Lexer code listing

> HINT: check the tests at the bottom of the file for more examples on how the lexer works

\
Again, the full source code for the project is available [here](https://github.com/abjrcode/ntlc/blob/main/compiler/src/lexer.rs)!

\
The `scan()`function at line **271** is the entry point of the lexer module and the place where the main logic resides, so, make sure you start there first as everything else is more or less helper utilities.

```rust,linenos
use std::error::Error;
use std::fmt::Debug;
use std::vec::Vec;

// I keep a copy of the grammar here for reference
/*
 *    t ::= // terms
 *        true  // constant true
 *        false // constant false
 *        if t then t else t // conditional
 *        0 // constant zero
 *        succ t // successor
 *        pred t // predecessor
 *        iszero t // zero test
 *        */

static KEYWORD_TRUE: &str = "true";
static KEYWORD_FALSE: &str = "false";
static KEYWORD_IF: &str = "if";
static KEYWORD_THEN: &str = "then";
static KEYWORD_ELSE: &str = "else";
static KEYWORD_IS_ZERO: &str = "iszero";
static KEYWORD_ZERO: &str = "0";
static KEYWORD_SUCC: &str = "succ";
static KEYWORD_PRED: &str = "pred";

// These are directives. Similar to annotations or decorators in other programming languages
// clippy is Rust's linter and we are just telling it to be quite about EOF casing
#[allow(clippy::upper_case_acronyms)]
// In Rust one can ask the compiler to implement certain interfaces for
// a type by using the `derive` keyword. In this case we are asking the
// compiler to implement the `PartialEq` (Partial Equality) interface for the `Token` type
// which is needed/used when we compare two values of the same type for equality using ==.
#[derive(PartialEq)]
/*
 `enum` is, roughly speaking, similar to how unions work in TypeScript where you can say:
 `type Token = True | False`
 And so token can either be True or False
 Notice that `True` and `False` are not the literal boolean values `true` and `false`
 but rather the names of the variants of the enum. They are types in their own right.
 Tokens are the output of the lexer and are the input of the parser.
*/
pub enum Token {
    True,
    False,
    If,
    Then,
    Else,
    Zero,
    Succ,
    Pred,
    IsZero,
    LeftParenthesis,
    RightParenthesis,
    EOF,
}

/**
 * Rust doesn't have classes but structs which are similar to classes in other languages, just without "inline" methods.
 * This is how one implements "traits" (which roughly correspond to interfaces in other languages)
 * for a struct.
 * Essentially we are saying the Token type implements the Debug trait.
 * The Debug trait allows us to print the value of a Token when used in a format string (akin to string interpolation).
 */
impl Debug for Token {
    fn fmt(
        &self, /* similar to `this` in object oriented languages */
        f: &mut std::fmt::Formatter,
    ) -> std::fmt::Result {
        /*
         * I hope this very readable and self explanatory
         */
        match self {
            Token::True => write!(f, "TRUE"),
            Token::False => write!(f, "FALSE"),
            Token::If => write!(f, "IF"),
            Token::Then => write!(f, "THEN"),
            Token::Else => write!(f, "ELSE"),
            Token::Zero => write!(f, "0"),
            Token::Succ => write!(f, "SUCC"),
            Token::Pred => write!(f, "PRED"),
            Token::IsZero => write!(f, "IS_ZERO"),
            Token::LeftParenthesis => write!(f, "("),
            Token::RightParenthesis => write!(f, ")"),
            Token::EOF => write!(f, "<EOF>"),
        }
    }
}

/**
 * While the `Debug` trait is used for debugging purposes, the `Display` trait is used for printing
 * a human readable or nice string representation of a value.
 * It is similar in that regard to how one might override `toString()` in Java.
 */
impl std::fmt::Display for Token {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Token::True => write!(f, "TRUE"),
            Token::False => write!(f, "FALSE"),
            Token::If => write!(f, "IF"),
            Token::Then => write!(f, "THEN"),
            Token::Else => write!(f, "ELSE"),
            Token::Zero => write!(f, "0"),
            Token::Succ => write!(f, "SUCC"),
            Token::Pred => write!(f, "PRED"),
            Token::IsZero => write!(f, "IS_ZERO"),
            Token::LeftParenthesis => write!(f, "("),
            Token::RightParenthesis => write!(f, ")"),
            Token::EOF => write!(f, "<EOF>"),
        }
    }
}

#[derive(PartialEq)]
/*
* We use an enum to represent the different kind of errors the lexer could run into
*/
pub enum LexingError {
    UnrecognizedToken {
        found: String,
        column: usize,
        line: usize,
    },
    UnexpectedCharacter {
        found: char,
        expected: Vec<String>,
        column: usize,
        line: usize,
    },
    UnexpectedEOF {
        expected: Vec<String>,
        column: usize,
        line: usize,
    },
}

/**
 * This is a helper function that is used to format Lexer error message
 */
fn format_expectation_error(expected: &Vec<String>) -> String {
    let mut result: Vec<String> = Vec::new();

    for e in expected {
        match e {
            s if s == " " => result.push("<SPACE>".to_string()),
            s if s == "\t" => result.push("<TAB>".to_string()),
            s if s == "\0" => result.push("<EOF>".to_string()),
            s => result.push(format!("'{}'", s)),
        }
    }

    result.join(", ")
}

impl std::fmt::Display for LexingError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            LexingError::UnrecognizedToken {
                found,
                column,
                line,
            } => {
                write!(
                    f,
                    "Unrecognized token '{}' at line {}, column {}",
                    found,
                    line + 1,
                    column
                )
            }
            LexingError::UnexpectedCharacter {
                found,
                expected,
                column,
                line,
            } => {
                write!(
                    f,
                    "Found '{}' at line {}, column {} when perhaphs you meant '{}'?",
                    found,
                    line,
                    column + 1,
                    format_expectation_error(expected)
                )
            }
            LexingError::UnexpectedEOF {
                expected,
                column,
                line,
            } => {
                write!(
                    f,
                    "Unexpected end of file at line {}, column {} when you perhaps meant '{}'?",
                    line,
                    column + 1,
                    format_expectation_error(expected)
                )
            }
        }
    }
}

impl std::fmt::Debug for LexingError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            LexingError::UnrecognizedToken {
                found,
                column,
                line,
            } => {
                write!(f, "Unknown token '{}' at ({}, {})", found, line, column)
            }
            LexingError::UnexpectedCharacter {
                found,
                expected,
                column,
                line,
            } => {
                write!(
                    f,
                    "Unexpected token '{}' at ({}, {}). Expectation context {}",
                    found,
                    line,
                    column,
                    format_expectation_error(expected)
                )
            }
            LexingError::UnexpectedEOF {
                expected,
                column,
                line,
            } => {
                write!(
                    f,
                    "Unexpected EOF looking for lexeme '{}' at ({}, {})",
                    format_expectation_error(expected),
                    line,
                    column
                )
            }
        }
    }
}

/**
 * The `Error` trait is like a marker interface
 * It is just tells the compiler that `LexingError` is, well, kinda of an error
 */
impl Error for LexingError {}

/**
 * This is the heart of the lexer. It basically takes NTLC program source code
 * as input and returns a vector/list of tokens of type `Token` as output.
 *
 * It iterates the input string character by character from left to right and tries to match them
 * against the known tokens of the language.
 *
 * Most of the time, the lexer is actually made part of the parser module and is implemented
 * as a streaming lexer. That is, it is implemented as a function that returns the next
 * token only when asked for explicitly by the parser and not all at once.
 * This is done to avoid having to read the entire input into memory at once.
 * Also, when working within a text editor or IDE, those tools can send you incomplete
 * pieces of code to avoid resending the entire source file over and over again.
 * We will see this when we are working on the language server.
 *
 *
 * You might see the `&str` type and wonder what it is. It is just a reference to a string.
 * Or to be more technically correct, a readonly reference to a string slice (what a mouthful).
 * This avoids copying the string around in memory. Don't worry about it too much.
 *
 * The `Result<>` type is a probably implemented as an `enum` under te hood. It says this function
 * either returns a vector of tokens or an error
 * This is a concept from functional programming and it's very idiomatic to see the Result<>
 * type all over the place in Rust code.
 * If you worked with a language that uses exceptions, this might be feel strange at first
 * but, I personally think it is way cleaner to explicitly state that your function might
 * return an error. This reminds me to some extent of checked exceptions in Java (at least last time I used it).
 */
pub fn scan(input: &str) -> Result<Vec<Token>, LexingError> {
    let mut tokens: Vec<Token> = Vec::new();

    /*
    This line might seem to be doing a bit of magic but essentially it is just a convenient
    way to line up the input with itself shifted by one character, essentially giving us each character
    and the one following it as a pair (char, next_char). Let me demonstrate:

    let's say that the input is "succ(0)" this will give us the following:
    s u c c ( 0 )
    u c c ( 0 ) \0

    and as pairs comes out as:
    [('s', 'u'), ('u', 'c'), ('c', 'c'), ('c', '('), ('(', '0'), ('0', ')'), (')', '\0')]

    This is handy because a lot of the time we need to "lookahead" when we are scanning the input
    to decide what the next token is. Keep reading.
    */
    let mut chars = input
        .chars()
        .zip(input.chars().skip(1).chain(['\0'])) // we are adding a null character at the end of the shifted string so both strings have the same length, this prevents the iterator from stopping prematurely
        .peekable();

    // We are tracking the line number although our lexer doesn't support multiple lines of input
    // This is useful for error reporting if we were to support new lines.
    // The same with the `index` which is the column number within the input string
    let line = 1usize;
    let mut index = 0usize;

    // This is the main loop of the lexer. It iterates over the input characters
    // and tries to match them against known tokens of the language
    // The `let Some(&(c, next)) = chars.peek()` is known as a pattern match expression
    // It is also something that is very common in functional languages
    // It is similar to destructuring in JavaScript or Python but more powerful
    // Here we are saying, if there is a next character in the input, assign it to `c`
    // and assign the character after it to `next`
    while let Some(&(c, next)) = chars.peek() {
        // This is the main match statement. It is similar to a switch statement in other languages
        // but more powerful because of pattern matching
        // Now, the code basically and does the following:
        match c {
            // if the current character is 't' then check the next character
            // because in our grammar, there are two tokens that start with 't'
            // `true` and `then` and we need to know which one it is
            // if the `t` is followed by an `r` then it is `true` otherwise it is `then`
            // and we can move on to the next token
            // the reset of the rules work in a similar fashion
            // now you see why lexers typically use regular expressions to match tokens
            't' => match next {
                'r' => {
                    /*
                    We use the consume function to "consume" the rest of the keyword
                    and advance the iterator to the next character
                     */
                    index += consume(&mut chars, KEYWORD_TRUE, line, index)?;
                    tokens.push(Token::True);
                    /*
                    We use the match_one_of function to check if the next character is
                    one of the characters we expect to see after the keyword
                    Imagine that the input might be the invalid program `truefalse`
                    This is incorrect and we we use match_one_of to detect that
                    Here we are saying we expect to see either a space, a tab, a right parenthesis
                    Notice that this would accept the input `true)` which is also incorrect
                    but that would be detected by the parser
                    Choosing which errors to catch where is a matter of taste and maybe
                    a bit of performance
                    */
                    match_one_of(
                        chars.peek().map(|&(x, _)| x),
                        &[' ', '\t', ')'],
                        true,
                        line,
                        index,
                    )?;
                }
                'h' => {
                    index += consume(&mut chars, KEYWORD_THEN, line, index)?;
                    tokens.push(Token::Then);
                    match_one_of(
                        chars.peek().map(|&(x, _)| x),
                        &[' ', '\t'],
                        false,
                        line,
                        index,
                    )?;
                }
                '\0' => {
                    return Err(LexingError::UnexpectedEOF {
                        expected: vec!["true".to_string(), "then".to_string()],
                        column: index,
                        line,
                    })
                }
                c => {
                    return Err(LexingError::UnexpectedCharacter {
                        found: c,
                        expected: vec!["true".to_string(), "then".to_string()],
                        column: index,
                        line,
                    })
                }
            },
            'f' => {
                index += consume(&mut chars, KEYWORD_FALSE, line, index)?;
                tokens.push(Token::False);
                match_one_of(
                    chars.peek().map(|&(x, _)| x),
                    &[' ', '\t', ')'],
                    true,
                    line,
                    index,
                )?;
            }
            'i' => match next {
                'f' => {
                    index += consume(&mut chars, KEYWORD_IF, line, index)?;
                    tokens.push(Token::If);
                    match_one_of(
                        chars.peek().map(|&(x, _)| x),
                        &[' ', '\t'],
                        false,
                        line,
                        index,
                    )?;
                }
                's' => {
                    index += consume(&mut chars, KEYWORD_IS_ZERO, line, index)?;
                    tokens.push(Token::IsZero);
                    match_one_of(
                        chars.peek().map(|&(x, _)| x),
                        &[' ', '\t', '('],
                        false,
                        line,
                        index,
                    )?;
                }
                '\0' => {
                    return Err(LexingError::UnexpectedEOF {
                        expected: vec!["if".to_string(), "iszero".to_string()],
                        column: index,
                        line,
                    })
                }
                c => {
                    return Err(LexingError::UnexpectedCharacter {
                        found: c,
                        expected: vec!["if".to_string(), "iszero".to_string()],
                        column: index,
                        line,
                    })
                }
            },
            'e' => {
                index += consume(&mut chars, KEYWORD_ELSE, line, index)?;
                tokens.push(Token::Else);
                match_one_of(
                    chars.peek().map(|&(x, _)| x),
                    &[' ', '\t'],
                    false,
                    line,
                    index,
                )?;
            }
            '0' => {
                index += consume(&mut chars, KEYWORD_ZERO, line, index)?;
                tokens.push(Token::Zero);
                match_one_of(
                    chars.peek().map(|&(x, _)| x),
                    &[' ', '\t', ')'],
                    true,
                    line,
                    index,
                )?;
            }
            's' => {
                index += consume(&mut chars, KEYWORD_SUCC, line, index)?;
                tokens.push(Token::Succ);
                match_one_of(
                    chars.peek().map(|&(x, _)| x),
                    &[' ', '\t', '('],
                    false,
                    line,
                    index,
                )?;
            }
            'p' => {
                index += consume(&mut chars, KEYWORD_PRED, line, index)?;
                tokens.push(Token::Pred);
                match_one_of(
                    chars.peek().map(|&(x, _)| x),
                    &[' ', '\t', '('],
                    false,
                    line,
                    index,
                )?;
            }
            '(' => {
                chars.next();
                index += 1;
                tokens.push(Token::LeftParenthesis);
            }
            ')' => {
                chars.next();
                index += 1;
                tokens.push(Token::RightParenthesis);
            }
            /*
            We don't care about whitespace characters so we just skip them
            */
            '\t' | ' ' => {
                chars.next();
                index += 1;
            }
            /*
            This is the case where we don't recognize the current character
            as part of the language so we just error
            */
            ut => {
                return Err(LexingError::UnrecognizedToken {
                    found: ut.to_string(),
                    column: index,
                    line,
                })
            }
        }
    }

    // We add an EOF token at the end of the token stream to indicate we are done
    // This is used later by the parser to know when to stop or error
    tokens.push(Token::EOF);

    Ok(tokens)
}

/*
This is a helper function that consumes a literal from the input
It is used to match keywords and other literals in the language
 */
fn consume<T>(
    input: &mut T,
    literal: &'static str,
    line: usize,
    index: usize,
) -> Result<usize, LexingError>
where
    T: std::iter::Iterator<Item = (char, char)>,
{
    let mut i = index;

    for expected in literal.chars() {
        match input.next() {
            Some((c, _)) => {
                if c != expected {
                    return Err(LexingError::UnexpectedCharacter {
                        found: c,
                        expected: vec![literal.to_string()],
                        column: i,
                        line,
                    });
                } else {
                    i += 1;
                }
            }
            None => {
                return Err(LexingError::UnexpectedEOF {
                    expected: vec![literal.to_string()],
                    column: i,
                    line,
                });
            }
        }
    }

    Ok(literal.len())
}

/**
 * This is another helper function that is used to match a character against a list of characters
 * Sometimes we might expecting one character or another so this function tries to do that
 * and if it cannot it errors
 * For example, let's say our input program is `pre(0)`
 * The `scan` function sees a `p` and tries to match it against the `pred` keyword
 * but when it reaches `e` it cannot find `d` so it errors
 */
fn match_one_of(
    input: Option<char>,
    literals: &[char],
    allow_eof: bool,
    line: usize,
    index: usize,
) -> Result<usize, LexingError> {
    match input {
        Some(next_next) => {
            let eof_expectation = if allow_eof {
                vec!["<EOF>".to_string()]
            } else {
                vec![]
            };

            if !literals.contains(&next_next) {
                return Err(LexingError::UnexpectedCharacter {
                    found: next_next,
                    expected: literals
                        .iter()
                        .map(|c| format!("{}", c))
                        .chain(eof_expectation)
                        .collect(),
                    column: index,
                    line,
                });
            }

            Ok(1)
        }
        None => {
            if !allow_eof {
                return Err(LexingError::UnexpectedEOF {
                    expected: literals.iter().map(|c| format!("{}", c)).collect(),
                    column: index,
                    line,
                });
            }

            Ok(0)
        }
    }
}

#[cfg(test)]
mod lexer_tests_happy_path {
    use super::*;

    #[test]
    fn test_scan_empty_string() {
        let input = "";

        let tokens = scan(input).unwrap();

        assert_eq!(tokens[0], Token::EOF);
    }

    #[test]
    fn test_scan_basic() {
        let input = "true false if then else 0 succ pred iszero ()";

        let tokens = scan(input).unwrap();

        assert_eq!(tokens[0], Token::True);
        assert_eq!(tokens[1], Token::False);
        assert_eq!(tokens[2], Token::If);
        assert_eq!(tokens[3], Token::Then);
        assert_eq!(tokens[4], Token::Else);
        assert_eq!(tokens[5], Token::Zero);
        assert_eq!(tokens[6], Token::Succ);
        assert_eq!(tokens[7], Token::Pred);
        assert_eq!(tokens[8], Token::IsZero);
        assert_eq!(tokens[9], Token::LeftParenthesis);
        assert_eq!(tokens[10], Token::RightParenthesis);
    }

    #[test]
    fn test_scan_mixture_of_whitespaces() {
        let input = "if\ttrue\t\t then         0 else        succ\t0";

        let tokens = scan(input).unwrap();

        assert_eq!(tokens[0], Token::If);
        assert_eq!(tokens[1], Token::True);
        assert_eq!(tokens[2], Token::Then);
        assert_eq!(tokens[3], Token::Zero);
        assert_eq!(tokens[4], Token::Else);
        assert_eq!(tokens[5], Token::Succ);
        assert_eq!(tokens[6], Token::Zero);
        assert_eq!(tokens[7], Token::EOF);
    }

    #[test]
    fn test_scan_parantheses() {
        let input = "if (true) then 0 else (succ (pred(0))";

        let tokens = scan(input).unwrap();

        assert_eq!(tokens[0], Token::If);
        assert_eq!(tokens[1], Token::LeftParenthesis);
        assert_eq!(tokens[2], Token::True);
        assert_eq!(tokens[3], Token::RightParenthesis);
        assert_eq!(tokens[4], Token::Then);
        assert_eq!(tokens[5], Token::Zero);
        assert_eq!(tokens[6], Token::Else);
        assert_eq!(tokens[7], Token::LeftParenthesis);
        assert_eq!(tokens[8], Token::Succ);
        assert_eq!(tokens[9], Token::LeftParenthesis);
        assert_eq!(tokens[10], Token::Pred);
        assert_eq!(tokens[11], Token::LeftParenthesis);
        assert_eq!(tokens[12], Token::Zero);
        assert_eq!(tokens[13], Token::RightParenthesis);
        assert_eq!(tokens[14], Token::RightParenthesis);
        assert_eq!(tokens[15], Token::EOF);
    }

    #[test]
    fn test_scan_valid_tokens_bad_syntax() {
        let input = "true)false)if then 0";

        let tokens = scan(input).unwrap();

        assert_eq!(tokens[0], Token::True);
        assert_eq!(tokens[1], Token::RightParenthesis);
        assert_eq!(tokens[2], Token::False);
        assert_eq!(tokens[3], Token::RightParenthesis);
        assert_eq!(tokens[4], Token::If);
        assert_eq!(tokens[5], Token::Then);
        assert_eq!(tokens[6], Token::Zero);
        assert_eq!(tokens[7], Token::EOF);
    }
}

#[cfg(test)]
mod lexer_tests_sad_path {
    use super::*;

    #[test]
    fn test_scan_unrecognized_token_error() {
        let input = "if    true then 0   else succ    0 1";

        let tokens = scan(input);

        assert_eq!(
            tokens.err(),
            Some(LexingError::UnrecognizedToken {
                found: String::from("1"),
                column: 35,
                line: 1,
            })
        );
    }

    #[test]
    fn test_scan_unexpected_token_error() {
        let input = "succ( suc ( 0 ) )";

        let tokens = scan(input);

        assert_eq!(
            tokens.err(),
            Some(LexingError::UnexpectedCharacter {
                found: ' ',
                expected: vec!["succ".to_string()],
                column: 9,
                line: 1,
            })
        );
    }

    #[test]
    fn test_scan_unexpected_eof_error() {
        let input = "tr";

        let tokens = scan(input);

        assert_eq!(
            tokens.err(),
            Some(LexingError::UnexpectedEOF {
                expected: vec!["true".to_string()],
                column: 2,
                line: 1,
            })
        );
    }

    #[test]
    fn test_scan_literals_no_spaces_unexpected_token_error() {
        let input = "truefalse";

        let tokens = scan(input);

        assert_eq!(
            tokens.err(),
            Some(LexingError::UnexpectedCharacter {
                found: 'f',
                expected: vec![
                    " ".to_string(),
                    "\t".to_string(),
                    ")".to_string(),
                    "<EOF>".to_string()
                ],
                column: 4,
                line: 1,
            })
        );
    }
}
```
