# CCDAK Exam_2

> **Tổng số trang:** 139 trang | **Thư mục ảnh/sơ đồ:** `assets/CCDAK_Exam_2/`

---

## Trang 1: CCDAK Exam

### CCDAK Exam
Collected by Ronin Engineer
### Question 1: Where are the ACLs stored in a Kafka cluster by default?
A. Inside the broker's data directory

B. Under Zookeeper node /kafka-acls/

C. In Kafka topic kafka_acls

D. Inside the Zookeeper's data directory

Answer: B

Explanation: In zookeeper mode, ACLs are stored in Zookeeper node /kafka-acls/ by default.
### Question 2: is KSQL ANSI SQL compliant?
A. Yes

B. No

Answer: B

Explanation: KSQL is not ANSI SQL compliant, for now there are no defined standards on streaming SQL languages
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 2: Question 4: Which KSQL queries write to Kafka?

### Question 4: Which KSQL queries write to Kafka?
A. COUNT and JOIN

B. SHOW STREAMS and EXPLAIN &lt;query> statements

C. CREATE STREAM WITH &lt;topic> and CREATE TABLE WITH &lt;topic>

D. CREATE STREAM AS SELECT and CREATE TABLE AS SELECT

Answer: C, D

Explanation: Explanation: SHOW STREAMS and EXPLAIN &lt;query> statements run against the KSQL server that the KSQL client is connected to. They don't communicate directly with Kafka. CREATE STREAM WITH &lt;topic> and CREATE TABLE WITH &lt;topic> write metadata to the KSQL command topic. Persistent queries based on CREATE STREAM AS SELECT and CREATE TABLE AS SELECT read and write to Kafka topics. Non-persistent queries based on SELECT that are stateless only read from Kafka topics. Non-persistent queries that are stateful read and write to Kafka, for example, COUNT and JOIN. The data in Kafka is deleted automatically when you terminate the query with CTRL-C.
### Question 5: There are two consumers C1 and C2 belonging to the same group G subscribed to topics T1 and T2. Each of the topics has 3 partitions. How will the partitions be assigned to consumers with Partition Assigner being Round Robin Assigner?
A. C1 will be assigned partitions 0 and 2 from T1 and partition 1 from T2. C2 will have partition 1 from T1 and partitions 0 and 2 from T2.

B. Two consumers cannot read from two topics at the same time

C. C1 will be assigned partitions 0 and 1 from T1 and T2, C2 will be assigned partition 2 from T1 and T2.

D. All consumers will read from all partitions

Answer: A

Explanation: The correct option is the only one where the two consumers share an equal number of partitions amongst the two topics of three partitions. An interesting article to read is https://medium.com/@anyili0928/what-i-have-learned-from-kafka-partition-assignment-strategy-

799fdf15d3ab

---

## Trang 3: Question 6: A client connects to a broker in the cluster and sends a fetch request for a partition i…

### Question 6: A client connects to a broker in the cluster and sends a fetch request for a partition in a topic. It gets an exception Not Leader For Partition Exception in the response. How does the client handle this situation?
A. Get the Broker id from Zookeeper that is hosting the leader replica and send a request to it

B. Send metadata request to the same broker for the topic and select the broker hosting the leader replica

C. Send metadata request to Zookeeper for the topic and select the broker hosting the leader replica

D. Send fetch request to each Broker in the cluster

Answer: B

Explanation: In case the consumer has the wrong leader of a partition, it will issue a metadata request. The Metadata request can be handled by any node, so clients know afterward which broker is the designated leader for the topic partitions. Produce and consume requests can only be sent to the node hosting partition leader.
### Question 7: What is the risk of increasing max.in.flight.requests.per.connection while also enabling retries in a producer?
A. At least once delivery is not guaranteed

B. Message order not preserved

C. Reduce throughput

D. Less resilient

Answer: B

Explanation: Some messages may require multiple retries. If there are more than 1 requests in flight, it may result in messages received out of order. Note an exception to this rule is if you enable the producer setting enabled.idempotence=true which takes care of the out-of-ordering case on its own. See: https://issues.apache.org/jira/browse/KAFKA-5494

---

## Trang 4: Question 8: A Kafka producer application wants to send log messages to a topic that does not include…

### Question 8: A Kafka producer application wants to send log messages to a topic that does not include any key. What are the properties that are mandatory to configure for the producer configuration? (select three)
A. bootstrap.servers

B. partition

C. key.serializer

D. value.serializer

E. key

F. value

Answer: A, C, D

Explanation: Both key and value serializer are mandatory. And bootstrap.servers configuratoin is used to establish an initial connection to a cluster.
### Question 9: To import data from external databases, I should use
A. Confluent REST Proxy

B. Kafka Connect Sink

C. Kafka Streams

D. Kafka Connect Source

Answer: D

Explanation: Kafka Connect Sink is used to export data from Kafka to external databases and Kafka Connect Source is used to import from external databases into Kafka.
### Question 10: You are running a Kafka Streams application in a Docker container managed by Kubernetes, and upon application restart, it takes a long time for the docker container to replicate the state and get back to processing the data. How can you improve dramatically the application restart?
A. Mount a persistent volume for your RocksDB

B. Increase the number of partitions in your inputs topic

