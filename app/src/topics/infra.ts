import type { Topic } from '../types'
import { alt, best, n, step, topic } from './dsl'

export const metrics: Topic = topic('metrics', 'Metrics monitoring and alerting',
  'Collect numbers from thousands of servers, store them cheaply, graph them, and wake someone when something is wrong.',
  [
    step('collect', 'Getting the numbers in',
      'Thousands of servers produce CPU, memory and request counts. How does the data reach your monitoring system?',
      [
        best('pull', 'A collector gathers metrics from sources, using service discovery to know what to scrape', 'Right. Whether collectors pull or sources push, a central path is needed. Pull with service discovery (as Prometheus does) knows exactly which targets exist and when one disappears. Push suits short-lived jobs.',
          { add: [n('src', 'Metric sources', 'server', 0, 2, 'App servers, databases and queues that expose metrics.'), n('col', 'Collectors', 'monitor', 2, 2, 'Fetch or receive metrics from sources and forward them.'), n('tsdb', 'Time-series DB', 'chart', 4, 2, 'Database optimised for values over time, with fast writes and range queries.')], edges: ['col>>src:scrape', 'col>tsdb'], d: { capacity: 15, complexity: 10 } }),
        alt('log', 'Write metrics into log files and grep them', 'wrong', 'Does not give fast queries, aggregation or alerting at scale.'),
        alt('sql', 'Store samples in a relational database', 'wrong', 'Write volume and time-range queries overwhelm it.'),
      ],
      ['A metric has a name, labels (tags) and a time series of (timestamp, value) pairs.', 'The data is write-heavy and read-spiky.'],
      'Expose a /metrics endpoint with a request counter and latency histogram, and configure a scraper to collect it every 15 seconds.'),
    step('queue', 'Do not lose data when the database blinks',
      'The time-series database is briefly overloaded during a spike and incoming samples are dropped. What protects you?',
      [
        best('kafka', 'Put a message queue (Kafka) between collectors and storage', 'Right. A durable buffer absorbs spikes and database outages, and also lets stream processors aggregate data before it is stored.',
          { add: [n('k', 'Kafka', 'queue', 3, 3.6, 'Durable buffer between collectors and storage; consumers read at their own pace.')], edges: ['col>k', 'k>tsdb'], d: { availability: 20, capacity: 15, complexity: 15 } }),
        alt('retry', 'Make collectors retry a few times', 'ok', 'Fine for blips, but sustained overload still loses data.'),
        alt('bigger', 'Over-provision the database for the peak', 'ok', 'Works but is costly, and the next spike is bigger.'),
      ],
      ['Aggregate in the collection agent (simple), in the ingestion pipeline (stream processing, less raw data), or at query time (flexible but slower).'],
      'Add Kafka between collectors and the TSDB, with a consumer that writes batches and a retention policy.'),
    step('store', 'Querying, graphing and downsampling',
      'Dashboards ask for “last 24 hours, 1-minute average”. Old data is rarely read at full detail. How do you keep storage and queries manageable?',
      [
        best('down', 'Keep recent data at full resolution and downsample old data; cache common queries', 'Right. Fresh data is queried in detail; month-old data only needs coarse averages. Downsampling and caching keep storage and latency down.',
          { add: [n('q', 'Query service', 'search', 4, 0.5, 'Answers dashboard and alert queries, with caching in front.'), n('v', 'Dashboards', 'chart', 5.7, 0.5, 'Graphs and charts for people.')], edges: ['q>tsdb', 'v>q'], d: { speed: 20, capacity: 10, complexity: 10 } }),
        alt('all', 'Keep every sample at full resolution forever', 'wrong', 'Storage grows without limit and queries slow down.'),
        alt('drop', 'Delete data older than a day', 'ok', 'Cheap, but you lose all trend and capacity-planning history.'),
      ],
      ['Use a purpose-built time-series database (such as InfluxDB or Prometheus). Compress with delta encoding, since consecutive values are similar.'],
      'Design retention tiers: 1-second data for 7 days, 1-minute for 30 days, 1-hour for a year, and the downsampling job.'),
    step('alert', 'Waking someone up, sensibly',
      'A rule fires: CPU > 90% for five minutes. Who is notified, and how do you avoid pager storms?',
      [
        best('alert', 'An alert manager evaluates rules, deduplicates and groups alerts, and routes to email, pager or chat', 'Right. Rules run on a schedule against the query service; the manager groups related alerts, suppresses duplicates, and sends them to the right channel.',
          { add: [n('am', 'Alert manager', 'bell', 5.2, 3.6, 'Evaluates rules, deduplicates and groups alerts, and routes them to destinations.'), n('pg', 'Pager, email, chat', 'send', 5.7, 4.8, 'Where notifications go: whoever is on call.')], edges: ['am>q:rules', 'am>pg'], d: { availability: 20, complexity: 10 } }),
        alt('every', 'Page on every single threshold breach', 'wrong', 'Alert fatigue: people start ignoring pages.'),
        alt('dash', 'Watch the dashboard instead', 'wrong', 'Nobody watches a dashboard at 3am.'),
      ],
      ['Alert on symptoms users feel, not every cause. Reliability matters most here: this system cannot go quiet when things break.'],
      'Write an alert rule for p99 latency > 500ms for 5 minutes, with grouping and a routing rule for the on-call channel.'),
  ],
  ['Collect with discovery; buffer with a queue.', 'Use a time-series database and downsample.', 'Alert on what matters and group the noise.'])

export const adClicks: Topic = topic('ad-clicks', 'Ad click event aggregation',
  'Count billions of ad clicks per day exactly, in near real time, because money depends on the answer.',
  [
    step('ingest', 'A flood of click events',
      'Hundreds of thousands of clicks arrive per second. You need aggregated counts per ad per minute. What is the first thing between the log files and the database?',
      [
        best('queue', 'A message queue, so ingestion and aggregation scale separately', 'Right. The queue buffers bursts, lets you replay events after a failure, and decouples producers from the aggregator.',
          { add: [n('ls', 'Log watcher', 'log', 0, 2, 'Reads click events from application servers.'), n('mq', 'Message queue', 'queue', 1.9, 2, 'Durable stream of raw click events.'), n('ag', 'Aggregation service', 'chart', 3.8, 2, 'Counts clicks per ad per time window.'), n('db', 'Aggregated DB', 'db', 5.6, 2, 'Stores per-minute counts for queries.')], edges: ['ls>mq', 'mq>ag', 'ag>db'], d: { capacity: 20, availability: 10, complexity: 10 } }),
        alt('dbw', 'Write every raw click directly into the database', 'wrong', 'The write rate overwhelms a database and no aggregation happens.'),
        alt('mem', 'Aggregate only in memory on the app servers', 'wrong', 'A crash loses counts, and the numbers are never combined across servers.'),
      ],
      ['Raw data is kept in a cold store (such as object storage) for reprocessing and audits; aggregated data answers queries.'],
      'Define a click event schema (ad_id, click_timestamp, user_id, ip, country) and write a producer that publishes events to Kafka.'),
