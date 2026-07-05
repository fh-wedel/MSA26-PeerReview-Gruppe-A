import xml.etree.ElementTree as ET
import glob

print("# CRAP Index Report")
print("This report highlights methods with the highest CRAP scores across all services.\n")
print("CRAP(m) = comp(m)^2 * (1 - cov(m))^3 + comp(m)")
print("where `comp` is cyclomatic complexity and `cov` is instruction coverage.\n")

xml_files = glob.glob('*/target/site/jacoco/jacoco.xml') + glob.glob('*/*/target/site/jacoco/jacoco.xml')

all_methods = []

for file_path in xml_files:
    service_name = file_path.split('/')[0]
    if service_name == 'configuration-service':
        service_name = 'configuration-service'
    
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        for pkg in root.findall('package'):
            pkg_name = pkg.get('name').replace('/', '.')
            for cls in pkg.findall('class'):
                cls_name = cls.get('name').split('/')[-1]
                
                for method in cls.findall('method'):
                    method_name = method.get('name')
                    
                    # Exclude auto-generated methods and lambdas
                    if method_name.startswith('lambda$') or '<init>' in method_name or '<clinit>' in method_name or cls_name.endswith('Builder'):
                        continue
                    
                    if method_name in ('equals', 'hashCode', 'toString'):
                        continue
                        
                    comp_missed = 0
                    comp_covered = 0
                    instr_missed = 0
                    instr_covered = 0
                    
                    for counter in method.findall('counter'):
                        ctype = counter.get('type')
                        if ctype == 'COMPLEXITY':
                            comp_missed = int(counter.get('missed'))
                            comp_covered = int(counter.get('covered'))
                        elif ctype == 'INSTRUCTION':
                            instr_missed = int(counter.get('missed'))
                            instr_covered = int(counter.get('covered'))
                            
                    comp = comp_missed + comp_covered
                    total_instr = instr_missed + instr_covered
                    cov = instr_covered / total_instr if total_instr > 0 else 0.0
                    
                    crap = (comp ** 2) * ((1 - cov) ** 3) + comp
                    
                    # Filter out very simple methods to reduce noise
                    if comp > 1:
                        all_methods.append({
                            'service': service_name,
                            'class': cls_name,
                            'method': method_name,
                            'comp': comp,
                            'cov': cov,
                            'crap': crap
                        })
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")

all_methods.sort(key=lambda x: x['crap'], reverse=True)

print("## Top 30 Most Complex/Risky Methods\n")
print("| Service | Class | Method | Complexity | Coverage | CRAP Score |")
print("|---------|-------|--------|------------|----------|------------|")
for m in all_methods[:30]:
    print(f"| {m['service']} | {m['class']} | {m['method']} | {m['comp']} | {m['cov']*100:.1f}% | {m['crap']:.2f} |")