C. Reduce the Streams caching property

---

## Trang 5: Question 11: What client protocol is supported for the schema registry? (select two)

D. Increase the number of Streams threads

Answer: A

Explanation: Although any Kafka Streams application is stateless as the state is stored in Kafka, it can take a while and lots of resources to recover the state from Kafka. In order to speed up recovery, it is advised to store the Kafka Streams state on a persistent volume, so that only the missing part of the state needs to be recovered.
### Question 11: What client protocol is supported for the schema registry? (select two)
A. HTTP

B. HTTPS

C. JDBC

D. Websocket

E. SASL

Answer: A, B

Explanation: clients can interact with the schema registry using the HTTP or HTTPS interface
### Question 12: If I produce to a topic that does not exist, and the broker setting auto.create.topic.enable=true, what will happen?
A. Kafka will automatically create the topic with 1 partition and 1 replication factor

B. Kafka will automatically create the topic with the indicated producer settings num.partitions and default.replication.factor

C. Kafka will automatically create the topic with the broker settings num.partitions and default.replication.factor

D. Kafka will automatically create the topic with num.partitions= number of brokers and replication.factor=3

Answer: C

Explanation:

---

## Trang 6: Question 13: You want to perform table lookups against a KTable everytime a new record is received f…

The broker settings comes into play when a topic is auto created
### Question 13: You want to perform table lookups against a KTable everytime a new record is received from the KStream. What is the output of KStream-KTable join?
A. KTable

B. GlobalKTable

C. You choose between KStream or KTable

D. KStream

Answer: D

Explanation: KStream is being processed to create another KStream.
### Question 14: Using the Confluent Schema Registry, where are Avro schema stored?
A. In the Schema Registry embedded SQL database

B. In the Zookeeper node /schemas

C. In the message bytes themselves

D. In the _schemas topic

Answer: D

Explanation: The Schema Registry stores all the schemas in the _schemas Kafka topic
### Question 15: Which of the following setting increases the chance of batching for a Kafka Producer?
A. Increase batch.size

B. Increase message.max.bytes

C. Increase the number of producer threads

D. Increase linger.ms

Answer: D

---

## Trang 7: Question 16: You have a Kafka cluster and all the topics have a replication factor of 3. One intern…

Explanation: linger.ms forces the producer to wait to send messages, hence increasing the chance of creating batches.
### Question 16: You have a Kafka cluster and all the topics have a replication factor of 3. One intern at your company stopped a broker, and accidentally deleted all the data of that broker on the disk. What will happen if the broker is restarted?
A. The broker will start, and other topics will also be deleted as the broker data on the disk got deleted

B. The broker will start, and won't be online until all the data it needs to have is replicated from other leaders

C. The broker will crash

D. The broker will start, and won't have any data. If the broker becomes the leader, we have a data loss

Answer: B

Explanation: Kafka replication mechanism makes it resilient to the scenarios where the broker lose data on disk, but can recover from replicating from other brokers. This makes Kafka amazing!
### Question 17: Select all that applies (select THREE)
A. min.insync.replicas is a producer setting

B. acks is a topic setting

C. acks is a producer setting

D. min.insync.replicas is a topic setting

E. min.insync.replicas matters regardless of the values of acks

F. min.insync.replicas only matters if acks=all

Answer: C, D, F

Explanation: acks is a producer setting, min.insync.replicas is a topic or broker setting and is only effective when acks=all

---

## Trang 8: Question 18: A customer has many consumer applications that process messages from a Kafka topic. Eac…

### Question 18: A customer has many consumer applications that process messages from a Kafka topic. Each consumer application can only process 50 MB/s. Your customer wants to achieve a target throughput of 1 GB/s. What is the minimum number of partitions will you suggest to the customer for that particular topic?
A.10 B.20

C. 1 D.50

Answer: B

Explanation: each consumer can process only 50 MB/s, so we need at least 20 consumers consuming one partition so that 50 * 20 = 1000 MB target is achieved.
### Question 19: Your producer is producing at a very high rate and the batches are completely full each time. How can you improve the producer throughput? (select two)
A. Enable compression

B. Disable compression

C. Increase batch.size

D. Decrease batch.size

E. Decrease linger.ms

F. Increase linger.ms

Answer: A, C

Explanation: batch.size controls how many bytes of data to collect before sending messages to the Kafka broker. Set this as high as possible, without exceeding available memory. Enabling compression can also help make more compact batches and increase the throughput of your producer. Linger.ms will have no effect as the batches are already full
### Question 20: In Avro, adding a field to a record without default is a __ schema evolution
A. forward

B. backward

---

## Trang 9: Question 21: A consumer wants to read messages from a specific partition of a topic. How can this be…

C. full

D. breaking

Answer: A

Explanation: Clients with old schema will be able to read records saved with new schema.
### Question 21: A consumer wants to read messages from a specific partition of a topic. How can this be achieved?
A. Call subscribe(String topic, int partition) passing the topic and partition number as the arguments B. Call assign() passing a Collection of TopicPartitions as the argument

C. Call subscribe() passing TopicPartition as the argument

Answer: A, B

Explanation: assign() can be used for manual assignment of a partition to a consumer, in which case subscribe() must not be used. Assign() takes a collection of TopicPartition object as an argument https://kafka.apache.org/23/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html#a

