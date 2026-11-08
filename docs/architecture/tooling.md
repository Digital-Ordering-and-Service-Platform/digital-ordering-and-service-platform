# Backend tooling

## Atlas

Use the stable Atlas CLI release **v1.3.0** for schema and migration work. The
development machine currently reports `v1.3.9-80409d0-canary`; do not rely on
that canary build for project workflows. The official v1.3.0 release page marks
this release as latest and provides the project’s tagged release source.

For a local Linux AMD64 development machine, install the versioned official
binary (the generic shell installer and Homebrew instructions install the
latest version, not this pin). The Community build is insufficient here because
it does not support Atlas's `ent://` schema source:

```sh
curl -fL https://release.ariga.io/atlas/atlas-linux-amd64-v1.3.0 -o /tmp/atlas-v1.3.0
chmod +x /tmp/atlas-v1.3.0
/tmp/atlas-v1.3.0 version
```

The version command must report `v1.3.0` and must not say `community`. Put the
binary in a project tools directory or PATH only after verifying the version.
For GitHub Actions, use Ariga's installer action with an explicit version:

```yaml
- uses: ariga/setup-atlas@v0
  with:
    version: v1.3.0
```

Sources: [Atlas v1.3.0 release](https://github.com/ariga/atlas/releases/tag/v1.3.0),
[official setup-atlas action](https://github.com/ariga/setup-atlas), and
[Atlas installation documentation](https://atlasgo.io/getting-started#step-1-install-atlas).
