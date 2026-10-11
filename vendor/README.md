# Vendored third-party

## ponytail

- **Source:** https://github.com/DietrichGebert/ponytail
- **License:** MIT (`vendor/ponytail/LICENSE`)
- **Vendored from commit:** `9b58c1ffb790c075ca32e70a89cf1d80588f4abf` (2026-10-11)

PartOn integration: `PartonNewArch/agents/11-ponytail-integration.md`.

To refresh:

```bash
git clone --depth 1 https://github.com/DietrichGebert/ponytail /tmp/ponytail-upstream
rsync -a --delete --exclude='.git' /tmp/ponytail-upstream/ vendor/ponytail/
cp -r vendor/ponytail/skills/* .cursor/skills/
cp vendor/ponytail/.cursor/rules/ponytail.mdc .cursor/rules/ponytail.mdc
```