ssign-java.util.Collection-
### Question 22: If I want to have an extremely high confidence that leaders and replicas have my data, I should use
A. acks=all, replication factor=2, min.insync.replicas=1

B. acks=1, replication factor=3, min.insync.replicas=2

C. acks=all, replication factor=3, min.insync.replicas=2

D. acks=all, replication factor=3, min.insync.replicas=1

Answer: C

Explanation: acks=all means the leader will wait for all in-sync replicas to acknowledge the record. Also the min in- sync replica setting specifies the minimum number of replicas that need to be in-sync for the partition to remain available for writes.

---

## Trang 10: Question 23: Where are the dynamic configurations for a topic stored?

### Question 23: Where are the dynamic configurations for a topic stored?
A. In Zookeeper

B. In an internal Kafka topic topic_configuratins

C. In server.properties

D. On the Kafka broker file system

Answer: A

Explanation: Dynamic topic configurations are maintained in Zookeeper.
### Question 24: You are using JDBC source connector to copy data from 2 tables to two Kafka topics. There is one connector created with max.tasks equal to 2 deployed on a cluster of 3 workers. How many tasks are launched?
A. 6

B. 1

C. 2

D. 3

Answer: C

Explanation: we have two tables, so the max number of tasks is 2
### Question 25: If I want to send binary data through the REST proxy to topic "test_binary", it needs to be base64 encoded. A consumer connecting directly into the Kafka topic
A. "test_binary" will receive

B. binary data

C. avro data

D. json data

E. base64 encoded data, it will need to decode it

Answer: B

Explanation:

---

## Trang 11: Question 26: Which is an optional field in an Avro record?

On the producer side, after receiving base64 data, the REST Proxy will convert it into bytes and then send that bytes payload to Kafka. Therefore consumers reading directly from Kafka will receive binary data.
### Question 26: Which is an optional field in an Avro record?
A. doc

B. name

C. namespace

D. fields

Answer: A

Explanation: doc represents optional description of message
### Question 27: A consumer application is using KafkaAvroDeserializer to deserialize Avro messages. What happens if message schema is not present in AvroDeserializer local cache?
A. Throws SerializationException

B. Fails silently

C. Throws DeserializationException

D. Fetches schema from Schema Registry

Answer: D

Explanation: First local cache is checked for the message schema. In case of cache miss, schema is pulled from the schema registry. An exception will be thrown in the Schema Registry does not have the schema (which should never happen if you set it up properly)
### Question 28: Which of the following event processing application is stateless? (select two)
A. Read events from a stream and modifies them from JSON to Avro

B. Publish the top 10 stocks each day

C. Read log messages from a stream and writes ERROR events into a high-priority stream and the rest of the events into a low-priority stream

D. Find the minimum and maximum stock prices for each day of trading

---

## Trang 12: Question 29: A consumer starts and has auto.offset.reset=latest, and the topic partition currently h…

Answer: A, C

Explanation: Stateless means processing of each message depends only on the message. So (A) converting from JSON to Avro or filtering a stream are both stateless operations. (C) pure filtering is stateless
### Question 29: A consumer starts and has auto.offset.reset=latest, and the topic partition currently has data for offsets going from 45 to 2311. The consumer group has committed the offset 643 for the topic before. Where will the consumer read from?
A. it will crash

B. offset 2311

C. offset 643

D. offset 45

Answer: C

Explanation: The offsets are already committed for this consumer group and topic partition, so the property auto.offset.reset is ignored
### Question 30: A Zookeeper ensemble contains 3 servers. Over which ports the members of the ensemble should be able to communicate in default configuration? (select three)
A. 2181

B. 3888

C. 443

D. 2888

E. 9092

F. 80

Answer: A, B, D

Explanation: 2181 - client port, 2888 - peer port, 3888 - leader port

---

## Trang 13: Question 31: To get acknowledgement of writes to only the leader partition, we need to use the confi…

### Question 31: To get acknowledgement of writes to only the leader partition, we need to use the config...
A. acks=1

B. acks=0

C. acks=all

Answer: A

Explanation: Producers can set acks=1 to get acknowledgement from partition leader only.
### Question 32: How will you find out all the partitions where one or more of the replicas for the partition are not in- sync with the leader?
A. kafka-topics.sh --bootstrap-server localhost:9092 --describe --unavailable-partitions

B. kafka-topics.sh --zookeeper localhost:2181 --describe --unavailable-partitions

C. kafka-topics.sh --broker-list localhost:9092 --describe --under-replicated-partitions

D. kafka-topics.sh --zookeeper localhost:2181 --describe --under-replicated-partitions

Answer: D

Explanation:
### Question 33: If a topic has a replication factor of 3, ...
A. 3 replicas of the same data will live on 1 broker

B. Each partition will live on 4 different brokers

C. Each partition will live on 2 different brokers

D. Each partition will live on 3 different brokers

Answer: D

Explanation: Replicas are spread across available brokers, and each replica = one broker. RF 3 = 3 brokers

---

## Trang 14: Question 34: How do Kafka brokers ensure great performance between the producers and consumers? (sel…

### Question 34: How do Kafka brokers ensure great performance between the producers and consumers? (select two)
A. It compresses the messages as it writes to the disk

