/* eslint-disable no-console */
const target = process.argv[2] || 'http://localhost:3000/api/auth/health';
const durationSec = Number(process.env.DURATION || '10');
const concurrency = Number(process.env.CONCURRENCY || '10');

if (!global.fetch) {
  console.error('This script requires Node 18+ (global fetch).');
  process.exit(1);
}

let inFlight = 0;
let sent = 0;
let ok = 0;
let failed = 0;

async function worker(stopAt) {
  while (Date.now() < stopAt) {
    inFlight += 1;
    sent += 1;
    try {
      const res = await fetch(target);
      if (res.ok) {
        ok += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    } finally {
      inFlight -= 1;
    }
  }
}

async function run() {
  const stopAt = Date.now() + durationSec * 1000;
  const workers = Array.from({ length: concurrency }, () => worker(stopAt));
  await Promise.all(workers);

  console.log('Load test finished');
  console.log(`Target: ${target}`);
  console.log(`Duration(s): ${durationSec}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Sent: ${sent}`);
  console.log(`OK: ${ok}`);
  console.log(`Failed: ${failed}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
