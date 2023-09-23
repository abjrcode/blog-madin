+++
title = "Type Checker"
description = "The type checker is the third step in the compilation process. It takes the AST and checks that the types are correct."
weight = 4
date = "2023-09-23"
+++

# Expectation vs Reality

> [Give me the codez](https://github.com/abjrcode/ntlc/blob/main/compiler/src/type_checker.rs)

The type checker was the part I was mostly excited about when I decided to start this project.

\
Why you might ask? there are a couple of reasons:

- Every time I sat off to write a compiler, I stopped at the parsing phase.
- Most courses on compilers usually stop here and instead implement an _interpreter_.

\
Spoiler alert though: our type checker is very basic. I did not realize that when I started off but for a type checker to do any meaningful work the language needs to, at the least, have variables. NTLC does not, and so there is barely any work for the type checker to do.

\
Before we start though, let's clear up some terminology.

## Type Checking vs Type Inference

The difference is actually quite easy to explain. Let's do that with a JavaScript example and pretend as if JavaScript had type inference built in.

```javascript
const x = 1;
const y = x + 3;
```

\
Notice that in the previous example, we did not have to specify the type of `x` nor `y`. The compiler would **infer** that `x` is an integer because it is assigned the value `1`, and so `y` is also an integer since it is equal to `INTEGER + INTEGER`.

\
Notice that JavaScript does not have type inference and the previous example would still have ran even if you did something like:

```javascript
const x = 1;
const y = "hello" + 3;
```

\
This is not about type inference but about static vs dynamic typing, which we will get to in a bit.

\
You might think all of this is very obvious, and it is in this silly example, but this can get _really tricky_ as you add functions and more complex types to a language<sup><a href="#type_inference">1</a></sup>.

\
If JavaScript was statically typed, then we would have to specify the types of `x` and `y` explicitly.

```javascript
// Fictitious JavaScript with static typing
const x: number = 1;
const y: number = x + 3;
```

Now, the compiler would not have to do any sort of inference. It just checks that the types are correct.

For example, since `y = x + 3`, `y` must be a number because we can only do addition with numbers. So, if the developer would have declared `y` as a `string` for example, the compiler would have errored.

\
It is not uncommon to see languages that have a mixture of both, where they infer the types of some expressions and require the developer to specify the types of others.

## Static vs Dynamic Typing

Type inference algorithms in some languages are pretty powerful that you might have mistaken those languages for being dynamically typed, OCaml is one example.

\
JavaScript is a dynamically typed language. This means that the type of a variable is not known until runtime, or at least not checked until then. This is why you can do things like:

```javascript
const x = 1;
const y = "hello" + 3;
```

And the compiler would not complain. It is only _at runtime_ that the interpreter would realize that you are trying to add a string to a number and throw an error.

\
Contrast this to a statically typed language like Rust where the compiler would not even compile the program, let alone let you run it.

```rust
// This will not compile in Rust
let x: i32 = 1;
let y: i32 = "hello" + 3;
//           ^^^^^^^^^^^ expected integer, found `&str`
```

# Type Checking NTLC

As I mentioned earlier, NTLC is a very simple language. It does not have variables, so there is no room for type inference.

\
But, we can still do type checking to prevent nonsensical programs such as:

```ntlc
if succ(true) then 0 else succ(0)
```

\
How are we supposed to evaluate `succ(true)`?
We could potentially do an implicit cast from `true` to `1` and pretend as if the previous expression is `succ(1)` but that sounds weird, at least to me.

\
Notice that if we don't add type checking to NTLC, that would make a dynamic language and the previous program would be valid, and you would be able to compile and run it - only to have the program crash at runtime.

## Type Checking Algorithm

Having NTLC grammar at hand:

```
TERM ::=
    true
    false
    if TERM then TERM else TERM
    0
    succ TERM
    pred TERM
    iszero TERM
```

The idea is very simple:

1. We already know the types of `true`, `false` and `0`, they are `Boolean`, `Boolean` and `Integer`, respectively.
2. We know that `succ` and `pred` take an `Integer` and return an `Integer`.
3. We know that `iszero` takes an `Integer` and returns a `Boolean`.
4. We know that an `if` expression must have something that evaluates to a `Boolean` as a condition and the `consequence` and `alternative` terms must be of the same type.

These will form the base cases of our type checking algorithm.

\
The algorithm is very similar to the recursive descent algorithm we used to parse the AST. We will traverse the AST and check that the types of the nodes match what we expect them to be.

\
Recursion would always stop at terminal nodes since those are always going to be either `0`, `true` or `false` which types we know.

Again, have a look at the code and I hope all of this would make perfect sense.

\
\

---

<ol id="footnotes">
  <li id="type_inference"><a target="_blank" href="https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system">Hindley-Milner</a> seems to be the most widely used type-inference algorithm. <a target="_blank" href="https://medium.com/@dhruvrajvanshi/type-inference-for-beginners-part-1-3e0a5be98a4b">Type Inference for Beginners</a> and <a target="_blank" href="https://mukulrathi.com/create-your-own-programming-language/intro-to-type-checking/">Intro to Type Checking</a> do a great job of explaining the concepts</li>
</ol>

# Code

```rust
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

use std::fmt::Display;

use crate::parser::Term;

#[derive(Debug, Clone)]
/**
 * This is like a Typed AST.
 *
 * There are two real possibilities for an NTLC program.
 * The whole program either evaluates to a boolean or an integer.
 * Check the grammar above to see why this is the case.
 *
 * `Void` is just a convenience to represent an empty program.
 */
pub enum TypedTerm {
    Boolean(Term),
    Integer(Term),
    Void,
}

/**
 * We implement equality manually for `TypedTerm` because we want to
 * ignore the inner term when comparing.
 *
 * If two expressions are of the same type, then they are equal.
 * We don't care about the inner term.
 */
impl PartialEq for TypedTerm {
    fn eq(&self, other: &Self) -> bool {
        matches!(
            (self, other),
            (TypedTerm::Boolean(_), TypedTerm::Boolean(_))
                | (TypedTerm::Integer(_), TypedTerm::Integer(_))
                | (TypedTerm::Void, TypedTerm::Void)
        )
    }
}

impl std::fmt::Display for TypedTerm {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            TypedTerm::Boolean(_) => write!(f, "BOOLEAN"),
            TypedTerm::Integer(_) => write!(f, "INTEGER"),
            TypedTerm::Void => write!(f, "<VOID - EMPTY PROGRAM>"),
        }
    }
}

#[derive(Debug, PartialEq)]
pub enum TypeError {
    TypeMismatch {
        expected: Vec<TypedTerm>,
        found: TypedTerm,
    },
}

impl Display for TypeError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            TypeError::TypeMismatch { expected, found } => {
                write!(f, "Type error! Expected one of: ")?;
                for (i, t) in expected.iter().enumerate() {
                    if i == expected.len() - 1 {
                        write!(f, "{}", t)?;
                    } else {
                        write!(f, "{}, ", t)?;
                    }
                }
                write!(f, " but found: {}", found)
            }
        }
    }
}

/**
 * This is the entry point of the type checker.
 * Although I called it `infer` it doesn't really do any inference.
 * The reason being that type inference is actually not needed
 *
 * For our grammar since we know the type of everything.
 * There is no inference needed.
 *
 * It just checks if the program is "well typed".
 * "Well typed": means you are not doing things like
 * iszero true or if 0 then true else false.
 *
 * It uses the same algorithm as recursive descent
 * traversing the AST and checking the types of the nodes.
 */
pub fn infer(ast: &Term) -> Result<TypedTerm, TypeError> {
    match ast {
        // The terminals which are also the base cases of the recursion
        // are the easiest to type check.
        Term::True => Ok(TypedTerm::Boolean(Term::True)),
        Term::False => Ok(TypedTerm::Boolean(Term::False)),
        Term::Zero => Ok(TypedTerm::Integer(Term::Zero)),
        /*
           We need to make sure that the inner term of the successor
           is an integer.
        */
        Term::Successor(t) => {
            let t = infer(t)?;
            match t {
                TypedTerm::Integer(inner_term) => Ok(TypedTerm::Integer(inner_term)),
                _ => Err(TypeError::TypeMismatch {
                    expected: vec![TypedTerm::Integer(Term::Empty)],
                    found: t,
                }),
            }
        }
        Term::Predecessor(t) => {
            let t = infer(t)?;
            match t {
                TypedTerm::Integer(inner_term) => Ok(TypedTerm::Integer(inner_term)),
                _ => Err(TypeError::TypeMismatch {
                    expected: vec![TypedTerm::Integer(Term::Empty)],
                    found: t,
                }),
            }
        }
        Term::IsZero(t) => {
            let t = infer(t)?;
            match t {
                TypedTerm::Integer(inner_term) => Ok(TypedTerm::Boolean(inner_term)),
                _ => Err(TypeError::TypeMismatch {
                    expected: vec![TypedTerm::Integer(Term::Empty)],
                    found: t,
                }),
            }
        }
        Term::Conditional {
            condition,
            consequence,
            alternative,
        } => {
            let condition_type = infer(condition)?;
            let conseq_type = infer(consequence)?;
            let alt_type = infer(alternative)?;

            /*
             * For the conditional we need to make sure that the condition
             * is a boolean and that the consequence and alternative are of the same type.
             *
             * This is to avoid things like:
             * if true then 0 else false
             *
             * While there is nothing wrong with the above program
             * We don't have a way to represent it in our grammar
             * or in our type system.
             *
             * The resulting type would be what is typically known
             * as a union type.
             *
             * So we simply disallow it in our case
             */
            match condition_type {
                TypedTerm::Boolean(_) => {
                    if conseq_type == alt_type {
                        Ok(conseq_type)
                    } else {
                        let expected_type = match conseq_type {
                            TypedTerm::Boolean(_) => TypedTerm::Boolean(Term::Empty),
                            TypedTerm::Integer(_) => TypedTerm::Integer(Term::Empty),
                            TypedTerm::Void => TypedTerm::Void,
                        };
                        Err(TypeError::TypeMismatch {
                            expected: vec![expected_type],
                            found: alt_type,
                        })
                    }
                }
                _ => Err(TypeError::TypeMismatch {
                    expected: vec![TypedTerm::Boolean(Term::Empty)],
                    found: condition_type,
                }),
            }
        }
        Term::Empty => Ok(TypedTerm::Void),
    }
}

#[cfg(test)]
mod test_type_checker_happy_path {
    use super::*;

    use crate::lexer::scan;
    use crate::parser::parse;

    #[test]
    fn test_empty_program() {
        let input = "";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Void);
    }

    #[test]
    fn test_true() {
        let input = "true";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Boolean(Term::True));
    }

    #[test]
    fn test_false() {
        let input = "false";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Boolean(Term::False));
    }

    #[test]
    fn test_zero() {
        let input = "0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Integer(Term::Zero));
    }

    #[test]
    fn test_successor() {
        let input = "succ 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Integer(Term::Zero));
    }

    #[test]
    fn test_predecessor() {
        let input = "pred 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Integer(Term::Zero));
    }

    #[test]
    fn test_is_zero() {
        let input = "iszero 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Boolean(Term::Zero));
    }

    #[test]
    fn test_conditional() {
        let input = "if true then 0 else 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Integer(Term::Zero));
    }

    #[test]
    fn test_boolean_conditional() {
        let input = "if true then false else true";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Boolean(Term::True));
    }

    #[test]
    fn test_nested_conditional() {
        let input = "if true then if true then 0 else 0 else 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Integer(Term::Zero));
    }

    #[test]
    fn test_condition_with_function_calls() {
        let input = "if iszero 0 then succ 0 else pred 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast).unwrap();

        assert_eq!(typed_ast, TypedTerm::Integer(Term::Zero));
    }
}

#[cfg(test)]
mod test_type_checker_unhappy_path {
    use super::*;

    use crate::lexer::scan;
    use crate::parser::parse;

    #[test]
    fn test_successor() {
        let input = "succ true";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast);

        assert_eq!(
            typed_ast,
            Err(TypeError::TypeMismatch {
                expected: vec![TypedTerm::Integer(Term::Empty)],
                found: TypedTerm::Boolean(Term::True)
            })
        );
    }

    #[test]
    fn test_predecessor() {
        let input = "pred true";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast);

        assert_eq!(
            typed_ast,
            Err(TypeError::TypeMismatch {
                expected: vec![TypedTerm::Integer(Term::Empty)],
                found: TypedTerm::Boolean(Term::True)
            })
        );
    }

    #[test]
    fn test_is_zero() {
        let input = "iszero true";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast);

        assert_eq!(
            typed_ast,
            Err(TypeError::TypeMismatch {
                expected: vec![TypedTerm::Integer(Term::Empty)],
                found: TypedTerm::Boolean(Term::True)
            })
        );
    }

    #[test]
    fn test_conditional() {
        let input = "if true then true else 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast);

        assert_eq!(
            typed_ast,
            Err(TypeError::TypeMismatch {
                expected: vec![TypedTerm::Boolean(Term::Empty)],
                found: TypedTerm::Integer(Term::Zero)
            })
        );
    }

    #[test]
    fn test_nested_conditional() {
        let input = "if true then if true then true else 0 else 0";
        let tokens = scan(input).unwrap();
        let ast = parse(tokens).unwrap();
        let typed_ast = infer(&ast);

        assert_eq!(
            typed_ast,
            Err(TypeError::TypeMismatch {
                expected: vec![TypedTerm::Boolean(Term::Empty)],
                found: TypedTerm::Integer(Term::Zero)
            })
        );
    }
}
```
