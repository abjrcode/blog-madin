+++
title = "Code Generation"
description = "The code generator is the fourth step in the compilation process. It takes the AST and converts it into LLVM IR."
date = "2023-09-28T00:00:00Z"
weight = 6
+++

> [Just give me the codez](https://github.com/abjrcode/ntlc/blob/main/compiler/src/codegen.rs)

# Introduction

Welcome to the fourth and final step in our journey. This step is what differentiates a compiled language from an interpreted one<sup>[1](#compiled_vs_interpreted)</sup>

In interpreted languages, the interpreter is responsible for executing the program. It does so by reading the source code, parsing it into an AST and executing the AST directly. JavaScript, Python and Ruby are examples of interpreted languages.

In compiled languages, the compiler reads the source code, parses it into an AST then transforms<sup>[2](#visitor_pattern)</sup> the AST into an [Intermediate Representations (IR)](https://en.wikipedia.org/wiki/Intermediate_representation), assembly code or directly into machine code. The end user can then run the resulting binary directly using their operating system. C, C++ and Rust are examples of compiled languages.

## Low Level Virtual Machine (LLVM)

Most compilers used to implement code generation directly, but as the number of [platforms](https://en.wikipedia.org/wiki/Computing_platform) _(Windows, OSx, \*Nix)_ kept growing and the number of [compute architectures](https://en.wikipedia.org/wiki/Comparison_of_instruction_set_architectures) became even larger _(think x86_64, arch64 etc...)_, it became harder to maintain a single code generator that targets all platforms.

LLVM<sup>[3](#cranelift)</sup> was born out of the need to solve this problem<sup>[4](#lsp_similarity)</sup>. It is a collection of tools and libraries that can be used to build compiler **backend**s.

Everything that we have worked on so far, i.e. the lexer, parser and type checker are part of the **frontend** of a compiler.

The frontend is distinct per programming language and implemented specifically for that language. The frontend is the thing that gives a language its "identity" and provides its unique features that separate it from other languages.

## LLVM -- High Level Overview

I would love to sit here and give you an introduction to LLVM, but I think [this article](https://mukulrathi.com/create-your-own-programming-language/llvm-ir-cpp-api-tutorial/) does a an amazing job at that, so please read it before continuing. It is sufficient to read up to and including the [Types and Constants](https://mukulrathi.com/create-your-own-programming-language/llvm-ir-cpp-api-tutorial/#types-and-constants) section.

# Translating NTLC to LLVM IR

> Read [LLVM Tutorial](https://mukulrathi.com/create-your-own-programming-language/llvm-ir-cpp-api-tutorial/) before proceeding

NTLC is a very simple language, so translating it to LLVM IR is not that hard.

We will translate an entire NTLC program into a function, conveniently named `main` that takes no arguments and returns an integer. The return value of the function will be the result of evaluating the NTLC program. This is very similar to how `main` works in most programming languages.

The function's body -- implementation -- will be the result of translating each NTLC construct to LLVM IR.

Let's go over each each construct in NTLC and see how it maps to LLVM IR.

## Integer & Boolean Constants

Integers and Booleans are the only two types in NTLC. In LLVM IR, integers are represented by the `i32` type and booleans are represented by the `i1` type. Very straightforward.

## Successor & Predecessor

`succ` and `pred` are both builtin functions in NTLC. They are used to increment and decrement integers respectively. We only need to define both of these functions once since they are kind of "global functions" that can invoked by NTLC code anywhere.

In LLVM IR, we can implement them roughly as:

```asm
define i32 @succ(i32 %x) {
  %1 = add i32 %x, 1
  ret i32 %1
}
```

and

```asm
define i32 @pred(i32 %x) {
  %1 = sub i32 %x, 1
  ret i32 %1
}
```

## IsZero

`iszero` is another builtin function in NTLC. It is used to check if an integer is zero or not. In LLVM IR, we can implement it as follows:

```asm
define i1 @izzero(i32 %x) {
  %1 = icmp eq i32 %x, 0
  ret i1 %1
}
```

Now that `succ`, `pred` and `iszero` are all defined, we can invoke (call) them in LLVM by using their name and the appropriate arguments.

An example invocation of `succ` would look like this:

```asm
%1 = call i32 @succ(i32 0)
```

## Conditionals

The final and most complex construct in NTLC is the conditional expression. It is used to alter the execution path of a program based on the value of a boolean expression. In LLVM IR, conditionals are implemented using _labels_ and _jumps_.

Labels and jumps were very popular in the early days of programming, even when working with what was deemed "high level languages" back then. But, the code they can result in can be hard to read and thus not easy to maintain. So, most language introduced constructs such as for loops, while loops and if statements that abstract the developer from working with labels and jumps directly.

I say "abstract" because under the hood, compilers are still converting those language features to labels and jumps.

If you aren't familiar with labels and jumps, here is a small example to illustrate the concept in pseudo code:

```
main() {
    // A label is just a name for a sequence of statements

    // Indented statements are "part of the label": they are executed
    // when the program "jumps" to execute the label

    // In that sense, a label is similar to a function
    // except that it doesn't take any arguments and doesn't return anything
    here: // <------- `here` is a label
        print("Hello World")

    // This is another label
    there:
        print("Goodbye World")

    if (true) {
        // This is a jump
        goto here
        // It causes the program to go and execute the label statements
        // The program then continues executing the statements after the label one by one
        // WE NEVER REACH THIS LINE
    } else {
        // This is another jump
        goto there
    }
}
```

If the previous code snippet was actual code, it would cause an infinite loop. The program would print "Hello World" forever.

### Conditionals in LLVM IR

Even with my understanding of labels and jumps, I had a hard time implementing them initially for NTLC. Why you might ask?

Because I could not see how would nested conditionals work! Let me illustrate with an example:

```ntlc
if true then if false then true else true else false
```

Here is the problem:

1. Label names must be unique
2. You cannot nest labels

You might be thinking: "Why not just generate a unique name for each label?"

The short answer is: You are right. I just got confused with the LLVM API.

When you translate source code to LLVM IR, you don't simple map your source language constructs to LLVM IR. That would be too error prone and would require a lot of boilerplate code.

You use the LLVM API to create constructs that represent your code. So, I thought that I would have to maintain a lookup table for label names I have generated within a function, create a label, check if it exists in the table and if it does then create a new unique name for it. I would have to do so recursively as conditionals can be nested infinitely -- at least in theory.

The solution turned out to be way simpler than I thought. When using the LLVM API to create a label, if the label doesn't exist, LLVM will create it for you. If it does exist, LLVM will generate a new unique name for you and everything will work as expected.

That's why the LLVM API gives you the `context` and `IRBuilder` types. They are used internally by LLVM to keep track of things like label names and other state.

If this still doesn't make sense, don't worry. It will become clearer when we look at the code.

## LLVM Optimizations

LLVM can be configured to perform optimizations on the generated IR. This is a very powerful feature that can result in significant performance improvements.

Those optimizations tend to "rewrite" your generated IR into a functionally equivalent but more efficient IR.

I have deliberately chosen to disable those optimizations, because:

1. NTLC is not really meant for any real world usage
2. And, this allows you _(and me)_ to see how the generated LLVM instructions map to their corresponding NTLC constructs.

# Putting it all together

If you have cloned the [ntlc repository](https://github.com/abjrcode/ntlc) and followed the instructions mentioned in the readme to install all the required dependencies, then running the compiler via `cargo run` would:

1. Compile the example file `/example/good.ntlc`
2. It would print the output of the lexer, parser and type checker and code generator to the console
3. Generate a binary called `good` in the `/bin` directory.

Try executing that binary on your operating system by running `./bin/good` in your favorite shell. If everything went well you should not see any output. That's because our NTLC programs do not have the capability to print to the console.

But in Bash, Zsh, PowerShell and other shells, one can check the exit code of the last executed command/program by running `echo $?`

Go ahead and do so and you will see the return value of the NTLC program. Try changing the NTLC program in `/example/good.ntlc` and see how the return value changes.

Congratulations! You have just written your first compiler!

# Closing Thoughts

That's it. You have made it to the end of the journey. I hope you enjoyed it as much as I did and you actually learned something useful from it.

Where to go from here?
If you want to learn more, then I would refer you to some of the resources I mentioned in the [introduction](@/ntlc/intro.md#why-another-programming-language) article.

If you feel like you have a good grasp of most concepts and would like to challenge yourself a bit more, here are some ideas:

- Add support for more types such as floating point numbers, strings, characters etc...
- Add support for user defined functions
- Add support for user defined types

The possibilities are endless really. Have fun and happy hacking!

<ol id="footnotes">
  <li id="compiled_vs_interpreted">Some interpreted languages perform some compilation to speed things up at execution time, and some even support both interpretation and compilation which makes it hard to draw a distinction</li>
  <li id="visitor_pattern"><a target="_blank" href="https://en.wikipedia.org/wiki/Visitor_pattern">Visitor pattern</a> is a common OOP pattern that is used to implement both interpretation and transformation of AST</li>
  <li id="cranelift"><a href="https://cranelift.dev/">Cranelift</a> seems to be another option. It is written in Rust, but it was/is still new and not as well documented as LLVM at the time I looked into it</li>
  <li id="lsp_similarity">This is the same as the idea behind <a href="/ntlc/lsp/#intro">LSPs</a> whereby a single Language Server can be used by multiple "frontend" client editors</li>
</ol>

# Code

```rust
use inkwell::builder::Builder;
use inkwell::context::Context;
use inkwell::module::{Linkage, Module};

use crate::parser::Term;

/**
 * `MainFunc` represents how our NTLC program
 * looks like after it's compiled to LLVM IR.
 *
 * It is a function that takes no arguments
 * and returns an integer.
 *
 * You might think, hey where the the boolean
 * return value?
 *
 * Well, on the OS level there is no such thing
 * Everything is represented as numbers.
 *
 * So we will map boolean values like true and false to 0 and 1 respectively.
 *
 * That does make it hard to distinguish between booleans and integers
 * such as when the program returns an integer 1 but since
 * our language is simple we don't need to worry about that.
 *
 * I mean after all this is just a shortcut not to link with libc
 * or provide a way to print to the console.
 */
pub type MainFunc = unsafe extern "C" fn() -> i32;

#[derive(Debug)]
pub enum CodegenError {
    LlvmNative(String),
}

/**
 * This module contains the internals of the code generator.
 *
 * I chose to wrap things in an isolated module because the code generator
 * needs to keep track of some state as part of translation process.
 *
 * This way consumers of the "codegen" module don't need to worry about
 */
mod internals {
    use inkwell::values::IntValue;

    use crate::parser::Term;

    use super::*;

    /**
     * `context`, `module` and `builder` are the state that the code generator
     * needs to keep track of.
     *
     * These are constructs provided by the LLVM library.
     */
    pub struct CodeGenerator<'ctx> {
        pub context: &'ctx Context,
        pub module: Module<'ctx>,
        pub builder: Builder<'ctx>,
    }

    /**
     * Here we are implementing the actual
     * functionality of the code generator
     *
     * These functions appear in an impl block
     * which makes them methods of the CodeGenerator struct
     * defined above.
     */
    impl<'ctx> CodeGenerator<'ctx> {
        /**
         * This function adds the builtin `izzero` function to the module.
         */
        fn add_builtin_izzero(&self) -> Result<(), CodegenError> {
            // This is a representation of the integer type in LLVM IR
            let i32_type = self.context.i32_type();

            // This is a representation of the boolean type in LLVM IR
            let bool_type = self.context.bool_type();

            // This is the type of the `izzero` function
            // It takes an integer and returns a boolean
            let iz_zero_fn_type = bool_type.fn_type(&[i32_type.into()], false);

            // Now we add the function declaration to the module
            // We give it the name "izzero"
            let iz_zero_fn =
                self.module
                    .add_function("izzero", iz_zero_fn_type, Some(Linkage::Internal));

            // Now we add a basic block to the function
            // A basic block is a sequence of instructions
            // that execute sequentially
            // This is where we implement our function's body
            let basic_block = self.context.append_basic_block(iz_zero_fn, "entry");

            self.builder.position_at_end(basic_block);

            // Now we get the value of the first parameter of the function
            // which is the integer we want to check if it's zero
            let x = iz_zero_fn
                .get_nth_param(0)
                .ok_or(CodegenError::LlvmNative(
                    "Failed to get nth param".to_string(),
                ))?
                .into_int_value();

            // Now we create a constant integer with the value 0
            let zero = i32_type.const_int(0, false);

            // Now we compare the value of the parameter with the constant zero
            let iz_zero =
                self.builder
                    .build_int_compare(inkwell::IntPredicate::EQ, x, zero, "iz_zero_cmp");

            // Now we return the result of the comparison
            self.builder.build_return(Some(&iz_zero));

            Ok(())
        }

        /**
         * This function adds the builtin `pred` function to the module.
         *
         * It follows a similar construction to the `izzero` function.
         */
        fn add_builtin_pred(&self) -> Result<(), CodegenError> {
            let i32_type = self.context.i32_type();

            let pred_fn_type = i32_type.fn_type(&[i32_type.into()], false);

            let pred_fn = self
                .module
                .add_function("pred", pred_fn_type, Some(Linkage::Internal));

            let basic_block = self.context.append_basic_block(pred_fn, "entry");

            self.builder.position_at_end(basic_block);

            let x = pred_fn
                .get_nth_param(0)
                .ok_or(CodegenError::LlvmNative(
                    "Failed to get nth param".to_string(),
                ))?
                .into_int_value();

            let constant_one = i32_type.const_int(1, false);

            let pred_value = self.builder.build_int_sub(x, constant_one, "minus_one");

            self.builder.build_return(Some(&pred_value));

            Ok(())
        }

        /**
         * This function adds the builtin `succ` function to the module.
         *
         * It follows a similar construction to the `izzero` function.
         */
        fn add_builtin_succ(&self) -> Result<(), CodegenError> {
            let i32_type = self.context.i32_type();

            let succ_fn_type = i32_type.fn_type(&[i32_type.into()], false);

            let succ_fn = self
                .module
                .add_function("succ", succ_fn_type, Some(Linkage::Internal));

            let basic_block = self.context.append_basic_block(succ_fn, "entry");

            self.builder.position_at_end(basic_block);

            let x = succ_fn
                .get_nth_param(0)
                .ok_or(CodegenError::LlvmNative(
                    "Failed to get nth param".to_string(),
                ))?
                .into_int_value();

            let constant_one = i32_type.const_int(1, false);

            let succ_value = self.builder.build_int_add(x, constant_one, "plus_one");

            self.builder.build_return(Some(&succ_value));

            Ok(())
        }

        /**
         * new is similar to constructors in Object Oriented Languages
         * It initializes a new LLVM module and injects our builtin
         * functions and constants into it.
         *
         * LLVM modules are the smallest unit of compilation.
         * You can think of them as a single source file in C or Rust.
         */
        pub fn new(ctx: &'ctx Context, module_name: &str) -> Result<Self, CodegenError> {
            let module = ctx.create_module(module_name);

            let code_generator = CodeGenerator {
                context: ctx,
                module,
                builder: ctx.create_builder(),
            };

            code_generator.add_builtin_izzero()?;
            code_generator.add_builtin_pred()?;
            code_generator.add_builtin_succ()?;

            Ok(code_generator)
        }

        /**
         * This is the main function of the code generator.
         * It takes an AST and compiles it to LLVM IR.
         *
         * It does it the same way as we did we the type checker
         * by recursively traversing the AST and compiling each node
         */
        fn compile_internal(&self, ast: Term) -> IntValue {
            match ast {
                /*
                 * Terminal nodes map to simple constants in LLVM
                 */
                Term::True => {
                    let bool_type = self.context.bool_type();
                    bool_type.const_int(1, false)
                }
                Term::False => {
                    let bool_type = self.context.bool_type();
                    bool_type.const_zero()
                }
                Term::Zero => {
                    let int_type = self.context.i32_type();
                    int_type.const_zero()
                }
                /*
                 * Here we are not building the `succ` function
                 * Remember, we already added it as a builtin function
                 *
                 * This is how we call a function in LLVM IR
                 */
                Term::Successor(inner_term) => {
                    // First we get the function from the module
                    let succ_fn = self
                        .module
                        .get_function("succ")
                        .ok_or(CodegenError::LlvmNative(
                            "Failed to get succ function".to_string(),
                        ))
                        .unwrap();

                    // Then we compile the inner term
                    // which could be any valid NTLC term
                    let succ_value = self.compile_internal(*inner_term);

                    // Then we call the function with the value of the inner term
                    let succ_call =
                        self.builder
                            .build_call(succ_fn, &[succ_value.into()], "succ_call");

                    // Then we get the return value of the function call
                    let succ_call_value = succ_call.try_as_basic_value().left().unwrap();

                    // Then we return the value
                    succ_call_value.into_int_value()
                }
                // Same as above
                Term::Predecessor(inner_term) => {
                    let pred_fn = self
                        .module
                        .get_function("pred")
                        .ok_or(CodegenError::LlvmNative(
                            "Failed to get pred function".to_string(),
                        ))
                        .unwrap();

                    let pred_value = self.compile_internal(*inner_term);

                    let pred_call =
                        self.builder
                            .build_call(pred_fn, &[pred_value.into()], "pred_call");

                    let pred_call_value = pred_call.try_as_basic_value().left().unwrap();

                    pred_call_value.into_int_value()
                }
                // Same as above
                Term::IsZero(inner_term) => {
                    let iz_zero_fn = self
                        .module
                        .get_function("izzero")
                        .ok_or(CodegenError::LlvmNative(
                            "Failed to get izzero function".to_string(),
                        ))
                        .unwrap();

                    let iz_zero_value = self.compile_internal(*inner_term);

                    let iz_zero_call = self.builder.build_call(
                        iz_zero_fn,
                        &[iz_zero_value.into()],
                        "iz_zero_call",
                    );

                    let iz_zero_call_value = iz_zero_call.try_as_basic_value().left().unwrap();

                    iz_zero_call_value.into_int_value()
                }
                /*
                 * Conditionals are a bit more involved
                 * If you have seen goto statements before they might seem familiar
                 *
                 * Essentially we are creating a "label" for each possible
                 * branch of the conditional.
                 *
                 * And then we use jump instructions to execute one or the other
                 * depending on the value of the condition.
                 */
                Term::Conditional {
                    condition,
                    consequence,
                    alternative,
                } => {
                    let condition_value = self.compile_internal(*condition);

                    let bool_type = self.context.bool_type();

                    let true_value = bool_type.const_int(1, false);

                    let condition_cmp = self.builder.build_int_compare(
                        inkwell::IntPredicate::EQ,
                        condition_value,
                        true_value,
                        "condition_cmp",
                    );

                    let then_block = self.context.append_basic_block(
                        self.builder
                            .get_insert_block()
                            .unwrap()
                            .get_parent()
                            .unwrap(),
                        "then",
                    );

                    let else_block = self.context.append_basic_block(
                        self.builder
                            .get_insert_block()
                            .unwrap()
                            .get_parent()
                            .unwrap(),
                        "else",
                    );

                    let merge_block = self.context.append_basic_block(
                        self.builder
                            .get_insert_block()
                            .unwrap()
                            .get_parent()
                            .unwrap(),
                        "merge",
                    );

                    self.builder
                        .build_conditional_branch(condition_cmp, then_block, else_block);

                    self.builder.position_at_end(then_block);

                    let consequence_value = self.compile_internal(*consequence);

                    self.builder.build_unconditional_branch(merge_block);

                    let then_block = self.builder.get_insert_block().unwrap();

                    self.builder.position_at_end(else_block);

                    let alternative_value = self.compile_internal(*alternative);

                    self.builder.build_unconditional_branch(merge_block);

                    let else_block = self.builder.get_insert_block().unwrap();

                    self.builder.position_at_end(merge_block);

                    /*
                       phi is a special construction in LLVM
                       that tells us which branch of the conditional
                       was executed to get us to this point
                    */
                    let phi = self.builder.build_phi(self.context.i32_type(), "phi");

                    phi.add_incoming(&[
                        (&consequence_value, then_block),
                        (&alternative_value, else_block),
                    ]);

                    phi.as_basic_value().into_int_value()
                }
                _ => {
                    let int_type = self.context.i32_type();
                    int_type.const_int(0, false)
                }
            }
        }

        /*
         * This is the public interface of the code generator.
         * It takes an AST and compiles it to LLVM IR.
         *
         * We basically we just create a main function
         * and we put compile our NTLC program to be the body
         * of that function
         *
         * The result of evaluating the NTLC program is the return value
         * of the main function
         */
        pub fn compile(&self, ast: Term) -> Result<(), CodegenError> {
            let i32_type = self.context.i32_type();
            let main_fn_type = i32_type.fn_type(&[], false);

            let main_fn = self
                .module
                .add_function("main", main_fn_type, Some(Linkage::External));

            let basic_block = self.context.append_basic_block(main_fn, "entry");

            self.builder.position_at_end(basic_block);

            let return_value = self.compile_internal(ast);

            self.builder.build_return(Some(&return_value));

            Ok(())
        }
    }
}

/**
 * This is the only function exported from the code generator
 * Check `main.rs` to see how it's used.
 *
 * As you can see, it delegates all of its work to the code generator module
 * defined above.
 */
pub fn generate(context: &Context, ast: Term) -> Result<Module<'_>, CodegenError> {
    let codegen = internals::CodeGenerator::new(context, "main")?;

    codegen.compile(ast)?;

    Ok(codegen.module)
}

#[cfg(test)]
mod code_generator_tests {
    use inkwell::{execution_engine::JitFunction, OptimizationLevel};

    use crate::{lexer::scan, parser::parse};

    use super::*;

    #[test]
    fn test_codegen_true() {
        let input = "true";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_true").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 1);
        }
    }

    #[test]
    fn test_codegen_false() {
        let input = "false";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_false").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 0);
        }
    }

    #[test]
    fn test_codegen_zero() {
        let input = "0";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_zero").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 0);
        }
    }

    #[test]
    fn test_codegen_succ() {
        let input = "succ 0";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_succ").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 1);
        }
    }

    #[test]
    fn test_codegen_pred() {
        let input = "pred 0";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_pred").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), -1);
        }
    }

    #[test]
    fn test_codegen_izzero() {
        let input = "iszero 0";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_izzero").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 1);
        }
    }

    #[test]
    fn test_codegen_if_then_branch() {
        let input = "if true then true else false";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_if").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 1);
        }
    }

    #[test]
    fn test_codegen_if_else_branch() {
        let input = "if false then true else false";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_if").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 0);
        }
    }

    #[test]
    fn test_codegen_nested_successors() {
        let input = "succ(succ(0))";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_nested_succ").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 2);
        }
    }

    #[test]
    fn test_codegen_nested_predecessors() {
        let input = "pred(pred(0))";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_nested_pred").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();
        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), -2);
        }
    }

    #[test]
    fn test_nested_if() {
        let input = "if true then if false then false else true else false";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_codegen_nested_if").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();
        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 1);
        }
    }

    #[test]
    fn test_complex_nesting() {
        let input = "if iszero(pred(succ(0))) then succ(succ(0)) else pred(pred(0))";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen =
            internals::CodeGenerator::new(&context, "test_codegen_complex_nesting").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();
        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), 2);
        }
    }

    #[test]
    fn test_most_complex_example() {
        let input = "if iszero(pred(succ(0))) then if iszero(pred(0)) then succ(succ(0)) else pred(pred(pred(0))) else succ(pred(pred(0)))";

        let tokens = scan(input).unwrap();

        let ast = parse(tokens).unwrap();

        let context = Context::create();

        let codegen =
            internals::CodeGenerator::new(&context, "test_codegen_complex_nesting").unwrap();

        codegen.compile(ast).unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();
        let main =
            unsafe { execution_engine.get_function("main").unwrap() as JitFunction<MainFunc> };

        unsafe {
            assert_eq!(main.call(), -3);
        }
    }
}

#[cfg(test)]
mod code_generator_builtins_tests {
    use inkwell::{execution_engine::JitFunction, OptimizationLevel};

    use super::*;

    type IzZeroFunc = unsafe extern "C" fn(i32) -> bool;
    type SuccFunc = unsafe extern "C" fn(i32) -> i32;
    type PredFunc = unsafe extern "C" fn(i32) -> i32;

    #[test]
    fn test_builtin_izzero() {
        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_builtin_izzero").unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let iszero =
            unsafe { execution_engine.get_function("izzero").unwrap() as JitFunction<IzZeroFunc> };

        unsafe {
            assert!(!(iszero.call(1)));
            assert!(iszero.call(0))
        }
    }

    #[test]
    fn test_builtin_succ() {
        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_builtin_succ").unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let succ =
            unsafe { execution_engine.get_function("succ").unwrap() as JitFunction<SuccFunc> };

        unsafe {
            assert_eq!(succ.call(0), 1);
        }
    }

    #[test]
    fn test_builtin_pred() {
        let context = Context::create();

        let codegen = internals::CodeGenerator::new(&context, "test_builtin_pred").unwrap();

        let execution_engine = codegen
            .module
            .create_jit_execution_engine(OptimizationLevel::None)
            .unwrap();

        let pred =
            unsafe { execution_engine.get_function("pred").unwrap() as JitFunction<PredFunc> };

        unsafe {
            assert_eq!(pred.call(0), -1);
        }
    }
}
```
