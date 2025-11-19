// state/mod.rs
// This file tells Rust about the modules in the "state" directory.
// Think of it like an index.ts file that exports everything.

pub mod settings;

// RUST CONCEPT: "pub mod" makes the module public
// This allows other parts of your app to import from state::settings