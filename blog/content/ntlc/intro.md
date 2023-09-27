+++
title = "Introduction"
description = "What is NTLC, and, what are we building exactly?"
date = "2023-09-20"
weight = 1
+++

# Intro

We are going to build a super tiny programming language called NTLC, and, we will do it from scratch in [Rust](https://www.rust-lang.org/).

## Why another programming language?

It's not a _real_ programming language. It's just a toy language that will we will use for fun and learning. It's not meant to be used for anything except learning and exploring.

\
If you do end up falling in love with programming languages, or you wish to learn more about them, or, perhaps you would like to create your own _real_ language then then I highly recommend:

- [Crafting Interpreters](https://craftinginterpreters.com/) by Bob Nystrom
- [Writing an Interpreter in Go](https://interpreterbook.com/) by Thorsten Ball
- Or if you are up for some adventures in OCaml and C++, [the amazing Bolt language series by Mukul Rathi](https://mukulrathi.com/create-your-own-programming-language/intro-to-compiler/)

## Why from scratch, and, why Rust?

Well, that's how one really learns in my opinion -- by doing.

\
As for Rust, it's a language that I have been wanting to explore for a while now -- _the hype you know_ -- and this seemed like a good opportunity to do so _(spoiler alert: it might not have been the wisest choice)_.

\
In my opinion, Rust is not a beginner friendly language. It's a very powerful one, but, it's also a complex one, especially if you haven't done any C or C++ before. Nevertheless, I will do my best to explain things as we go.

\
Having already planned to write about NTLC; I should've perhaps chosen a language that is more beginner friendly or one that I am really proficient with but where is the challenge in that!

# The Language

**NTLC** stands for "Neo Typed Lambda Calculus". The name was inspired from the book ["Types and Programming Languages"](https://www.cis.upenn.edu/~bcpierce/tapl/) by Benjamin C. Pierce, which is a great book on type theory and programming languages in general.

\
The book uses a language called "Simply Typed Lambda Calculus" to demonstrate the concepts of type theory, and, we are building a typed version of a simpler precursor to it known as "Untyped Arithmetic Expressions". It is just that for some reason my mind was already fixated on the name "Neo Typed Lambda Calculus" so I stuck with it.

## End to End

The language itself is so simple that one might not even call it a language, but that also makes for a great learning playground.

\
Also, I have never built a language before so this felt like a great place to start, and, it will allow us to build the full compiler pipeline<sup><a href="#full_compiler_pipeline">1</a></sup>: including a type checker, simple IDE integration and native code generation from start to finish.

### Small Interlude

I recommend this approach for anything you wish to build or learn:

1. Get a feeling for the landscape you're about to enter
2. Build a fully functioning thing. It doesn't have to be perfect or even good. It just has to work
3. Now, iterate and refine. You will have a much better understanding of the problem space and will be able to make better decisions

## What does it look like?

Here is a program/snippet written in NTLC:

```ntlc
if iszero(succ(0)) then true else false
```

which evaluates, you guessed it, to `false`.

\
`iszero()` is a builtin function that checks if the given argument is zero. `succ()` _(successor)_ is a function that increments its argument by one. `true`, `false` and `0` are predefined constants.

\
There is one more builtin function called `pred()` _(predecessor)_ that decrements its argument by one.

\
You can also nest things, here is another contrived example:

```ntlc
if iszero(succ(pred(0))) then if true then false else true else false
```

\
Yikes! And, that's it. That's the whole language.

\
There are no user defined types _(think classes, structs, or even variables)_ or functions. There are no loops. There are no strings. There aren't even any other numbers beside the predefined `0` constant. The language doesn't even allow empty lines. The whole program must be typed in one single line.

\
Again, this keeps things simple and allows us to build things end to end. Also, adding those -- _albeit tricky for some and near impossible for other_ -- constructs can be done iteratively and incrementally.

# What's next?

In the next chapter, we will build the first stage of our language compiler -- the lexer.

\
[See you there!](@/ntlc/lexer/index.md)

\
\

---

<ol id="footnotes"> 
 <li id="full_compiler_pipeline">It is as full of a pipeline as possible with such simple language that doesn't have many constructs but it is more than enough for a start.</li>
</ol>
