import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { createRequire } from 'node:module';

import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

const require = createRequire(import.meta.url);
const express = require('express') as typeof import('express');

import { adminDistIndexExists, resolveAdminDist } from './admin-dist-path.js';

export function mountAdminSpa(app: INestApplication): void {
  if (!adminDistIndexExists()) {
    Logger.warn('Admin dist missing — skip /admin SPA', 'AdminSpa');
    return;
  }
  const adminDist = resolveAdminDist();
  const assetsDir = join(adminDist, 'assets');
  const nestApp = app as NestExpressApplication;
  const server = nestApp.getHttpAdapter().getInstance();

  if (existsSync(assetsDir)) {
    server.use(
      '/admin/assets',
      express.static(assetsDir, {
        maxAge: '365d',
        immutable: true,
      }),
    );
  }

  server.use('/admin', express.static(adminDist, { index: false }));

  server.get(/^\/admin(\/.*)?$/, (req, res, next) => {
    if (req.path.startsWith('/admin/assets/')) {
      next();
      return;
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(join(adminDist, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });

  Logger.log(`Admin SPA from ${adminDist}`, 'AdminSpa');
}
