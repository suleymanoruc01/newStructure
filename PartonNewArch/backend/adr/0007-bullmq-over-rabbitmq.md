# ADR-0007: BullMQ (Redis) over RabbitMQ for background jobs

**Date:** 2026-10-09  
**Status:** accepted *(product choice for Stage B — not a day-1 dependency)*  
**Detail:** [`../14-bullmq-vs-rabbitmq.md`](../14-bullmq-vs-rabbitmq.md)  
**Radar ring:** Trial until evidence; then promote toward Adopt — see [`../../03-tech-radar-2026.md`](../../03-tech-radar-2026.md)

## Context

PartOn’s Nest modular monolith must eventually run reliable background work: push/SMS retries, matching recompute, delayed 3h/rating reminders, and abuse jobs. Day-1 architecture forbids a separate worker process and prefers a Postgres transactional outbox. When an external queue is justified, the team must choose between a Redis job library (BullMQ) and an AMQP broker (RabbitMQ).

Constraints:

- Single NestJS deployable (API + admin); TypeScript/Node workers only  
- Job-style workloads with **delayed / scheduled** semantics  
- Long-term scale ambition, but capacity proven by load tests — not by adopting a bus early  
- Prefer infra we will likely need anyway (Redis for cache/rate-limit)

## Decision

1. **Do not** introduce BullMQ or RabbitMQ until outbox/in-process drain hits evidence gates (see detail doc).  
2. When a broker is introduced, use **BullMQ on Redis** with Nest’s **`@nestjs/bullmq`**.  
3. Keep the **outbox → relay → queue** path so domain writes stay transactional in PostgreSQL.  
4. Treat **RabbitMQ as rejected for the modular-monolith phase** (Hold on the tech radar). Reopen only via a new ADR if polyglot consumers or AMQP routing become requirements.  
5. Kafka/NATS remain Hold for v1–v2.

## Alternatives

### RabbitMQ (AMQP)
- **Pros:** Mature broker; durable queues; excellent fan-out/topic routing; language-agnostic  
- **Cons:** Extra Erlang/broker ops; delayed/cron jobs are not first-class; weak fit for a single Nest job worker fleet  
- **Why not:** PartOn needs job processing inside one Node codebase, not a multi-service message platform

### Stay on Postgres outbox forever
- **Pros:** Zero new infra  
- **Cons:** Drain competes with HTTP CPU; harder to scale workers independently  
- **Why not as final state:** Acceptable for P0–P3; Stage B promotes to BullMQ when metrics demand

### Kafka / NATS
- **Pros:** High-throughput event streaming  
- **Cons:** Platform complexity; wrong default for “send this push with retries”  
- **Why not:** Hold until true event-log / multi-service streaming needs appear

### Legacy Bull (`@nestjs/bull`)
- **Pros:** Battle-tested  
- **Cons:** Maintenance mode; Nest docs steer new work to BullMQ  
- **Why not:** Use BullMQ

## Consequences

### Positive
- Clear Nest-native path (`@nestjs/bullmq`) when AO-3 triggers  
- Delayed jobs map cleanly to PartOn shift/rating schedules  
- Redis doubles as future cache/rate-limit substrate  
- Avoids premature AMQP topology inside a modular monolith  

### Negative / risks
- Job durability depends on Redis persistence configuration — document AOF/retention in ops runbooks  
- Must not dual-write DB + Redis without outbox relay  
- BullMQ is not a general pub/sub bus — do not force domain “events for every service” through it  

### Follow-up
- Update [`08-async-events.md`](../08-async-events.md) Stage B checklist when first queue lands  
- Add Bull Board (or admin failed-job view) before production traffic on queues  