B. It leverages zero-copy optimisations to send data straight from the page-cache

C. It buffers the messages on disk, and sends messages from the disk reads

D. It transforms the messages into a binary format

E. It does not transform the messages

Answer: B, E

Explanation: Kafka transfers data with zero-copy and sends the raw bytes it receives from the producer straight to the consumer, leveraging the RAM available as page cache
### Question 35: What isn't an internal Kafka Connect topic?
A. connect-status

B. connect-offsets

C. connect-configs

D. connect-jars

Answer: D

Explanation: connect-configs stores configurations, connect-status helps to elect leaders for connect, and connect- offsets store source offsets for source connectors
### Question 36: To enhance compression, I can increase the chances of batching by using
A. acks=all

B. linger.ms=20

C. batch.size=65536

D. max.message.size=10MB

Answer: B

Explanation:

---

## Trang 15: Question 37: There are 3 producers writing to a topic with 5 partitions. There are 5 consumers consu…

linger.ms forces the producer to wait before sending messages, hence increasing the chance of creating batches that can be heavily compressed.
### Question 37: There are 3 producers writing to a topic with 5 partitions. There are 5 consumers consuming from the topic. How many Controllers will be present in the cluster?
A.3 B.5

C. 2 D.1

Answer: A, B

Explanation: There is only one controller in a cluster at all times.
### Question 38: The exactly once guarantee in the Kafka Streams is for which flow of data?
A. Kafka => Kafka

B. Kafka => External

C. External => Kafka

Answer: A, B

Explanation: Kafka Streams can only guarantee exactly once processing if you have a Kafka to Kafka topology.
### Question 39: We would like to be in an at-most once consuming scenario. Which offset commit strategy would you recommend?
A. Commit the offsets on disk, after processing the data

B. Do not commit any offsets and read from beginning

C. Commit the offsets in Kafka, after processing the data

D. Commit the offsets in Kafka, before processing the data

Answer: A, B

---

## Trang 16: Question 40: A topic receives all the orders for the products that are available on a commerce site.…

Explanation: Here, we must commit the offsets right after receiving a batch from a call to .poll()
### Question 40: A topic receives all the orders for the products that are available on a commerce site. Two applications want to process all the messages independently - order fulfilment and monitoring. The topic has 4 partitions, how would you organise the consumers for optimal performance and resource usage?
A. Create 8 consumers in the same group with 4 consumers for each application

B. Create two consumers groups for two applications with 8 consumers in each

C. Create two consumer groups for two applications with 4 consumers in each

D. Create four consumers in the same group, one for each partition - two for fulfilment and two for monitoring

Answer: C

Explanation: two partitions groups - one for each application so that all messages are delivered to both the application. 4 consumers in each as there are 4 partitions of the topic, and you cannot have more consumers per groups than the number of partitions (otherwise they will be inactive and wasting resources)
### Question 41: Which of the following Kafka Streams operators are stateful? (select all that apply)
A. flatmap

B. reduce

C. joining

D. count

E. peek

F. aggregate

Answer: B, C, D, F

Explanation: See: https://kafka.apache.org/20/documentation/streams/developer-guide/dsl-api.html#stateful-transf

ormations

---

## Trang 17: Question 42: A bank uses a Kafka cluster for credit card payments. What should be the value of the p…

### Question 42: A bank uses a Kafka cluster for credit card payments. What should be the value of the property unclean.leader.election.enable?
A. FALSE

B. TRUE

Answer: A

Explanation: Setting unclean.leader.election.enable to true means we allow out-of-sync replicas to become leaders, we will lose messages when this occurs, effectively losing credit card payments and making our customers very angry.
### Question 43: A kafka topic has a replication factor of 3 and min.insync.replicas setting of 1. What is the maximum number of brokers that can be down so that a producer with acks=all can still produce to the topic?
A. 3

B. 0

C. 2

D. 1

Answer: C

Explanation: Two brokers can go down, and one replica will still be able to receive and serve data
### Question 44: I am producing Avro data on my Kafka cluster that is integrated with the Confluent Schema Registry. After a schema change that is incompatible, I know my data will be rejected. Which component will reject the data?
A. The Confluent Schema Registry

B. The Kafka Broker

C. The Kafka Producer itself

D. Zookeeper

Answer: A, B

---

## Trang 18: Question 45: How will you read all the messages from a topic in your KSQL query?

Explanation: The Confluent Schema Registry is your safeguard against incompatible schema changes and will be the component that ensures no breaking schema evolution will be possible. Kafka Brokers do not look at your payload and your payload schema, and therefore will not reject data.
### Question 45: How will you read all the messages from a topic in your KSQL query?
A. KSQL reads from the beginning of a topic, by default.

B. KSQL reads from the end of a topic. This cannot be changed.

C. Use KSQL CLI to set auto.offset.reset property to earliest

Answer: C

Explanation: Consumers can set auto.offset.reset property to earliest to start consuming from beginning. For
```
KSQL, SET 'auto.offset.reset'='earliest';
```
### Question 46: You want to sink data from a Kafka topic to S3 using Kafka Connect. There are 10 brokers in the cluster, the topic has 2 partitions with replication factor of 3. How many tasks will you configure for the S3 connector?
A. 10

