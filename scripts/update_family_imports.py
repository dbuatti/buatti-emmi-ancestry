#!/usr/bin/env python3
import os
import re

# List of family pages that need to be updated
family_pages = [
    "src/pages/FamilyPeople.tsx",
    "src/pages/FamilySearchCheckPage.tsx",
    "src/pages/FamilyPerson.tsx",
    "src/pages/PersonPage.tsx",
    "src/pages/FamilySources.tsx",
]

# Pattern for the import statement to update
old_import = "from '@/data/familyData'"
new_import = "from '@/data/familyDataWrapper'"

for file_path in family_pages:
    if os.path.exists(file_path):
        print(f"Updating {file_path}")
        with open(file_path, 'r') as f:
            content = f.read()

        # Replace the import statement
        updated_content = content.replace(old_import, new_import)

        # Write the updated content back to the file
        with open(file_path, 'w') as f:
            f.write(updated_content)
        print(f"  Updated {file_path}")
    else:
        print(f"  Warning: {file_path} not found")

print("All family pages updated successfully")