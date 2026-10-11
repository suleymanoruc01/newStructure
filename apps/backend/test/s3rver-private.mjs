import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const S3rver = require('s3rver');

const port = Number(process.argv[2]);
const directory = process.argv[3];

const server = new S3rver({
  address: '127.0.0.1',
  port,
  directory,
  silent: true,
});

server.middleware.unshift(async (ctx, next) => {
  const query = ctx.query ?? {};
  const signed =
    Boolean(ctx.get('authorization')) ||
    typeof query['X-Amz-Algorithm'] === 'string' ||
    typeof query.Signature === 'string';
  if (!signed) {
    ctx.status = 403;
    ctx.type = 'application/xml';
    ctx.body =
      '<?xml version="1.0" encoding="UTF-8"?><Error><Code>AccessDenied</Code><Message>Anonymous access is denied.</Message></Error>';
    return;
  }
  return next();
});

await server.run();
process.stdout.write('ready\n');
