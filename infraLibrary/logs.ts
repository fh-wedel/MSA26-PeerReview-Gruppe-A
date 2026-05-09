import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs/lib/construct';

export interface LogsCreationProps {
    /**
     * The name of the log group. This is required to ensure that log groups are easily identifiable and organized.
     */
    logGroupName: string;

    /**
     * The number of days log events are kept in CloudWatch Logs. When the retention period expires, the log events are automatically deleted. For valid values, see RetentionInDays in the CloudWatch Logs API Reference.
     * @default logs.RetentionDays.ONE_WEEK
     */
    retention?: logs.RetentionDays;
}

export class LogsInfra {
    public static createLogGroup(scope: Construct, props: LogsCreationProps): logs.LogGroup {
        return new logs.LogGroup(scope, `${props.logGroupName}LogGroup`, {
            logGroupName: props.logGroupName,
            retention: props.retention ?? logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }

    public static createEcsLogDriver(logGroup: logs.LogGroup, streamPrefix: string): ecs.LogDriver {
        return ecs.LogDriver.awsLogs({
            logGroup: logGroup,
            streamPrefix: streamPrefix,
        });
    }
}