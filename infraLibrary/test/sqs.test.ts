import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SqsInfra } from '../lib/sqs';

const extractPolicyActions = (template: Template): string[] => {
    const policies = template.findResources('AWS::IAM::Policy') as Record<string, any>;
    const statements = Object.values(policies).flatMap(
        (policy) => policy.Properties.PolicyDocument.Statement ?? []
    );

    return statements.flatMap((statement: any) =>
        Array.isArray(statement.Action) ? statement.Action : [statement.Action]
    );
};

test('createQueue creates a queue with defaults', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SQS::Queue', 1);
    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'test-queue',
        VisibilityTimeout: 300,
        RedrivePolicy: Match.absent(),
    });
});

test('createQueue respects custom visibility timeout', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
        visibilityTimeout: cdk.Duration.seconds(45),
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'test-queue',
        VisibilityTimeout: 45,
    });
});

test('createQueue creates a queue with a DLQ', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
        enableDeadLetterQueue: true,
        maxReceiveCount: 5,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SQS::Queue', 2);
    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'test-queue-DLQ',
    });
    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'test-queue',
        RedrivePolicy: Match.objectLike({
            maxReceiveCount: 5,
            deadLetterTargetArn: Match.anyValue(),
        }),
    });
});

test('createQueue uses default maxReceiveCount for DLQ', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
        enableDeadLetterQueue: true,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'test-queue',
        RedrivePolicy: Match.objectLike({
            maxReceiveCount: 3,
            deadLetterTargetArn: Match.anyValue(),
        }),
    });
});

test('grantReadPermissions adds consume actions', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const queues = SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
    });

    const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    SqsInfra.grantReadPermissions(queues, role);

    const template = Template.fromStack(stack);
    const actions = extractPolicyActions(template);

    expect(actions).toEqual(expect.arrayContaining(['sqs:ReceiveMessage']));
});

test('grantWritePermissions adds send actions', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const queues = SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
    });

    const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    SqsInfra.grantWritePermissions(queues, role);

    const template = Template.fromStack(stack);
    const actions = extractPolicyActions(template);

    expect(actions).toEqual(expect.arrayContaining(['sqs:SendMessage']));
});

test('grantWritePermissions adds DLQ attribute permissions', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const queues = SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
        enableDeadLetterQueue: true,
    });

    const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    SqsInfra.grantWritePermissions(queues, role);

    const template = Template.fromStack(stack);
    const actions = extractPolicyActions(template);

    expect(actions).toEqual(
        expect.arrayContaining(['sqs:SendMessage', 'sqs:GetQueueAttributes'])
    );
});

test('grantFullAccess adds full access actions', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const queues = SqsInfra.createQueue(stack, {
        queueName: 'test-queue',
    });

    const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    SqsInfra.grantFullAccess(queues, role);

    const template = Template.fromStack(stack);
    const actions = extractPolicyActions(template);

    expect(actions).toEqual(expect.arrayContaining(['sqs:*']));
});
