# NGINX

Hosts on this edge:

| Host | What |
| --- | --- |
| `api.parton.app` | Nest `/api/` and `/health/`. SSE `/api/v1/realtime/` is unbuffered. |
| `xadmin.parton.app` | Admin SPA (`/admin/`, files in `/var/www/parton/admin`) plus same-origin `/api/`. |
| `devops.parton.app` | Same SPA, opening `/admin/devops`, plus same-origin `/api/`. |

`parton.app` marketing stays its own site. DevOps MCP is stdio and calls the API; it is not an HTTP vhost.

1. Copy `snippets/*.conf` to `/etc/nginx/snippets/`.
2. Copy `parton.conf.template` to `/etc/nginx/sites-available/parton-apps` and enable it.
3. Publish the admin build: `rsync -a --delete apps/admin/dist/ /var/www/parton/admin/`.
4. Issue the cert once: `certbot certonly --webroot -w /var/www/certbot -d api.parton.app -d xadmin.parton.app -d devops.parton.app`.
5. `nginx -t && systemctl reload nginx`.
