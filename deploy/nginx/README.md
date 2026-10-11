# NGINX templates

See [PartonNewArch/web/06-nginx.md](../../PartonNewArch/web/06-nginx.md).

1. Copy `parton.conf.template` to your host config.
2. Point marketing `root` at `apps/marketing/dist` after `bun run --filter '@parton/marketing' build`.
3. `nginx -t && systemctl reload nginx`
