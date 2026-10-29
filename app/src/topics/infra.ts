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
