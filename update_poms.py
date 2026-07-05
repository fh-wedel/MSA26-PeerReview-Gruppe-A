import os
import re

pom_files = [
    'communicationService/pom.xml',
    'configuration-service/configuration-core/pom.xml',
    'matchingService/pom.xml',
    'notificationService/pom.xml',
    'responseService/pom.xml',
    'submission-service/pom.xml',
    'userService/pom.xml'
]

dependency_xml = """
        <!-- Shared API Client and Security Utils -->
        <dependency>
            <groupId>com.fh-wedel</groupId>
            <artifactId>api-client</artifactId>
            <version>0.0.1-SNAPSHOT</version>
        </dependency>
"""

for pom in pom_files:
    if not os.path.exists(pom):
        continue
    with open(pom, 'r') as f:
        content = f.read()

    # Add dependency before <!-- Lombok --> or at end of <dependencies>
    if 'api-client' not in content:
        if '<!-- Lombok -->' in content:
            content = content.replace('<!-- Lombok -->', dependency_xml + '\n        <!-- Lombok -->')
        else:
            content = content.replace('</dependencies>', dependency_xml + '\n    </dependencies>')

    # Remove client executions: <execution>...<id>generate-.*-client</id>...</execution>
    content = re.sub(r'<execution>\s*<id>generate-[a-z0-9-]+-client</id>.*?</execution>', '', content, flags=re.DOTALL)

    with open(pom, 'w') as f:
        f.write(content)

print("POMs updated.")