B. 6

C. 3

D. 2

Answer: D

Explanation: ou cannot have more sink tasks (= consumers) than the number of partitions, so 2.
### Question 47: Producing with a key allows to...
A. Ensure per-record level security

B. Influence partitioning of the producer messages

C. Add more information to my message

D. Allow a Kafka Consumer to subscribe to a (topic,key) pair and only receive that data

---

## Trang 19: Question 48: Select all the way for one consumer to subscribe simultaneously to the following topics…

Answer: B

Explanation: Keys are necessary if you require strong ordering or grouping for messages that share the same key. If you require that messages with the same key are always seen in the correct order, attaching a key to messages will ensure messages with the same key always go to the same partition in a topic. Kafka guarantees order within a partition, but not across partitions in a topic, so alternatively not providing a key - which will result in round-robin distribution across partitions - will not maintain such order.
### Question 48: Select all the way for one consumer to subscribe simultaneously to the following topics - topic.history, topic.sports, topic.politics? (select two)
```
A. consumer.subscribe(Pattern.compile("topic\..*"));
B. consumer.subscribe("topic.history");
consumer.subscribe("topic.sports");
consumer.subscribe("topic.politics");
C. consumer.subscribePrefix("topic.");
D. consumer.subscribe(Arrays.asList("topic.history", "topic.sports", "topic.politics"));
```
Answer: A, D

Explanation: Multiple topics can be passed as a list or regex pattern.
### Question 49: What isn't a feature of the Confluent schema registry?
A. Store avro data

B. Enforce compatibility rules

C. Store schemas

Answer: A

Explanation: avro data (records) is stored on brokers.

---

## Trang 20: Question 50: Which of the following errors are retriable from a producer perspective? (select two)

### Question 50: Which of the following errors are retriable from a producer perspective? (select two)
A. MESSAGE_TOO_LARGE

B. INVALID_REQUIRED_ACKS

C. NOT_ENOUGH_REPLICAS

D. NOT_LEADER_FOR_PARTITION

E. TOPIC_AUTHORIZATION_FAILED

Answer: C, D

Explanation: Both of these are retriable errors, others non-retriable errors. See the full list of errors and their "retriable" status here https://kafka.apache.org/protocol#protocol_error_codes
### Question 51: How will you find out all the partitions without a leader?
A. kafka-topics.sh --broker-list localhost:9092 --describe --under-replicated-partitions

B. kafka- topics.sh --bootstrap-server localhost:9092 --describe --unavailable-partitions

C. kafka-topics.sh --zookeeper localhost:2181 --describe --unavailable-partitions

D. kafka-topics.sh --zookeeper localhost:2181 --describe --under-replicated-partitions

Answer: B

Explanation: Please note that as of Kafka 2.2, the --zookeeper option is deprecated and you can now use kafka- topics.sh --bootstrap-server localhost:9092 --describe --unavailable-partitions
### Question 52: Which actions will trigger partition rebalance for a consumer group? (select three)
A. Increase partitions of a topic

B. Remove a broker from the cluster

C. Add a new consumer to consumer group

D. A consumer in a consumer group shuts down

F. Add a broker to the cluster

Answer: A, C, D

Explanation:

---

## Trang 21: Question 53: Kafka is configured with following parameters -log.retention.hours = 168 log.retention.…

Rebalance occurs when a new consumer is added, removed or consumer dies or paritions increased.
### Question 53: Kafka is configured with following parameters -log.retention.hours = 168 log.retention.minutes = 168 log.retention.ms = 168 How long will the messages be retained for?
A. Broker will not start due to bad configuration

B. 168 ms

C. 168 hours

D. 168 minutes

Answer: B

Explanation: If more than one similar config is specified, the smaller unit size will take precedence.
### Question 54: To read data from a topic, the following configuration is needed for the consumers
A. all brokers of the cluster, and the topic name

B. any broker to connect to, and the topic name

C. the list of brokers that have the data, the topic name and the partitions list

D. any broker, and the list of topic partitions

Answer: B

Explanation: All brokers can respond to Metadata request, so a client can connect to any broker in the cluster.
### Question 55: How does a consumer commit offsets in Kafka?
A. It directly sends a message to the consumer_offsets topic

B. It interacts with the Group Coordinator broker

C. It directly commits the offsets in Zookeeper

Answer: B

---

## Trang 22: Question 56: In Java, Avro SpecificRecords classes are

Explanation: Consumers do not directly write to the consumer_offsets topic, they instead interact with a broker that has been elected to manage that topic, which is the Group Coordinator broker
### Question 56: In Java, Avro SpecificRecords classes are
A. automatically generated from an Avro Schema

B. written manually by the programmer

C. automatically generated from an Avro Schema + a Maven / Gradle Plugin

Answer: C

Explanation: SpecificRecord is created from generated record classes
### Question 57: A producer is sending messages with null key to a topic with 6 partitions using the DefaultPartitioner. Where will the messages be stored?
A. Partition 5

B. Any of the topic partitions

C. The partition for the null key

D. Partition 0

Answer: B

