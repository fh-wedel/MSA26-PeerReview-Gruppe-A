import re

with open('web-ui/src/pages/Admin.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = content.replace("import {fetchWorkflowPlugins, searchUsers, type WorkflowPlugin} from '../api/communication';",
"import {searchUsers} from '../api/communication';\nimport {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';")

# Update states and hooks
content = re.sub(r'const \[plugins, setPlugins\] = useState<WorkflowPlugin\[\] \| null>\(null\);\s*const \[loadingUsers, setLoadingUsers\] = useState\(true\);\s*const \[loadingPlugins, setLoadingPlugins\] = useState\(true\);',
'''const [userCount, setUserCount] = useState<number | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const { types, templates, loading: loadingPlugins } = useWorkflowPlugins();''', content)

# Remove the second state declaration for userCount
content = content.replace('const [userCount, setUserCount] = useState<number | null>(null);\n    const [userCount, setUserCount]', 'const [userCount, setUserCount]')

# Remove fetchWorkflowPlugins from useEffect
content = re.sub(r"// Fetch plugins.*?\.finally\(\(\) => setLoadingPlugins\(false\)\);", "", content, flags=re.DOTALL)

# Fix userCount state definition which I accidentally duplicated in regex
content = content.replace("const {user} = useAuth();\n    const [userCount, setUserCount] = useState<number | null>(null);\n    const [userCount, setUserCount] = useState<number | null>(null);", "const {user} = useAuth();\n    const [userCount, setUserCount] = useState<number | null>(null);")

# Update table to show types AND templates
content = content.replace("{plugins?.length || 0}", "{(types?.length || 0) + (templates?.length || 0)}")

table_block = """
            <TableContainer component={Paper} elevation={3} sx={{borderRadius: 2, overflow: 'hidden', mb: 4}}>
                <Typography variant="h6" sx={{p: 2, bgcolor: 'background.default'}}>Review Types</Typography>
                <Table>
                    <TableHead sx={{bgcolor: 'background.default'}}>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Name</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Title</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '50%'}}>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingPlugins ? (
                            <TableRow><TableCell colSpan={3}><Skeleton variant="text"/></TableCell></TableRow>
                        ) : types && types.length > 0 ? (
                            types.map((plugin) => (
                                <TableRow key={plugin.name} hover>
                                    <TableCell>{plugin.name}</TableCell>
                                    <TableCell>{plugin.title}</TableCell>
                                    <TableCell>{plugin.description}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} align="center">No types found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} elevation={3} sx={{borderRadius: 2, overflow: 'hidden'}}>
                <Typography variant="h6" sx={{p: 2, bgcolor: 'background.default'}}>Review Templates</Typography>
                <Table>
                    <TableHead sx={{bgcolor: 'background.default'}}>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Name</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Title</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '50%'}}>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingPlugins ? (
                            <TableRow><TableCell colSpan={3}><Skeleton variant="text"/></TableCell></TableRow>
                        ) : templates && templates.length > 0 ? (
                            templates.map((plugin) => (
                                <TableRow key={plugin.name} hover>
                                    <TableCell>{plugin.name}</TableCell>
                                    <TableCell>{plugin.title}</TableCell>
                                    <TableCell>{plugin.description}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} align="center">No templates found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
"""

content = re.sub(r'<TableContainer component=\{Paper\} elevation=\{3\} sx=\{\{borderRadius: 2, overflow: \'hidden\'\}\}>.*?</TableContainer>', table_block, content, flags=re.DOTALL)

with open('web-ui/src/pages/Admin.tsx', 'w') as f:
    f.write(content)
