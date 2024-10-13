#!/bin/bash
if [ "$1" = "true" ]; then
    echo 'Running migrations and seeding...'
    pnpm db:migrate:dev
    pnpm db:seed:dev
    pnpm tsx:dev
else
    echo 'Running migrations only...'
    pnpm db:migrate:dev
    pnpm tsx:dev
fi