Explanation: In &lt; Kafka 2.4.0, Message with no keys will be stored with round-robin strategy among partitions. Kafka 2.4.0 uses Sticky partitioner
### Question 58: A topic has three replicas and you set min.insync.replicas to 2. If two out of three replicas are not available, what happens when a consume request is sent to broker?
A. Data will be returned from the remaining in-sync replica

B. An empty message will be returned

C. NotEnoughReplicasException will be returned

D. A new leader for the partition will be elected

Answer: A

---

## Trang 23: Question 59: In Avro, removing a field that does not have a default is a

Explanation: With this configuration, a single in-sync replica is still readable, but not writeable if the producer using acks=all
### Question 59: In Avro, removing a field that does not have a default is a
A. breaking

B. full

C. backward

D. forward

Answer: C

Explanation: Clients with new schema will be able to read records saved with old schema.
### Question 60: An ecommerce website maintains two topics - a high volume "purchase" topic with 5 partitions and low volume "customer" topic with 3 partitions. You would like to do a stream-table join of these topics. How should you proceed?
A. Repartition the purchase topic to have 3 partitions

B. Repartition customer topic to have 5 partitions

C. Model customer as a GlobalKTable

D. Do a KStream / KTable join after a repartition step

Answer: C, D

Explanation: In case of KStream-KStream join, both need to be co-partitioned. This restriction is not applicable in case of join with GlobalKTable, which is the most efficient here.
### Question 61: You are sending messages with keys to a topic. To increase throughput, you decide to increase the number of partitions of the topic. Select all that apply.
A. All the existing records will get rebalanced among the partitions to balance load

B. New records with the same key will get written to the partition where old records with that key were written

---

## Trang 24: Question 62: In Kafka Streams, by what value are internal topics prefixed by?

C. New records may get written to a different partition

D. Old records will stay in their partitions

Answer: C, D

Explanation: Increasing the number of partition causes new messages keys to get hashed differently, and breaks the guarantee "same keys goes to the same partition". Kafka logs are immutable and the previous messages are not re-shuffled
### Question 62: In Kafka Streams, by what value are internal topics prefixed by?
A. tasks-&lt;number>

B. application.id

C. group.id

D. kafka-streams-

Answer: B

Explanation: In Kafka Streams, the application.id is also the underlying group.id for your consumers, and the prefix for all internal topics (repartition and state)
### Question 63: You are using JDBC source connector to copy data from 3 tables to three Kafka topics. There is one connector created with max.tasks equal to 2 deployed on a cluster of 3 workers. How many tasks are launched?
A. 2

B. 1

C. 3

D. 6

Answer: A

Explanation: here, we have three tables, but the max.tasks is 2, so that's the maximum number of tasks that will be created

---

## Trang 25: Question 64: You are doing complex calculations using a machine learning framework on records fetche…

### Question 64: You are doing complex calculations using a machine learning framework on records fetched from a Kafka topic. It takes more about 6 minutes to process a record batch, and the consumer enters rebalances even though it's still running. How can you improve this scenario?
A. Increase max.poll.interval.ms to 600000

B. Increase heartbeat.interval.ms to 600000

C. Increase session.timeout.ms to 600000

D. Add consumers to the consumer group and kill them right away

Answer: A

Explanation: Here, we need to change the setting max.poll.interval.ms (default 300000) to its double in order to tell Kafka a consumer should be considered dead if the consumer only if it hasn't called the .poll() method in 10 minutes instead of 5.
### Question 65: What data format isn't natively available with the Confluent REST Proxy?
A. avro

B. binary

C. protobuf

D. json

Answer: C

Explanation: Protocol buffers isn't a natively supported type for the Confluent REST Proxy, but you may use the binary format instead
### Question 66: The kafka-console-consumer CLI, when used with the default options
A. uses a random group id

B. always uses the same group id

C. does not use a group id

Answer: A

---

## Trang 26: Question 67: We have a store selling shoes. What dataset is a great candidate to be modeled as a KTa…

Explanation: If a group is not specified, the kafka-console-consumer generates a random consumer group.
### Question 67: We have a store selling shoes. What dataset is a great candidate to be modeled as a KTable in Kafka Streams?
A. Money made until now

B. The transaction stream

C. Items returned

D. Inventory contents right now

Answer: A, C

Explanation: Aggregations of stream are stored in table, whereas Streams must be modeled as a KStream to avoid data explosion
### Question 68: When using plain JSON data with Connect, you see the following error messageorg.apache.kafka.connect.errors.DataExceptionJsonDeserializer with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. How will you fix the error?
A. Set key.converter, value.converter to JsonConverter and the schema registry url

B. Use Single Message Transforms to add schema and payload fields in the message

C. Set key.converter.schemas.enable and value.converter.schemas.enable to false

D. Set key.converter, value.converter to AvroConverter and the schema registry url

Answer: C

Explanation: You will need to set the schemas.enable parameters for the converter to false for plain text with no schema.
### Question 69: To allow consumers in a group to resume at the previously committed offset, I need to set the proper value for...
A. value.deserializer

B. auto.offset.resets

---

## Trang 27: Question 70: A Zookeeper ensemble contains 5 servers. What is the maximum number of servers that can…

C. group.id

D. enable.auto.commit

Answer: C

