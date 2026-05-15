import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LogsInfra } from '../lib/logs';

test('Log group created with default retention', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    LogsInfra.createLogGroup(stack, {
        logGroupName: '/ecs/test-service',
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/test-service',
        RetentionInDays: 7,
    });
});

test('ECS log driver is wired into task definition', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const logGroup = LogsInfra.createLogGroup(stack, {
        logGroupName: '/ecs/test-service',
    });

    const taskDefinition = new ecs.FargateTaskDefinition(stack, 'TaskDef', {
        memoryLimitMiB: 512,
        cpu: 256,
    });

    taskDefinition.addContainer('AppContainer', {
        image: ecs.ContainerImage.fromRegistry('example.com/demo:latest'),
        memoryLimitMiB: 256,
        logging: LogsInfra.createEcsLogDriver(logGroup, 'test-service'),
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
                LogConfiguration: {
                    LogDriver: 'awslogs',
                    Options: Match.objectLike({
                        'awslogs-group': Match.anyValue(),
                        'awslogs-region': Match.anyValue(),
                        'awslogs-stream-prefix': 'test-service',
                    }),
                },
            }),
        ]),
    });
});

test('Log group created with custom retention', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    LogsInfra.createLogGroup(stack, {
        logGroupName: '/ecs/test-service',
        retention: logs.RetentionDays.ONE_MONTH,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/test-service',
        RetentionInDays: 30,
    });
});
