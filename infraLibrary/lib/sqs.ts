import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface SqsCreationProps {

    /**
     * The physical name of the SQS queue.
     */
    queueName: string;

    /**
     * The duration that a message is hidden from subsequent retrieve 
     * requests after being retrieved by a consumer.
     * @default cdk.Duration.minutes(5)
     */
    visibilityTimeout?: cdk.Duration;

    /**
     * If true, a Dead Letter Queue (DLQ) will be automatically 
     * provisioned and attached to this queue.
     * The DLQ will have the same name as the main queue with '-DLQ' appended to it.
     * @default false
     */
    enableDeadLetterQueue?: boolean;

    /**
     * The number of times a message can be unsucessfully delivered 
     * before being moved to the dead-letter queue.
     * @onlyEffective If `enableDeadLetterQueue` is true.
     * @default 3
     */
    maxReceiveCount?: number;
}

export interface sqsQueues {
    queue: sqs.Queue;
    deadLetterQueue: sqs.IQueue | undefined;
}

export class SqsInfra {
    public static createQueue(stack: Construct, props: SqsCreationProps): sqsQueues {
        let deadLetterQueue: sqs.DeadLetterQueue | undefined = undefined;
        if (props.enableDeadLetterQueue) {
            const queue = new sqs.Queue(stack, `${props.queueName}-DLQ`, {
                queueName: `${props.queueName}-DLQ`,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            });
            deadLetterQueue = {
                queue: queue,
                maxReceiveCount: props.maxReceiveCount ?? 3,
            }
        }

        const queue = new sqs.Queue(stack, props.queueName, {
            queueName: props.queueName,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            visibilityTimeout: props.visibilityTimeout ?? cdk.Duration.minutes(5),
            deadLetterQueue: deadLetterQueue ?? undefined,
        });

        return { queue, deadLetterQueue: deadLetterQueue?.queue ?? undefined };
    };

    public static grantReadPermissions(queues: sqsQueues, grantee: cdk.aws_iam.IGrantable) {
        queues.queue.grantConsumeMessages(grantee);
        if (queues.deadLetterQueue) {
            queues.deadLetterQueue.grantConsumeMessages(grantee);
        }
    }

    public static grantWritePermissions(queues: sqsQueues, grantee: cdk.aws_iam.IGrantable) {
        queues.queue.grantSendMessages(grantee);
        if (queues.deadLetterQueue) {
            queues.deadLetterQueue.grantSendMessages(grantee);
        }
        if (queues.deadLetterQueue) {
            queues.deadLetterQueue.grant(grantee, 'sqs:SendMessage', 'sqs:GetQueueAttributes');
        }
    }

    public static grantFullAccess(queues: sqsQueues, grantee: cdk.aws_iam.IGrantable) {
        queues.queue.grant(grantee, 'sqs:*');
        if (queues.deadLetterQueue) {
            queues.deadLetterQueue.grant(grantee, 'sqs:*');
        }
    }
}