Explanation: Setting a group.id that's consistent across restarts will allow your consumers part of the same group to resume reading from where offsets were last committed for that group
### Question 70: A Zookeeper ensemble contains 5 servers. What is the maximum number of servers that can go missing and the ensemble still run?
A.3 B.4

C. 2 D.1

Answer: C

Explanation: Majority consists of 3 zk nodes for 5 nodes zk cluster, so 2 can fail
### Question 71: A consumer sends a request to commit offset 2000. There is a temporary communication problem, so the broker never gets the request and therefore never responds. Meanwhile, the consumer processed another batch and successfully committed offset 3000. What should you do?
A. Add a new consumer to the group

B. Use the kafka-consumer-group command to manually commit the offsets 2000 for the consumer group

C. Restart the consumer

D. Nothing

Answer: D

Explanation:

---

## Trang 28: Question 72: Your topic is log compacted and you are sending a message with the key K and value null…

In this case, because the offset 3000 has been committed and all the messages between 0 and 3000 have all been processed, it is okay not to have committed offset 2000. The right answer is to do "nothing", this behaviour is acceptable
### Question 72: Your topic is log compacted and you are sending a message with the key K and value null. What will happen?
A. The broker will delete all messages with the key K upon cleanup

B. The producer will throw a Runtime exception

C. The broker will delete the message with the key K and null value only upon cleanup

D. The message will get ignored by the Kafka broker

Answer: A

Explanation: Sending a message with the null value is called a tombstone in Kafka and will ensure the log compacted topic does not contain any messages with the key K upon compaction
### Question 73: How often is log compaction evaluated?
A. Every time a new partition is created

B. Every time a segment is closed

C. Every time a message is sent to Kafka

D. Every time a message is flushed to disk

Answer: A, B

Explanation: Log compaction is evaluated every time a segment is closed. It will be triggered if enough data is "dirty" (see dirty ratio config)
### Question 74: A producer application in a developer machine was able to send messages to a Kafka topic. After copying the producer application into another developer's machine, the producer is able to connect to Kafka but unable to produce to the same Kafka topic because of an authorization issue. What is the likely issue?
A. Broker configuration needs to be changed to allow a different producer

B. You cannot copy a producer application from one machine to another

C. The Kafka ACL does not allow another machine IP

---

## Trang 29: Question 75: A producer just sent a message to the leader broker for a topic partition. The producer…

D. The Kafka Broker needs to be rebooted

Answer: C

Explanation: ACLs take "Host" as a parameter, which represents an IP. It can be * (all IP), or a specific IP. Here, it's a specific IP as moving a producer to a different machine breaks the consumer, so the ACL needs to be updated #security
### Question 75: A producer just sent a message to the leader broker for a topic partition. The producer used acks=1 and therefore the data has not yet been replicated to followers. Under which conditions will the consumer see the message?
A. Right away

B. When the message has been fully replicated to all replicas

C. Never, the produce request will fail

D. When the high watermark has advanced

Answer: D

Explanation: The high watermark is an advanced Kafka concept, and is advanced once all the ISR replicates the latest offsets. A consumer can only read up to the value of the High Watermark (which can be less than the highest offset, in the case of acks=1)
### Question 76: Which Kafka CLI should you use to consume from a topic?
A. kafka-console-consumer

B. kafka-topics

C. kafka-console

D. kafka-consumer-groups

Answer: A

Explanation: Examplekafka-console-consumer --bootstrap-server 127.0.0.1:9092 --topic test --from-beginning

---

## Trang 30: Question 77: The Controller is a broker that is... (select two)

### Question 77: The Controller is a broker that is... (select two)
A. elected by Zookeeper ensemble

B. is responsible for partition leader election

C. elected by broker majority

D. is responsible for consumer group rebalances

Answer: A, B

Explanation: Controller is a broker that in addition to usual broker functions is responsible for partition leader election. The election of that broker happens thanks to Zookeeper and at any time only one broker can be a controller
### Question 78: What kind of delivery guarantee this consumer offers?
```
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(100);
            try { consumer.commitSync();
            } catch (CommitFailedException e) { log.error("commit failed", e)
            }
            for (ConsumerRecord<String, String> record records) {
                System.out.printf("topic = %s, partition = %s, offset = %d, customer = %s, country =
%s",
                        record.topic(), record.partition(),
                        record.offset(), record.key(), record.value());
            }
        }
```
A. Exactly-once

B. At-least-once

C. At-most-once

Answer: C

Explanation: Here offset is committed before processing the message. If consumer crashes before processing the message, message will be lost when it comes back up.

---

## Trang 31: Question 79: What Java library is KSQL based on?

### Question 79: What Java library is KSQL based on?
A. Kafka Streams

B. REST Proxy

C. Schema Registry

D. Kafka Connect

Answer: A

Explanation: KSQL is based on Kafka Streams and allows you to express transformations in the SQL language that get automatically converted to a Kafka Streams program in the backend.
### Question 80: A producer application was sending messages to a partition with a replication factor of 2 by connecting to Broker 1 that was hosting partition leader. If the Broker 1 goes down, what will happen?
A. The producer will automatically produce to the broker that has been elected leader

B. The topic will be unavailable

C. The producer will stop working

Answer: A

