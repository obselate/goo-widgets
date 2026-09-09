# Releasing Goo Widgets

NuGet publication uses `.github/workflows/ci.yml` and the GitHub environment `release`.

## Trusted Publishing setup

On NuGet.org, create a trusted publishing policy for the `obselate` owner:

- Repository owner: `obselate`
- Repository: `goo-widgets`
- Workflow file: `ci.yml`
- Environment: `release`
- Package scope: `Goo.Widgets`
- Allow new package creation for the first release.

Set the GitHub repository variable `NUGET_USER` to `obselate`.

## Release

1. Publish any new Goo dependency version first.
2. Update the version in `src/Goo.Widgets/Goo.Widgets.gsproj`, dependency pins and lock files, installation documentation, and dated `CHANGELOG.md` entry.
3. Run `bash scripts/verify.sh`.
4. Commit and push to `main`. Require a green CI run for that commit.
5. Create an annotated matching tag, for example `git tag -a v0.1.0 -m "Goo Widgets 0.1.0"`, and push the tag.
6. The tag run verifies and packs the library, publishes it and its symbols through NuGet Trusted Publishing, and creates a GitHub release with both packages and their checksums.
7. Confirm the version is available from NuGet.org and install it in a clean package consumer.

Do not move a published tag or reuse a published package version. A failed release job can be rerun for the same tag.
