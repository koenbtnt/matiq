Pure, deterministic business logic: no I/O, React, drizzle-orm or expo-sqlite.
Clock and id generation are injected; never call `Date.now()` or `randomUUID()` here.
`progression/` is reserved for the progression algorithm (shape decided in sprint 0).
