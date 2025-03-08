> [!CAUTION]
>
> **Note for future Jits:** you put this particular part of the tech stack on ice in Feb 2025 ([ref](https://www.notion.so/jits/v2-On-Ice-Maintenance-1ab2a607a9ea807b92c3ff391ca91ac4?pvs=4)). You _did_ complete the migration to Angular v19 etc. ([ref](https://www.notion.so/jits/Angular-v19-etc-upgrades-1272a607a9ea80d48ca1e57c291a4836?pvs=4)) but didn't update the docs (because, why bother?). Just bear this mind if you ever resurrect this repo.

# The [FullStacksDev](https://fullstacks.dev) Angular and Firebase simple example app

Part of the curated [**FullStacksDev Angular and Firebase tech stack**](https://fullstacks.dev/#angular-and-firebase). For solo devs and very small teams.

This is a fairly simple **Logbook app** — to keep a single time-ordered log of text entries — focused on showcasing and learning the tech stack, built from the [base template](https://github.com/FullStacksDev/angular-and-firebase-template).

You can read more about the [purpose and specs of the example apps](https://fullstacks.dev/example-apps-and-patterns) on our website.

> [!IMPORTANT]
>
> This is currently in **beta**. We're actively working on it and will be making regular updates — expect big changes and improvements until it gets to a stable release. Feel free to give your feedback and suggestions via the Issues tab.

## Running the app locally

We highly recommend cloning the source code and running the app locally to get a feel for how it works.

Follow instructions from the base template:

- [Prerequisites](https://github.com/FullStacksDev/angular-and-firebase-template/blob/main/README.md#prerequisites)
- [Local development, testing and deploy commands](https://github.com/FullStacksDev/angular-and-firebase-template/blob/main/README.md#local-development-testing-and-deploy-commands)

## Learning content

All the learning content is within the [`/docs`](./docs) folder. They exist right next to the code and are updated and versioned together. These cover the architecture, design decisions, data models, patterns, features, tech stack capabilities and learnings for this simple example app.

### Recommended approach

Use the index below and GitHub's UI to navigate and read the docs, with useful tools like the tree view sidebar, table of contents sidebar and repository search.

The docs are designed to be **skimmable** and **a reference** to come back to. We recommend going through each, in order, but not necessarily trying to learn everything at once, as you can always come back and dig deeper (especially after getting into the actual code, and building your skills and understanding up).

After a look at the overall architecture, we cover things from a _horizontal_ perspective, i.e. the layers of implementation that make up the whole app.

### Index

1. [Architecture](./docs/1.architecture.md)
1. [Routes and shell](./docs/2.routes-and-shell.md)
1. [Data model and access](./docs/3.data-model-and-access.md)
1. [Logbook stores](./docs/4.logbook-stores.md)
1. [Logbook UI and flows](./docs/5.logbook-ui-and-flows.md)
1. [Testing](./docs/6.testing.md)
1. [Deployment and monitoring](./docs/7.deployment-and-monitoring.md)

### Key

To make the information skimmable and easier to understand, you'll see the following standout blocks throughout:

| **:brain: Design decision** |
| :-- |
| A decision that was made and why. Can cover any aspect: technical, architectural, design, UX, etc. |

| **:white_check_mark: Pattern** |
| :-- |
| A recommended way of doing something. This term is used loosely and non-formally, just as a way of saying “this is a thing we recommend you do in a particular context”. |

> [!IMPORTANT]
>
> A key point to remember.

> [!NOTE]
>
> Extra info to clarify a point or provide context.

> [!TIP]
>
> A tip or trick worth knowing about.

> [!WARNING]
>
> Gotchas and things to be careful about.

> [!CAUTION]
>
> More severe gotchas and things to watch out for.

## A note about the patterns example app

Throughout the docs we reference the patterns example app (coming soon). This is a dedicated place for showcasing even more in-depth capabilities and patterns to bring out the best in this tech stack. It's a perfect next step to take after you've understood and learnt from this simple example app.