Explanation: Once the client connects to any broker, it is connected to the entire cluster and in case of leadership changes, the clients automatically do a Metadata Request to an available broker to find out who is the new leader for the topic. Hence the producer will automatically keep on producing to the correct Kafka Broker
### Question 81: How can you gracefully make a Kafka consumer to stop immediately polling data from Kafka and gracefully shut down a consumer application?
A. Call consumer.wakeUp() and catch a WakeUpException

B. Call consumer.poll() in another thread

C. Kill the consumer thread

Answer: A

---

## Trang 32: Question 82: To prevent network-induced duplicates when producing to Kafka, I should use

Explanation: See https://stackoverflow.com/a/37748336/3019499
### Question 82: To prevent network-induced duplicates when producing to Kafka, I should use
A. max.in.flight.requests.per.connection=1

B. enable.idempotence=true

C. retries=200000

D. batch.size=1

Answer: B

Explanation: Producer idempotence helps prevent the network introduced duplicates. More details herehttps://cwiki.apache.org/confluence/display/KAFKA/Idempotent+Producer
### Question 83: Once sent to a topic, a message can be modified
A.No

B. Yes

Answer: A

Explanation: Kafka logs are append-only and the data is immutable
### Question 84: A consumer wants to read messages from partitions 0 and 1 of a topic topic1. Code snippet is shown below.
```
consumer.subscribe(Arrays.asList("topic1"));
List<TopicPartition> pc = new ArrayList<>();
pc.add(new PartitionTopic("topic1", 0));
pc.add(new PartitionTopic("topic1", 1));
consumer.assign(pc);
```
A. This works fine. subscribe() will subscribe to the topic and assign() will assign partitions to the consumer.

B. Throws IllegalStateException

Answer: B

---

## Trang 33: Question 85: A consumer starts and has auto.offset.reset=none, and the topic partition currently has…

Explanation: subscribe() and assign() cannot be called by the same consumer, subscribe() is used to leverage the consumer group mechanism, while assign() is used to manually control partition assignment and reads assignment
### Question 85: A consumer starts and has auto.offset.reset=none, and the topic partition currently has data for offsets going from 45 to 2311. The consumer group has committed the offset 10 for the topic before. Where will the consumer read from?
A. offset 45

B. offset 10

C. it will crash

D. offset 2311

Answer: C

Explanation: auto.offset.reset=none means that the consumer will crash if the offsets it's recovering from have been deleted from Kafka, which is the case here, as 10 &lt; 45
### Question 86: The rule "same key goes to the same partition" is true unless...
A. the number of producer changes

B. the number of kafka broker changes

C. the number of partition changes

D. the replication factor changes

Answer: C

Explanation: Increasing the number of partition causes new messages keys to get hashed differently, and breaks the guarantee "same keys goes to the same partition". Kafka logs are immutable and the previous messages are not re-shuffled.
### Question 87: What is returned by a producer.send() call in the Java API?
A. Future&lt;ProducerRecord> object

---

## Trang 34: Question 3: What information isn't stored inside of Zookeeper? (select two)

B. A Boolean indicating if the call succeeded

C. Future&lt;RecordMetadata> object

D. Unit

Answer: C

Explanation: Seehttps://kafka.apache.org/21/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

---

## Trang 35: Question 3: What information isn't stored inside of Zookeeper? (select two)

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

---

## Trang 36: Question 3: What information isn't stored inside of Zookeeper? (select two)

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 37: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 38: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 39: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 40: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 41: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 42: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 43: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 44: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 45: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 46: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 47: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 48: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 49: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 50: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 51: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 52: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 53: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 54: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 55: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 56: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 57: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 58: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 59: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 60: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 61: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 62: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 63: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 64: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 65: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 66: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 67: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 68: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 69: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 70: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 71: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 72: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 73: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 74: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 75: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 76: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 77: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 78: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 79: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 80: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 81: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 82: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 83: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 84: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 85: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 86: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 87: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 88: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

---

## Trang 89: Question 3: What information isn't stored inside of Zookeeper? (select two)

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 90: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 91: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 92: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 93: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 94: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 95: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 96: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 97: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 98: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 99: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 100: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 101: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 102: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 103: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 104: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 105: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 106: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 107: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 108: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 109: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 110: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 111: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 112: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 113: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 114: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 115: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 116: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 117: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 118: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 119: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 120: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 121: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

---

## Trang 122: Question 3: What information isn't stored inside of Zookeeper? (select two)

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 123: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 124: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 125: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 126: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 127: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 128: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 129: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 130: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 131: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 132: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 133: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 134: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

---

## Trang 135: Question 3: What information isn't stored inside of Zookeeper? (select two)

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation:

---

## Trang 136: Question 3: What information isn't stored inside of Zookeeper? (select two)

Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---

## Trang 137: Question 3: What information isn't stored inside of Zookeeper? (select two)

### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

---

## Trang 138: Question 3: What information isn't stored inside of Zookeeper? (select two)

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

---

## Trang 139: Question 3: What information isn't stored inside of Zookeeper? (select two)

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.
### Question 3: What information isn't stored inside of Zookeeper? (select two)
A. Schema Registry schemas

B. Consumer offset

C. ACL information

D. Controller registration

E. Broker registration info

Answer: A, B

Explanation: Consumer offsets are stored in a Kafka topic schemas in the _schemas topic.

---
