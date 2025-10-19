#!/usr/bin/env python3
"""
Fix requireAuth hoisting error in index.js
Moves requireAuth middleware definition to line 215 (after sessions and domains Maps)
"""

def fix_require_auth_hoisting(file_path):
    """
    Fix the requireAuth hoisting issue by moving the middleware definition
    to before its first usage
    """
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Total lines in file: {len(lines)}")
    
    # Find the requireAuth middleware definition (around line 4534)
    require_auth_start = None
    require_auth_end = None
    
    for i, line in enumerate(lines):
        if 'const requireAuth = async (c, next)' in line or 'const requireAuth = (c, next)' in line:
            require_auth_start = i
            print(f"Found requireAuth definition at line {i + 1}")
            # Find the end of the function (next closing brace at same indent level)
            brace_count = 0
            for j in range(i, len(lines)):
                if '{' in lines[j]:
                    brace_count += lines[j].count('{')
                if '}' in lines[j]:
                    brace_count -= lines[j].count('}')
                if brace_count == 0 and j > i:
                    require_auth_end = j
                    print(f"requireAuth ends at line {j + 1}")
                    break
            break
    
    if require_auth_start is None:
        print("ERROR: Could not find requireAuth definition")
        return False
    
    # Extract the requireAuth middleware code
    require_auth_code = lines[require_auth_start:require_auth_end + 1]
    print(f"Extracted {len(require_auth_code)} lines of requireAuth code")
    
    # Remove from original position
    del lines[require_auth_start:require_auth_end + 1]
    print(f"Removed requireAuth from original position")
    
    # Find where to insert (after line 214, which should be after domains Map)
    # Look for the line that contains "const domains = new Map()"
    insert_position = None
    for i, line in enumerate(lines):
        if 'const domains = new Map()' in line or 'const domains =' in line:
            insert_position = i + 1
            print(f"Found domains Map at line {i + 1}, will insert after it")
            break
    
    if insert_position is None:
        # Fallback: insert at line 215
        insert_position = 214  # 0-indexed, so line 215
        print(f"Using fallback insert position: line {insert_position + 1}")
    
    # Insert requireAuth code at new position
    lines[insert_position:insert_position] = ['\n'] + require_auth_code + ['\n']
    print(f"Inserted requireAuth at line {insert_position + 1}")
    
    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"✓ Successfully fixed requireAuth hoisting issue")
    print(f"✓ File saved: {file_path}")
    return True

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 fix_require_auth_hoisting.py <path_to_index.js>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = fix_require_auth_hoisting(file_path)
    sys.exit(0 if success else 1)
